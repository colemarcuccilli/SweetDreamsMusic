import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';
import { PRICING, SITE_URL, ROOM_LABELS, type Room } from '@/lib/constants';

// Client pays deposit for an invited booking via Stripe Checkout
export async function POST(request: NextRequest) {
  try {
    const { bookingId, token } = await request.json();

    if (!bookingId || !token) {
      return NextResponse.json({ error: 'Missing bookingId or token' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Validate token
    if (!booking.admin_notes || !booking.admin_notes.includes(`Token: ${token}`)) {
      return NextResponse.json({ error: 'Invalid invite token' }, { status: 403 });
    }

    // If already confirmed, tell the client — don't show an error
    if (booking.status === 'confirmed') {
      return NextResponse.json({ alreadyConfirmed: true, message: 'Session already confirmed' });
    }

    // Must be pending (invites use 'pending_deposit' status)
    if (booking.status !== 'pending' && booking.status !== 'pending_deposit') {
      return NextResponse.json({ error: 'This booking has been cancelled. Please contact the studio for a new invite.' }, { status: 400 });
    }

    const roomLabel = ROOM_LABELS[booking.room as Room] || booking.room;
    const startDate = new Date(booking.start_time);
    const dateStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    const timeStr = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });

    // Find or create Stripe customer
    const email = booking.customer_email;
    let customerId: string | undefined;
    if (email) {
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email,
          name: booking.customer_name || undefined,
        });
        customerId = customer.id;
      }
    }

    // Create Stripe Checkout Session for the deposit
    // NOTE: setup_future_usage is card-only. Cash App Pay, Venmo, etc. do NOT support
    // saving for future charges. Setting it at the payment_intent_data level breaks
    // non-card payment methods (checkout never completes, webhook never fires).
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: PRICING.currency,
            product_data: {
              name: `Recording Session Deposit — ${roomLabel}`,
              description: `${booking.duration}hr session on ${dateStr} at ${timeStr} (50% deposit)`,
            },
            unit_amount: booking.deposit_amount,
          },
          quantity: 1,
        },
      ],
      payment_method_options: {
        card: {
          setup_future_usage: 'off_session',
        },
      },
      success_url: `${SITE_URL}/book/invite/${token}?booking=${bookingId}&paid=1`,
      cancel_url: `${SITE_URL}/book/invite/${token}?booking=${bookingId}`,
      metadata: {
        type: 'invite_deposit',
        booking_id: bookingId,
        invite_token: token,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Invite payment error:', error);
    return NextResponse.json({ error: 'Failed to create payment session' }, { status: 500 });
  }
}
