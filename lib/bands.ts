import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from './supabase/server';

// ============================================================
// Types
// ============================================================

export type BandRole = 'owner' | 'admin' | 'member';

export type BandPermissionFlag =
  | 'can_edit_public_page'
  | 'can_book_sessions'
  | 'can_book_band_sessions'
  | 'can_manage_members';

export type Band = {
  id: string;
  slug: string;
  display_name: string;
  bio: string | null;
  profile_picture_url: string | null;
  cover_image_url: string | null;
  genre: string | null;
  hometown: string | null;
  spotify_link: string | null;
  apple_music_link: string | null;
  instagram_link: string | null;
  facebook_link: string | null;
  youtube_link: string | null;
  soundcloud_link: string | null;
  tiktok_link: string | null;
  twitter_link: string | null;
  custom_links: Record<string, string> | null;
  is_public: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type BandMember = {
  id: string;
  band_id: string;
  user_id: string;
  role: BandRole;
  stage_name: string | null;
  band_role: string | null;
  can_edit_public_page: boolean;
  can_book_sessions: boolean;
  can_book_band_sessions: boolean;
  can_manage_members: boolean;
  joined_at: string;
};

export type BandMembership = BandMember & { band: Band };

export type BandInvite = {
  id: string;
  band_id: string;
  invited_email: string;
  invited_by: string;
  token: string;
  role: 'admin' | 'member';
  stage_name: string | null;
  band_role: string | null;
  can_edit_public_page: boolean;
  can_book_sessions: boolean;
  can_book_band_sessions: boolean;
  can_manage_members: boolean;
  expires_at: string;
  accepted_at: string | null;
  rejected_at: string | null;
  created_at: string;
};

// ============================================================
// Permission checks
// ============================================================

/**
 * Owners implicitly have every permission. Admins and members are governed
 * by their individual flags. Use this everywhere a permission check happens
 * so the owner-is-god rule stays consistent.
 */
export function memberHasFlag(member: BandMember, flag: BandPermissionFlag): boolean {
  if (member.role === 'owner') return true;
  return member[flag] === true;
}

export function isOwner(member: BandMember | null | undefined): boolean {
  return member?.role === 'owner';
}

export function isOwnerOrAdmin(member: BandMember | null | undefined): boolean {
  return member?.role === 'owner' || member?.role === 'admin';
}

// ============================================================
// Queries
// ============================================================

/**
 * Get the current user's membership (and band) for every band they belong to.
 * Ordered with bands the user owns first, then alphabetical.
 */
export async function getUserBands(
  userId: string,
  client?: SupabaseClient
): Promise<BandMembership[]> {
  const supabase = client || createServiceClient();
  const { data, error } = await supabase
    .from('band_members')
    .select('*, band:bands(*)')
    .eq('user_id', userId)
    .order('role', { ascending: true }) // owner < admin < member alphabetically = owner first? no → 'admin' < 'member' < 'owner' alphabetically. Fix:
    .order('joined_at', { ascending: false });

  if (error) {
    console.error('[bands] getUserBands error:', error);
    return [];
  }

  const rows = (data || []) as (BandMember & { band: Band | null })[];
  const withBand = rows.filter((r): r is BandMembership => !!r.band);

  // Sort owners first (supabase ordering on role didn't do this cleanly).
  withBand.sort((a, b) => {
    if (a.role === 'owner' && b.role !== 'owner') return -1;
    if (a.role !== 'owner' && b.role === 'owner') return 1;
    return a.band.display_name.localeCompare(b.band.display_name);
  });

  return withBand;
}

/**
 * Get a band by ID, including the list of members. Returns null if the band
 * doesn't exist.
 */
export async function getBandWithMembers(
  bandId: string,
  client?: SupabaseClient
): Promise<{ band: Band; members: BandMember[] } | null> {
  const supabase = client || createServiceClient();
  const { data: band, error: bandErr } = await supabase
    .from('bands')
    .select('*')
    .eq('id', bandId)
    .single();
  if (bandErr || !band) return null;

  const { data: members } = await supabase
    .from('band_members')
    .select('*')
    .eq('band_id', bandId)
    .order('role', { ascending: true })
    .order('joined_at', { ascending: true });

  return { band: band as Band, members: (members || []) as BandMember[] };
}

/**
 * Fetch a single membership record for a (band, user) pair. Null if the user
 * is not a member of the band.
 */
export async function getMembership(
  bandId: string,
  userId: string,
  client?: SupabaseClient
): Promise<BandMember | null> {
  const supabase = client || createServiceClient();
  const { data } = await supabase
    .from('band_members')
    .select('*')
    .eq('band_id', bandId)
    .eq('user_id', userId)
    .maybeSingle();
  return (data as BandMember | null) ?? null;
}

/**
 * Get pending invites addressed to an email (case-insensitive).
 */
export async function getPendingInvitesForEmail(
  email: string,
  client?: SupabaseClient
): Promise<(BandInvite & { band: Band })[]> {
  const supabase = client || createServiceClient();
  const { data } = await supabase
    .from('band_invites')
    .select('*, band:bands(*)')
    .ilike('invited_email', email)
    .is('accepted_at', null)
    .is('rejected_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  const rows = (data || []) as (BandInvite & { band: Band | null })[];
  return rows.filter((r): r is BandInvite & { band: Band } => !!r.band);
}

/**
 * Get pending invites for a band (for the members management UI).
 */
export async function getPendingInvitesForBand(
  bandId: string,
  client?: SupabaseClient
): Promise<BandInvite[]> {
  const supabase = client || createServiceClient();
  const { data } = await supabase
    .from('band_invites')
    .select('*')
    .eq('band_id', bandId)
    .is('accepted_at', null)
    .is('rejected_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });
  return (data || []) as BandInvite[];
}

// ============================================================
// Slug generation
// ============================================================

/**
 * Reserved slugs that would collide with App Router static segments under
 * /bands/. A band named "Accept" must not claim /bands/accept because that's
 * the invite acceptance route. Keep this in sync when adding new static
 * routes under app/bands/.
 */
const RESERVED_BAND_SLUGS = new Set<string>([
  'accept',  // /bands/accept/[token]
  'new',     // reserved for future /bands/new if we add public band creation
  'edit',
  'admin',
  'api',
]);

/**
 * Kebab-case a band name. Strips non-alphanumerics, collapses spaces.
 * Doesn't check uniqueness — caller appends a suffix if needed.
 */
export function bandSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/**
 * Produce a unique slug by appending -2, -3, ... if base is taken OR reserved.
 */
export async function uniqueBandSlug(
  base: string,
  client?: SupabaseClient
): Promise<string> {
  const supabase = client || createServiceClient();
  const safeBase = base || 'band';
  let candidate = safeBase;
  let suffix = 1;

  while (true) {
    const isReserved = RESERVED_BAND_SLUGS.has(candidate);
    if (isReserved) {
      suffix += 1;
      candidate = `${safeBase}-${suffix}`;
      continue;
    }
    const { data } = await supabase
      .from('bands')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();
    if (!data) return candidate;
    suffix += 1;
    candidate = `${safeBase}-${suffix}`;
  }
}

// ============================================================
// Tokens
// ============================================================

/**
 * Opaque random token for invite URLs. 32 bytes base64url ≈ 43 chars.
 */
export function generateInviteToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
