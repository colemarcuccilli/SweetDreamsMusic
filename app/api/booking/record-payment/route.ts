import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyEngineerAccess } from '@/lib/admin-auth';
import { checkBookingOwnership } from '@/lib/booking-ownership';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const hasAccess = await verifyEngineerAccess(supabase);
  if (!hasAccess) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { bookingId, amount, method, note, addToTotal } = await request.json();
  if (!bookingId || !amount || !method) {
    return NextResponse.json({ error: 'bookingId, amount, and method required' }, { status: 400 });
  }

  // Get the booking
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('id, remainder_amount, total_amount, engineer_name, customer_name')
    .eq('id', bookingId)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  // Ownership gate — engineers may only record payments on their own sessions.
  // Admins bypass this. Without this check, any engineer could record cash on
  // peers' sessions, which is how audits get unpleasant.
  const ownership = await checkBookingOwnership(supabase, booking.engineer_name);
  if (!ownership.isAdmin && !ownership.ownsBooking) {
    return NextResponse.json(
      { error: 'You can only record payments on sessions assigned to you.' },
      { status: 403 }
    );
  }

  const amountCents = Math.round(amount * 100);

  // If this is "Add Time" — increase total AND record the cash as paying for that added time
  // The net effect on remainder is: remainder stays the same (total goes up, cash covers it)
  // If this is a regular payment — just subtract from remainder
  let newTotal = booking.total_amount;
  let newRemainder = booking.remainder_amount;

  if (addToTotal) {
    // Added time/services: total increases, cash covers the increase
    newTotal = booking.total_amount + amountCents;
    // Remainder stays the same — the new charge is fully covered by the cash
    newRemainder = booking.remainder_amount;
  } else {
    // Regular payment against existing remainder
    newRemainder = Math.max(0, booking.remainder_amount - amountCents);
  }

  await supabase.from('bookings').update({
    total_amount: newTotal,
    remainder_amount: newRemainder,
    updated_at: new Date().toISOString(),
  }).eq('id', bookingId);

  // Log the payment in audit log — do not break payment recording on audit failure,
  // but DO log loudly to stderr so we can reconstruct what happened if needed.
  // (Previously this try/catch silently swallowed errors, which made the 2026-04-20
  // Bloodika duplicate-cash incident much harder to trace.)
  try {
    const { error: auditErr } = await supabase.from('booking_audit_log').insert({
      booking_id: bookingId,
      action: `${method}_payment`,
      performed_by: user.email || 'unknown',
      details: {
        amount: amountCents,
        method,
        note: note || '',
        addToTotal: !!addToTotal,
        previous_total: booking.total_amount,
        new_total: newTotal,
        previous_remainder: booking.remainder_amount,
        new_remainder: newRemainder,
      },
    });
    if (auditErr) {
      console.error('[RECORD-PAYMENT] Audit log insert failed:', {
        bookingId,
        amount: amountCents,
        method,
        addToTotal: !!addToTotal,
        error: auditErr.message,
      });
    }
  } catch (e) {
    console.error('[RECORD-PAYMENT] Audit log threw:', {
      bookingId, amount: amountCents, method, err: e instanceof Error ? e.message : String(e),
    });
  }

  // If cash payment, log to cash ledger — engineer owes business this amount
  if (method === 'cash' && booking.engineer_name) {
    try {
      const { createServiceClient } = await import('@/lib/supabase/server');
      const serviceClient = createServiceClient();
      await serviceClient.from('cash_ledger').insert({
        booking_id: bookingId,
        engineer_name: booking.engineer_name,
        amount: amountCents,
        client_name: booking.customer_name || 'Unknown',
        note: note || 'Cash payment recorded',
        recorded_by: user.email || 'unknown',
        status: 'owed',
      });
    } catch (e) {
      console.error('Cash ledger error:', e);
    }
  }

  return NextResponse.json({
    success: true,
    amountRecorded: amountCents,
    newRemainder,
  });
}
