// lib/media-server.ts
//
// Server-only Media Booking Hub helpers. Same boundary rule as
// `events-server.ts` and `bands-server.ts`: imports the service Supabase
// client, so it MUST NOT be imported from any client component.
//
// Pure helpers (types, visibility rules, formatters) live in `lib/media.ts`
// and are safe for client components.

import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from './supabase/server';
import type { MediaOffering, ViewerEligibility } from './media';
import { isOfferingVisibleTo } from './media';

// ============================================================
// Catalog reads
// ============================================================

/**
 * All active offerings, ordered by `sort_order`. The public `/media` page
 * loads this and renders the catalog with prices hidden. The dashboard page
 * loads this and renders prices.
 *
 * Visibility rules (solo viewer can't see band offerings) are enforced at the
 * page layer via `isOfferingVisibleTo` — keeping the DB call simple and
 * cacheable. RLS already excludes `is_active = false` rows for non-admins.
 */
export async function getActiveOfferings(
  client?: SupabaseClient,
): Promise<MediaOffering[]> {
  const supabase = client || createServiceClient();
  const { data, error } = await supabase
    .from('media_offerings')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[media] getActiveOfferings error:', error);
    return [];
  }
  return (data || []) as MediaOffering[];
}

/**
 * Convenience: get the active catalog already filtered for a specific viewer.
 * Solo + anonymous viewers receive only `solo` and `both` offerings; band
 * viewers receive everything.
 *
 * Most pages will call this rather than `getActiveOfferings` + filter — but
 * the underlying primitive is exposed for the admin UI which wants to see
 * everything regardless of who's logged in.
 */
export async function getOfferingsForViewer(
  viewer: ViewerEligibility,
  client?: SupabaseClient,
): Promise<MediaOffering[]> {
  const all = await getActiveOfferings(client);
  return all.filter((o) => isOfferingVisibleTo(o, viewer));
}

/**
 * Single offering by slug — used on the offering detail page where the user
 * either reviews + checks out (logged in) or sees the public blurb (logged
 * out).
 *
 * Does NOT enforce visibility — callers decide whether a solo user lands on a
 * band-only offering URL gets a 404 or a "members only" message.
 */
export async function getOfferingBySlug(
  slug: string,
  client?: SupabaseClient,
): Promise<MediaOffering | null> {
  const supabase = client || createServiceClient();
  const { data } = await supabase
    .from('media_offerings')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  return (data as MediaOffering | null) ?? null;
}

/**
 * Admin-side: every row including inactive ones, ordered by sort_order.
 * Used by the (forthcoming) admin CRUD tab to manage the catalog.
 */
export async function getAllOfferingsForAdmin(
  client?: SupabaseClient,
): Promise<MediaOffering[]> {
  const supabase = client || createServiceClient();
  const { data, error } = await supabase
    .from('media_offerings')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) {
    console.error('[media] getAllOfferingsForAdmin error:', error);
    return [];
  }
  return (data || []) as MediaOffering[];
}

// ============================================================
// Booking reads (skeletons — the booking flow itself ships in Phase C)
// ============================================================

/**
 * Look up a user's media bookings. Returns the most recent first. Reads
 * directly from `media_bookings`; deliverables and discount codes are
 * fetched separately when needed.
 */
export async function getMediaBookingsForUser(
  userId: string,
  client?: SupabaseClient,
): Promise<unknown[]> {
  const supabase = client || createServiceClient();
  const { data, error } = await supabase
    .from('media_bookings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[media] getMediaBookingsForUser error:', error);
    return [];
  }
  return data || [];
}

/**
 * Remaining studio-hour balance ("gift card" view) for a user. Adds up
 * `(hours_granted - hours_used)` across every credit row they own, including
 * band-attached credits where they're a member.
 *
 * NOTE: This is the user's PERSONAL credit balance only. Band balances are
 * surfaced separately on the band hub via `getStudioCreditsForBand`. We
 * deliberately don't merge them here — different UX surfaces, different
 * permissions.
 */
export async function getStudioCreditBalanceForUser(
  userId: string,
  client?: SupabaseClient,
): Promise<{ hoursRemaining: number; costBasisCents: number }> {
  const supabase = client || createServiceClient();
  const { data, error } = await supabase
    .from('studio_credits')
    .select('hours_granted, hours_used, cost_basis_cents')
    .eq('user_id', userId);

  if (error || !data) {
    if (error) console.error('[media] getStudioCreditBalanceForUser error:', error);
    return { hoursRemaining: 0, costBasisCents: 0 };
  }

  let hoursRemaining = 0;
  let costBasisCents = 0;
  for (const row of data as {
    hours_granted: number;
    hours_used: number;
    cost_basis_cents: number | null;
  }[]) {
    hoursRemaining += Number(row.hours_granted) - Number(row.hours_used);
    costBasisCents += row.cost_basis_cents ?? 0;
  }
  return { hoursRemaining, costBasisCents };
}

/**
 * Same as above for a band. Any member can view the balance.
 */
export async function getStudioCreditBalanceForBand(
  bandId: string,
  client?: SupabaseClient,
): Promise<{ hoursRemaining: number; costBasisCents: number }> {
  const supabase = client || createServiceClient();
  const { data, error } = await supabase
    .from('studio_credits')
    .select('hours_granted, hours_used, cost_basis_cents')
    .eq('band_id', bandId);

  if (error || !data) {
    if (error) console.error('[media] getStudioCreditBalanceForBand error:', error);
    return { hoursRemaining: 0, costBasisCents: 0 };
  }

  let hoursRemaining = 0;
  let costBasisCents = 0;
  for (const row of data as {
    hours_granted: number;
    hours_used: number;
    cost_basis_cents: number | null;
  }[]) {
    hoursRemaining += Number(row.hours_granted) - Number(row.hours_used);
    costBasisCents += row.cost_basis_cents ?? 0;
  }
  return { hoursRemaining, costBasisCents };
}
