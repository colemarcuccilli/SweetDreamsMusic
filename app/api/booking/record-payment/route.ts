import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyEngineerAccess } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const hasAccess = await verifyEngineerAccess(supabase);
  if (!hasAccess) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { bookingId, amount, method, note } = await request.json();
  if (!bookingId || !amount || !method) {
    return NextResponse.json({ error: 'bookingId, amount, and method required' }, { status: 400 });
  }

  // Get the booking
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('id, remainder_amount, total_amount')
    .eq('id', bookingId)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  const amountCents = Math.round(amount * 100);

  // Update remainder
  const newRemainder = Math.max(0, booking.remainder_amount - amountCents);
  await supabase.from('bookings').update({
    remainder_amount: newRemainder,
    updated_at: new Date().toISOString(),
  }).eq('id', bookingId);

  // Log the payment in audit log
  await supabase.from('booking_audit_log').insert({
    booking_id: bookingId,
    action: `${method}_payment`,
    performed_by: user.email || 'unknown',
    details: {
      amount: amountCents,
      method,
      note: note || '',
      previous_remainder: booking.remainder_amount,
      new_remainder: newRemainder,
    },
  });

  return NextResponse.json({
    success: true,
    amountRecorded: amountCents,
    newRemainder,
  });
}
