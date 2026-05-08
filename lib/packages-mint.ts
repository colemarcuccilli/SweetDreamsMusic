// lib/packages-mint.ts
//
// Entitlement minting on quote acceptance / payment success.
//
// Flow:
//   1. Customer accepts quote → Stripe Checkout Session created
//   2. Customer pays → Stripe webhook fires checkout.session.completed
//   3. Webhook calls mintEntitlementFromQuote() — that's this helper
//   4. Helper:
//        a. Marks the quote 'accepted' (race-safe)
//        b. Inserts a package_entitlement row with the right validity
//           window (one-off → now + duration_days; membership → now +
//           membership_months × ~30 days)
//        c. Inserts a per-line balance row for every template line,
//           snapshotting full_price_cents + package_value_cents
//        d. Returns the entitlement id
//   5. Webhook continues with email confirmation + admin alert
//
// Idempotency: if the quote is already accepted (e.g. webhook retry),
// returns the existing entitlement_id without re-inserting. The call
// is safe to retry.

import type { SupabaseClient } from '@supabase/supabase-js';

export interface QuoteForMint {
  id: string;
  template_id: string;
  user_id: string | null;
  band_id: string | null;
  status: string;
}

export interface TemplateForMint {
  is_membership: boolean;
  membership_months: number | null;
  duration_days: number | null;
}

export interface TemplateLineForMint {
  id: string;
  kind: 'studio_hours' | 'media_offering' | 'beat_credit' | 'custom';
  quantity: number;
  media_offering_id: string | null;
  full_price_cents: number;
  package_value_cents: number;
  notes: string | null;
}

export interface MintStripeData {
  /** Stripe Checkout Session id, for the audit trail. */
  stripeCheckoutSessionId?: string;
  /** Stripe Subscription id (memberships only). */
  stripeSubscriptionId?: string;
  /** Number of monthly iterations on the Stripe Subscription. */
  stripeSubscriptionIterations?: number;
  /** When the next monthly invoice is due (memberships only). */
  currentPeriodEnd?: string;
}

export interface MintResult {
  entitlementId: string;
  alreadyMinted: boolean;
}

/**
 * Mint an entitlement (or return the existing one) for an accepted quote.
 *
 * Caller is expected to use a service-role client — RLS on the package
 * tables denies anon and authenticated.
 */
export async function mintEntitlementFromQuote(
  service: SupabaseClient,
  quote: QuoteForMint,
  template: TemplateForMint,
  templateLines: TemplateLineForMint[],
  stripe: MintStripeData,
): Promise<MintResult> {
  // Idempotency: if the quote is already accepted, find the existing
  // entitlement and return it. Webhook retries hit this path.
  if (quote.status === 'accepted') {
    const { data: existing } = await service
      .from('package_entitlements')
      .select('id')
      .eq('quote_id', quote.id)
      .maybeSingle();
    if (existing) {
      return {
        entitlementId: (existing as { id: string }).id,
        alreadyMinted: true,
      };
    }
    // Quote is accepted but entitlement is missing — recover by
    // creating it. Shouldn't happen in practice but defensive.
  }

  // Compute the validity window.
  // One-off: now → now + duration_days
  // Membership: now → now + months × 30 days (close enough for human
  // readability; Stripe Subscription handles the actual billing dates)
  const now = new Date();
  const startsAt = now.toISOString();
  let endsAt: string;
  if (template.is_membership) {
    const months = template.membership_months ?? 3;
    const end = new Date(now);
    end.setMonth(end.getMonth() + months);
    endsAt = end.toISOString();
  } else {
    const days = template.duration_days ?? 60;
    const end = new Date(now);
    end.setDate(end.getDate() + days);
    endsAt = end.toISOString();
  }

  // Race-safe accept: only flips draft/sent → accepted, captures
  // accepted_at. Returns the row count so we know whether we won the
  // race. If 0 rows updated, another delivery beat us — bail with
  // alreadyMinted=true after looking up the entitlement.
  const { data: acceptUpdate, error: acceptErr } = await service
    .from('package_quotes')
    .update({ status: 'accepted', accepted_at: startsAt })
    .eq('id', quote.id)
    .in('status', ['draft', 'sent'])
    .select('id');
  if (acceptErr) {
    console.error('[mintEntitlement] quote accept update failed:', acceptErr);
    throw new Error(`Quote accept update failed: ${acceptErr.message}`);
  }
  const wonRace = !!acceptUpdate && acceptUpdate.length > 0;
  if (!wonRace) {
    // Lost the race — entitlement might already exist.
    const { data: existing } = await service
      .from('package_entitlements')
      .select('id')
      .eq('quote_id', quote.id)
      .maybeSingle();
    if (existing) {
      return {
        entitlementId: (existing as { id: string }).id,
        alreadyMinted: true,
      };
    }
    // Race-loss with no entitlement is anomalous; fall through to
    // mint anyway — better to have the entitlement than not.
  }

  // Insert the entitlement row.
  const { data: created, error: insertErr } = await service
    .from('package_entitlements')
    .insert({
      quote_id: quote.id,
      template_id: quote.template_id,
      user_id: quote.user_id,
      band_id: quote.band_id,
      status: 'active',
      payment_status: 'current',
      starts_at: startsAt,
      ends_at: endsAt,
      stripe_subscription_id: stripe.stripeSubscriptionId ?? null,
      stripe_subscription_iterations: stripe.stripeSubscriptionIterations ?? null,
      current_period_end: stripe.currentPeriodEnd ?? null,
    })
    .select('id')
    .single();
  if (insertErr || !created) {
    console.error('[mintEntitlement] entitlement insert failed:', insertErr);
    throw new Error(`Entitlement insert failed: ${insertErr?.message ?? 'unknown'}`);
  }
  const entitlementId = (created as { id: string }).id;

  // Insert per-line balances.
  if (templateLines.length > 0) {
    const balancesPayload = templateLines.map((line) => ({
      entitlement_id: entitlementId,
      template_line_id: line.id,
      kind: line.kind,
      media_offering_id: line.media_offering_id,
      full_price_cents: line.full_price_cents,
      package_value_cents: line.package_value_cents,
      notes: line.notes,
      quantity_granted: line.quantity,
      quantity_redeemed: 0,
      redemptions: [],
    }));
    const { error: balErr } = await service
      .from('package_entitlement_balances')
      .insert(balancesPayload);
    if (balErr) {
      // Entitlement exists but balances missing — surface but don't
      // fail the webhook (admin can re-trigger or fix manually).
      console.error('[mintEntitlement] balances insert failed:', balErr);
      throw new Error(`Balances insert failed: ${balErr.message}`);
    }
  }

  return { entitlementId, alreadyMinted: false };
}
