// app/api/media/checkout/route.ts
//
// Creates a Stripe Checkout session for a media offering. Phase C: full
// payment, no deposit logic — calendars / date-locking ship in Phase D and
// that's when partial deposits become useful.
//
// Flow:
//   1. Authenticate (401 if no session)
//   2. Look up offering by slug; reject if not found, not active, or inquire-priced
//   3. Re-check visibility against viewer (defense-in-depth — the page also
//      filters, but never trust the client to refuse a non-visible buy)
//   4. Create Stripe checkout session with full unit_amount
//   5. Stash everything the webhook needs in `metadata` (booking shape, hours,
//      band attribution) — webhook is the single source of truth for writing
//      `media_bookings` and `studio_credits`
//
// Mirrors `app/api/beats/checkout/route.ts` for tone and structure.

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { getOfferingBySlug } from '@/lib/media-server';
import { getUserBands } from '@/lib/bands-server';
import { isOfferingVisibleTo, viewerEligibilityFromBands } from '@/lib/media';
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
  try {
    const body = await request.json();
    slug = body.slug;
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
  // Anonymous viewers can't get here (we 401'd above). Solo users can't buy
  // band offerings. Page already enforces this; this is the server-side
  // double-check that prevents direct API calls bypassing the UI filter.
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
  // need an inquiry flow (covered by the page's "Send inquiry" CTA).
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
  // If the buyer is in exactly one band, the studio credits attach to the
  // band. If they're in multiple bands or none, credits attach to the user.
  // Multi-band attribution is a Phase D problem (the band hub will let
  // members pick the band before purchase).
  const bandIdForCredits =
    bandMemberships.length === 1 ? bandMemberships[0]?.band_id ?? null : null;

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
              description: offering.public_blurb ?? offering.description ?? undefined,
              tax_code: 'txcd_20030000', // Professional services - photography & video
            },
            unit_amount: offering.price_cents!,
          },
          quantity: 1,
        },
      ],
      success_url: `${SITE_URL}/dashboard/media?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/dashboard/media/${offering.slug}?status=cancelled`,
      customer_email: user.email,
      metadata: {
        // Type discriminator — webhook switches on this
        type: 'media_purchase',
        // Offering snapshot (so webhook doesn't need to re-fetch)
        offering_id: offering.id,
        offering_slug: offering.slug,
        offering_title: offering.title,
        offering_kind: offering.kind,
        // Studio hours that should flow into studio_credits on success
        studio_hours_included: String(offering.studio_hours_included || 0),
        // Buyer
        buyer_id: user.id,
        buyer_email: user.email,
        buyer_name: buyerName,
        // Band attribution (empty string = personal credit)
        band_id: bandIdForCredits ?? '',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[media] checkout creation error:', err);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
