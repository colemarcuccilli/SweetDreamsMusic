import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminAccess } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const isAdmin = await verifyAdminAccess(supabase);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  // Fetch all bookings (with optional date range)
  let bookingsQuery = supabase
    .from('bookings')
    .select('id, customer_name, customer_email, start_time, duration, total_amount, deposit_amount, remainder_amount, actual_deposit_paid, status, engineer_name, room, created_at')
    .not('status', 'eq', 'cancelled')
    .order('created_at', { ascending: false });

  if (from) bookingsQuery = bookingsQuery.gte('start_time', from);
  if (to) bookingsQuery = bookingsQuery.lte('start_time', `${to}T23:59:59`);

  const { data: bookings } = await bookingsQuery;

  // Fetch cancelled bookings with deposits (kept revenue)
  let cancelledQuery = supabase
    .from('bookings')
    .select('id, customer_name, start_time, total_amount, deposit_amount, actual_deposit_paid, status, created_at')
    .eq('status', 'cancelled')
    .order('created_at', { ascending: false });

  if (from) cancelledQuery = cancelledQuery.gte('start_time', from);
  if (to) cancelledQuery = cancelledQuery.lte('start_time', `${to}T23:59:59`);

  const { data: cancelledBookings } = await cancelledQuery;

  // Fetch all beat purchases (with optional date range)
  let purchasesQuery = supabase
    .from('beat_purchases')
    .select('id, beat_id, buyer_email, license_type, amount_paid, created_at, beats(title, producer)')
    .order('created_at', { ascending: false });

  if (from) purchasesQuery = purchasesQuery.gte('created_at', from);
  if (to) purchasesQuery = purchasesQuery.lte('created_at', `${to}T23:59:59`);

  const { data: beatPurchases } = await purchasesQuery;

  // Fetch media sales (with optional date range)
  let mediaSalesQuery = supabase
    .from('media_sales')
    .select('*')
    .order('created_at', { ascending: false });

  if (from) mediaSalesQuery = mediaSalesQuery.gte('created_at', from);
  if (to) mediaSalesQuery = mediaSalesQuery.lte('created_at', `${to}T23:59:59`);

  const { data: mediaSales } = await mediaSalesQuery;

  // Phase E follow-up: media_session_bookings payouts. Returned as a parallel
  // array (not merged into mediaSales) because the shape and accounting
  // semantics differ — these are admin-typed dollar amounts on completed
  // shoots, not commission-on-sale entries. The payroll calculator merges
  // them into per-engineer mediaWorkerPay so engineers get credit for media
  // shoots paid via the new flow.
  let mediaSessionsQuery = supabase
    .from('media_session_bookings')
    .select('id, parent_booking_id, engineer_id, starts_at, ends_at, session_kind, location, status, engineer_payout_cents, engineer_payout_paid_at')
    .eq('status', 'completed')
    .not('engineer_payout_cents', 'is', null)
    .order('starts_at', { ascending: false });

  if (from) mediaSessionsQuery = mediaSessionsQuery.gte('starts_at', from);
  if (to) mediaSessionsQuery = mediaSessionsQuery.lte('starts_at', `${to}T23:59:59`);

  const { data: mediaSessions } = await mediaSessionsQuery;

  // Resolve engineer_id → display_name so the payroll calculator can
  // merge these into the same per-engineer buckets it uses for
  // bookings.engineer_name and media_sales.filmed_by/edited_by.
  const engineerIds = Array.from(
    new Set((mediaSessions || []).map((r: { engineer_id: string }) => r.engineer_id)),
  );
  const engineerNameMap: Record<string, string> = {};
  if (engineerIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, email')
      .in('user_id', engineerIds);
    const { ENGINEERS } = await import('@/lib/constants');
    for (const p of (profiles || []) as Array<{ user_id: string; display_name: string | null; email: string | null }>) {
      // Prefer the canonical name from ENGINEERS (matches what bookings/media_sales
      // store) over profile display_name. Fall back to display_name if not in roster.
      const matchedRoster = p.email
        ? ENGINEERS.find((e) => e.email.toLowerCase() === p.email!.toLowerCase())
        : null;
      engineerNameMap[p.user_id] = matchedRoster?.name || p.display_name || 'Unknown';
    }
  }

  return NextResponse.json({
    bookings: bookings || [],
    cancelledBookings: cancelledBookings || [],
    beatPurchases: beatPurchases || [],
    mediaSales: mediaSales || [],
    mediaSessions: mediaSessions || [],
    engineerNameMap,
  });
}
