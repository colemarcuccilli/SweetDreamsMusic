import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyEngineerAccess } from '@/lib/admin-auth';

export async function GET() {
  const supabase = await createClient();
  const hasAccess = await verifyEngineerAccess(supabase);
  if (!hasAccess) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, customer_name, start_time, end_time, duration, room, total_amount, deposit_amount, status, created_at')
    .is('engineer_name', null)
    .in('status', ['confirmed', 'pending'])
    .order('start_time', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bookings: bookings || [] });
}
