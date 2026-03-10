import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyEngineerAccess } from '@/lib/admin-auth';

export async function GET() {
  const supabase = await createClient();
  const hasAccess = await verifyEngineerAccess(supabase);
  if (!hasAccess) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  // Get this engineer's display name
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('user_id', user.id)
    .single();

  const engineerName = profile?.display_name || user.email || '';

  // Fetch all bookings where this engineer is assigned
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, customer_name, start_time, duration, total_amount, deposit_amount, remainder_amount, actual_deposit_paid, status, room, requested_engineer, engineer_name, claimed_at, created_at')
    .eq('engineer_name', engineerName)
    .order('start_time', { ascending: false });

  // Fetch media sales this engineer brought in
  const { data: mediaSales } = await supabase
    .from('media_sales')
    .select('*')
    .eq('engineer_name', engineerName)
    .order('created_at', { ascending: false });

  return NextResponse.json({
    bookings: bookings || [],
    mediaSales: mediaSales || [],
    engineerName,
  });
}
