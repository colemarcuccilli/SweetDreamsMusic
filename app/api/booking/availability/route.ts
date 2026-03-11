import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const room = searchParams.get('room');

  if (!date) {
    return NextResponse.json({ error: 'Date is required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Query bookings where start_time falls on this date
  const dayStart = `${date}T00:00:00`;
  const dayEnd = `${date}T23:59:59`;

  let query = supabase
    .from('bookings')
    .select('start_time, duration')
    .gte('start_time', dayStart)
    .lte('start_time', dayEnd)
    .in('status', ['confirmed', 'pending']);

  if (room) {
    query = query.eq('room', room);
  }

  const { data: bookings, error } = await query;

  if (error) {
    console.error('Availability check error:', error);
    return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 });
  }

  // Convert bookings to blocked hour slots
  const bookedSlots: number[] = [];
  for (const booking of bookings || []) {
    const startHour = new Date(booking.start_time).getHours();
    const hours = booking.duration || 1;
    for (let i = 0; i < hours; i++) {
      const slot = (startHour + i) % 24;
      if (!bookedSlots.includes(slot)) {
        bookedSlots.push(slot);
      }
    }
  }

  return NextResponse.json({ bookedSlots });
}
