import { NextRequest, NextResponse } from 'next/server';

// TODO: Configure when Supabase is set up
// import { createClient } from '@supabase/supabase-js';
// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!
// );

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const room = searchParams.get('room');

  if (!date) {
    return NextResponse.json({ error: 'Date is required' }, { status: 400 });
  }

  // TODO: Query Supabase for existing bookings on this date/room
  // const { data: bookings } = await supabase
  //   .from('bookings')
  //   .select('start_time, end_time, duration_hours')
  //   .eq('session_date', date)
  //   .eq('room', room || '')
  //   .in('status', ['confirmed', 'pending']);
  //
  // Return booked time slots so the client can block them
  // return NextResponse.json({ bookedSlots: bookings });

  // Placeholder: return empty (all slots available)
  return NextResponse.json({ bookedSlots: [] });
}
