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

  // Fetch bookings where this engineer is assigned (with optional date range)
  let bookingsQuery = supabase
    .from('bookings')
    .select('id, customer_name, customer_email, start_time, end_time, duration, total_amount, deposit_amount, remainder_amount, actual_deposit_paid, status, room, requested_engineer, engineer_name, claimed_at, created_at, admin_notes, stripe_customer_id, stripe_payment_intent_id')
    .in('engineer_name', [...matchNames])
    .not('status', 'eq', 'cancelled')
    .order('start_time', { ascending: false });

  if (from) bookingsQuery = bookingsQuery.gte('start_time', from);
  if (to) bookingsQuery = bookingsQuery.lte('start_time', `${to}T23:59:59`);

  const { data: bookings } = await bookingsQuery;

  // Fetch media sales this engineer sold (check both sold_by and engineer_name for backward compat)
  let mediaSalesQuery = supabase
    .from('media_sales')
    .select('*')
    .or(`sold_by.in.(${[...matchNames].map(n => `"${n}"`).join(',')}),engineer_name.in.(${[...matchNames].map(n => `"${n}"`).join(',')})`)
    .order('created_at', { ascending: false });

  if (from) mediaSalesQuery = mediaSalesQuery.gte('created_at', from);
  if (to) mediaSalesQuery = mediaSalesQuery.lte('created_at', `${to}T23:59:59`);

  const { data: mediaSales } = await mediaSalesQuery;

  return NextResponse.json({
    bookings: bookings || [],
    mediaSales: mediaSales || [],
    engineerName,
  });
}
