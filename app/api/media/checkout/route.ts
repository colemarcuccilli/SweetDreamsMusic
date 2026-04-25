// app/api/media/checkout/route.ts
//
// Creates a Stripe Checkout session for a media offering. Phase C.2: accepts
// an optional `configured_components` snapshot from the wizard, validates it
// against the offering's slot schema, and recomputes the final price
// server-side so client tampering can never change what gets charged.
//
// Flow:
//   1. Authenticate (401 if no session)
//   2. Look up offering by slug; reject if not found, not active, or inquire-priced
//   3. Re-check visibility against viewer (defense-in-depth)
//   4. If `configured_components` was sent: validate + recompute price
//      else: use the offering's base price
//   5. Create Stripe checkout session with the recomputed unit_amount
//   6. Stash everything the webhook needs in `metadata` — including a
//      stringified config snapshot so the webhook can write it to
//      media_bookings.configured_components
//
// Mirrors `app/api/beats/checkout/route.ts` for tone and structure.

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { getOfferingBySlug } from '@/lib/media-server';
import { getUserBands } from '@/lib/bands-server';
import { isOfferingVisibleTo, viewerEligibilityFromBands } from '@/lib/media';
import {
  type ConfiguredComponents,
  computeConfiguredPriceCents,
  describeConfig,
  isOfferingConfigurable,
  validateConfig,
  EMPTY_CONFIG,
} from '@/lib/media-config';
import { SITE_URL } from '@/lib/constants';

export async function POST(request: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return NextResponse.json({ error: 'Login required to purchase media services' }, { status: 401 });
  }

  // ── Parse + validate input ──────────────────────────────────────────
  let slug: string | undefined;
  let rawConfig: unknown;
  try {
    const body = await request.json();
    slug = body.slug;
    rawConfig = body.configured_components;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  if (!slug || typeof slug !== 'string') {
    return NextResponse.json({ error: 'slug required' }, { status: 400 });
  }

  // ── Look up offering ────────────────────────────────────────────────
  const offering = await getOfferingBySlug(slug);
  if (!offering || !offering.is_active) {
    return NextResponse.json({ error: 'Offering not found or unavailable' }, { status: 404 });
  }

  // ── Visibility check (defense-in-depth) ─────────────────────────────
  const bandMemberships = await getUserBands(user.id);
  const viewer = viewerEligibilityFromBands({
    authenticated: true,
    bandCount: bandMemberships.length,
  });
  if (!isOfferingVisibleTo(offering, viewer)) {
    return NextResponse.json({ error: 'Offering not available for your account' }, { status: 403 });
  }

  // ── Buyability check ────────────────────────────────────────────────
  // Inquire-priced or range-priced offerings can't auto-checkout — they
  // need an inquiry flow.
  const hasFixedPrice =
    offering.price_cents != null &&
    offering.price_range_low_cents == null &&
    offering.price_range_high_cents == null;
  if (!hasFixedPrice) {
    return NextResponse.json(
      { error: 'This offering requires a custom quote — please send an inquiry' },
      { status: 400 },
    );
  }

  // ── Validate + parse configured_components (if sent) ────────────────
  // Acceptable shapes:
  //   • undefined / missing      → use base price (legacy / non-configurable offerings)
  //   • { selections: { ... } }  → validate against schema, recompute price
  // Any other shape → 400.
  let config: ConfiguredComponents = EMPTY_CONFIG;
  if (rawConfig !== undefined && rawConfig !== null) {
    if (
      typeof rawConfig !== 'object' ||
      !('selections' in (rawConfig as object)) ||
      typeof (rawConfig as { selections: unknown }).selections !== 'object'
    ) {
      return NextResponse.json(
        { error: 'configured_components must be an object with a `selections` map' },
        { status: 400 },
      );
    }
    const selections = (rawConfig as { selections: Record<string, unknown> }).selections;
    // Coerce to typed snapshot — any non-conforming entries get rejected
    // by validateConfig below.
    config = { selections: selections as ConfiguredComponents['selections'] };

    // Reject configs sent against non-configurable offerings — likely a
    // client bug or someone poking the API directly. Empty selections are
    // tolerated (treated as "use base price").
    if (Object.keys(config.selections).length > 0 && !isOfferingConfigurable(offering)) {
      return NextResponse.json(
        { error: 'This offering has no configurable slots' },
        { status: 400 },
      );
    }

    const err = validateConfig(offering, config);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
  }

  // ── Recompute price (canonical, server-side) ────────────────────────
  const computedPrice = computeConfiguredPriceCents(offering, config);
  if (computedPrice == null || computedPrice <= 0) {
    return NextResponse.json(
      { error: 'Unable to compute a valid price for this configuration' },
      { status: 400 },
    );
  }

  // ── Buyer profile (for Stripe metadata + emails downstream) ─────────
  const { data: buyerProfile } = await supabase
    .from('profiles')
    .select('display_name, full_name')
    .eq('user_id', user.id)
    .single();

  const buyerName =
    buyerProfile?.full_name ||
    buyerProfile?.display_name ||
    user.email.split('@')[0] ||
    'Buyer';

  // ── Band attribution ────────────────────────────────────────────────
  // Single band → band credit. Multi/zero → personal credit.
  const bandIdForCredits =
    bandMemberships.length === 1 ? bandMemberships[0]?.band_id ?? null : null;

  // ── Build a description that reflects the configuration ────────────
  // Stripe shows this on the checkout page and in the receipt, so it's the
  // first place the buyer sees their selections written back to them.
  const decisionLines = describeConfig(offering, config);
  const baseDescription =
    offering.public_blurb ?? offering.description ?? offering.title;
  const description =
    decisionLines.length > 0
      ? `${baseDescription}\n\nYour build: ${decisionLines.join(' · ')}`
      : baseDescription;

  // ── Stash config in metadata ────────────────────────────────────────
  // Stripe metadata fields are limited to 500 chars each. Our largest
  // realistic config (Album with 4 slots × ~30 chars per entry) fits well
  // under that. We JSON.stringify so the webhook can re-parse without
  // re-fetching the offering. If it ever blows the limit we'd switch to
  // chunked metadata or a Supabase staging row, but it's fine for now.
  const configJson = JSON.stringify(config);

  // ── Create Stripe checkout ──────────────────────────────────────────
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      automatic_tax: { enabled: true },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: offering.title,
              description: description.slice(0, 500), // Stripe limit
              tax_code: 'txcd_20030000', // Professional services - photography & video
            },
            unit_amount: computedPrice,
          },
          quantity: 1,
        },
      ],
      success_url: `${SITE_URL}/dashboard/media?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/dashboard/media/${offering.slug}?status=cancelled`,
      customer_email: user.email,
      metadata: {
        type: 'media_purchase',
        offering_id: offering.id,
        offering_slug: offering.slug,
        offering_title: offering.title,
        offering_kind: offering.kind,
        studio_hours_included: String(offering.studio_hours_included || 0),
        buyer_id: user.id,
        buyer_email: user.email,
        buyer_name: buyerName,
        band_id: bandIdForCredits ?? '',
        // Snapshot of the wizard's choices — webhook will save this to
        // media_bookings.configured_components verbatim. Empty selections
        // are stored too so the row's snapshot is unambiguous.
        configured_components: configJson.slice(0, 500),
        // Pre-rendered human-readable summary of the wizard choices, joined
        // with ' · '. Webhook splits on this separator to populate the
        // confirmation email's "Your build" list. Storing the rendered
        // strings here means the webhook never has to re-fetch the offering
        // schema to translate slot keys into labels.
        configuration_summary:
          decisionLines.length > 0 ? decisionLines.join(' · ').slice(0, 500) : '',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[media] checkout creation error:', err);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
