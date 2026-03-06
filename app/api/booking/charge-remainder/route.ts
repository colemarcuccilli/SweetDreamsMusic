import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { verifyEngineerAccess } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const hasAccess = await verifyEngineerAccess(supabase);
  if (!hasAccess) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { bookingId, amount } = await request.json();
  if (!bookingId) return NextResponse.json({ error: 'bookingId required' }, { status: 400 });

  // Get booking details
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('id, stripe_customer_id, stripe_payment_intent_id, remainder_amount, total_amount, status, customer_email')
    .eq('id', bookingId)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  if (!booking.stripe_customer_id) {
    return NextResponse.json({ error: 'No saved payment method for this booking' }, { status: 400 });
  }

  // Use provided amount or default to the remainder
  const chargeAmount = amount || booking.remainder_amount;
  if (chargeAmount <= 0) {
    return NextResponse.json({ error: 'Nothing to charge' }, { status: 400 });
  }

  try {
    // Get saved payment methods for this customer
    const paymentMethods = await stripe.paymentMethods.list({
      customer: booking.stripe_customer_id,
      type: 'card',
    });

    if (paymentMethods.data.length === 0) {
      return NextResponse.json({ error: 'No saved card found for this customer' }, { status: 400 });
    }

    // Charge the saved card
    const paymentIntent = await stripe.paymentIntents.create({
      amount: chargeAmount,
      currency: 'usd',
      customer: booking.stripe_customer_id,
      payment_method: paymentMethods.data[0].id,
      off_session: true,
      confirm: true,
      description: `Session remainder — Booking ${booking.id.slice(0, 8)}`,
      metadata: {
        type: 'booking_remainder',
        booking_id: booking.id,
      },
    });

    // Update booking with new total if amount was adjusted
    const updates: Record<string, unknown> = {
      remainder_amount: Math.max(0, booking.remainder_amount - chargeAmount),
    };

    if (amount && amount !== booking.remainder_amount) {
      updates.total_amount = booking.total_amount - booking.remainder_amount + amount;
    }

    await supabase.from('bookings').update(updates).eq('id', bookingId);

    return NextResponse.json({
      success: true,
      paymentIntentId: paymentIntent.id,
      amountCharged: chargeAmount,
    });
  } catch (err: unknown) {
    const stripeError = err as { type?: string; message?: string };
    console.error('Charge remainder error:', stripeError);

    if (stripeError.type === 'StripeCardError') {
      return NextResponse.json({ error: `Card declined: ${stripeError.message}` }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to charge remainder' }, { status: 500 });
  }
}
