import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyEngineerAccess } from '@/lib/admin-auth';
import { ENGINEERS } from '@/lib/constants';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const hasAccess = await verifyEngineerAccess(supabase);
  if (!hasAccess) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  // Engineer accounting ALWAYS shows only this engineer's data
  // Admins use Admin → Accounting for the full business view

  // Get this engineer's display name
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('user_id', user.id)
    .single();

  const engineerName = profile?.display_name || user.email || '';

  // Build list of names this engineer might be stored under
  const matchNames = new Set<string>([engineerName]);
  const engineerConfig = ENGINEERS.find(e => e.email === user.email);
  if (engineerConfig) {
    matchNames.add(engineerConfig.name);
    matchNames.add(engineerConfig.displayName);
  }

  // Fetch bookings — ALWAYS filtered to this engineer's sessions only.
  // Round 4: surface band-booking workflow fields so the engineer's
  // session list renders correctly when they're working a 3-day block
  // or a Sweet Spot add-on session.
  let bookingsQuery = supabase
    .from('bookings')
    .select('id, customer_name, customer_email, customer_phone, artist_name, start_time, end_time, duration, total_amount, deposit_amount, remainder_amount, actual_deposit_paid, status, room, requested_engineer, engineer_name, claimed_at, created_at, admin_notes, stripe_customer_id, stripe_payment_intent_id, booking_group_id, sweet_spot_addon, setup_minutes_before, band_id')
    .in('engineer_name', [...matchNames])
    .not('status', 'eq', 'cancelled')
    .order('start_time', { ascending: false });

  if (from) bookingsQuery = bookingsQuery.gte('start_time', from);
  if (to) bookingsQuery = bookingsQuery.lte('start_time', `${to}T23:59:59`);

  const { data: bookings } = await bookingsQuery;

  // Fetch media sales — ALWAYS filtered to this engineer's sales only
  let mediaSalesQuery = supabase
    .from('media_sales')
    .select('*')
    .or(`sold_by.in.(${[...matchNames].map(n => `"${n}"`).join(',')}),engineer_name.in.(${[...matchNames].map(n => `"${n}"`).join(',')})`)
    .order('created_at', { ascending: false });

  if (from) mediaSalesQuery = mediaSalesQuery.gte('created_at', from);
  if (to) mediaSalesQuery = mediaSalesQuery.lte('created_at', `${to}T23:59:59`);

  const { data: mediaSales } = await mediaSalesQuery;

  // Phase E follow-up: include media_session_bookings payouts. The new
  // Media Hub flow records engineer pay on `media_session_bookings.engineer_payout_cents`
  // when admin marks a session complete. Without this fetch, those earnings
  // would only show on the Engineer Media Sessions tab and never roll up
  // into the engineer's total earnings calculation here.
  let mediaSessionsQuery = supabase
    .from('media_session_bookings')
    .select('id, parent_booking_id, starts_at, ends_at, session_kind, location, status, engineer_payout_cents, engineer_payout_paid_at')
    .eq('engineer_id', user.id)
    .eq('status', 'completed')
    .not('engineer_payout_cents', 'is', null)
    .order('starts_at', { ascending: false });

  // Same date filter — use the payout-paid timestamp if present; otherwise
  // fall back to ends_at for sessions that completed without an explicit
  // payout date stamped (shouldn't happen in normal flow but defensive).
  if (from) mediaSessionsQuery = mediaSessionsQuery.gte('starts_at', from);
  if (to) mediaSessionsQuery = mediaSessionsQuery.lte('starts_at', `${to}T23:59:59`);

  const { data: mediaSessions } = await mediaSessionsQuery;

  return NextResponse.json({
    bookings: bookings || [],
    mediaSales: mediaSales || [],
    mediaSessions: mediaSessions || [],
    engineerName,
  });
}
