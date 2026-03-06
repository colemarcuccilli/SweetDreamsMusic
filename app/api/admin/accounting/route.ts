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
    .order('created_at', { ascending: false });

  if (from) bookingsQuery = bookingsQuery.gte('start_time', from);
  if (to) bookingsQuery = bookingsQuery.lte('start_time', `${to}T23:59:59`);

  const { data: bookings } = await bookingsQuery;

  // Fetch all beat purchases (with optional date range)
  let purchasesQuery = supabase
    .from('beat_purchases')
    .select('id, beat_id, buyer_email, license_type, amount_paid, created_at, beats(title, producer)')
    .order('created_at', { ascending: false });

  if (from) purchasesQuery = purchasesQuery.gte('created_at', from);
  if (to) purchasesQuery = purchasesQuery.lte('created_at', `${to}T23:59:59`);

  const { data: beatPurchases } = await purchasesQuery;

  return NextResponse.json({
    bookings: bookings || [],
    beatPurchases: beatPurchases || [],
  });
}
