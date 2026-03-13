import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json({ error: 'Date is required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Query ALL bookings on this date (studios share space, can't overlap)
  const dayStart = `${date}T00:00:00`;
  const dayEnd = `${date}T23:59:59`;

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('start_time, duration')
    .gte('start_time', dayStart)
    .lte('start_time', dayEnd)
    .in('status', ['confirmed', 'pending']);

  if (error) {
    console.error('Availability check error:', error);
    return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 });
  }

  // Convert bookings to blocked half-hour slots (decimal: 18.5 = 6:30 PM)
  const bookedSlots: number[] = [];
  for (const booking of bookings || []) {
    const st = new Date(booking.start_time);
    const startSlot = st.getUTCHours() + st.getUTCMinutes() / 60;
    const hours = booking.duration || 1;
    const halfHourCount = hours * 2;
    for (let i = 0; i < halfHourCount; i++) {
      const slot = (startSlot + i * 0.5) % 24;
      if (!bookedSlots.includes(slot)) {
        bookedSlots.push(slot);
      }
    }
  }

  return NextResponse.json({ bookedSlots });
}
