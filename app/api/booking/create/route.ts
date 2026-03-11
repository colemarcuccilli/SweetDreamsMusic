import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';
import { PRICING, SITE_URL, ROOM_LABELS, type Room } from '@/lib/constants';
import { calculateSessionTotal } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, startTime, duration, room, engineer, customerName, customerEmail, customerPhone, notes } = body;

    if (!date || !startTime || !duration || !room || !customerName || !customerEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (duration < PRICING.minHours || duration > PRICING.maxHours) {
      return NextResponse.json({ error: 'Invalid duration' }, { status: 400 });
    }

    const startHour = parseInt(startTime.split(':')[0]);

    // Server-side double-booking check
    const supabase = createServiceClient();
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('start_time, duration')
      .gte('start_time', `${date}T00:00:00`)
      .lte('start_time', `${date}T23:59:59`)
      .eq('room', room)
      .in('status', ['confirmed', 'pending']);

    if (existingBookings && existingBookings.length > 0) {
      const requestedHours = Array.from({ length: duration }, (_, i) => (startHour + i) % 24);
      for (const booking of existingBookings) {
        const bookedStart = new Date(booking.start_time).getHours();
        const bookedHours = Array.from({ length: booking.duration || 1 }, (_, i) => (bookedStart + i) % 24);
        const overlap = requestedHours.some(h => bookedHours.includes(h));
        if (overlap) {
          return NextResponse.json({ error: 'This time slot is already booked. Please choose a different time.' }, { status: 409 });
        }
      }
    }
    const bookingDate = new Date(date + 'T00:00:00');
    const now = new Date();
    const sameDayBooking =
      bookingDate.getFullYear() === now.getFullYear() &&
      bookingDate.getMonth() === now.getMonth() &&
      bookingDate.getDate() === now.getDate();

    const pricing = calculateSessionTotal(room as Room, duration, startHour, sameDayBooking);

    const endHour = (startHour + duration) % 24;
    const endTime = `${endHour}:00`;
    const roomLabel = ROOM_LABELS[room as Room] || room;

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: customerEmail,
        name: customerName,
        phone: customerPhone || undefined,
      });
      customerId = customer.id;
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: PRICING.currency,
            product_data: {
              name: `Recording Session Deposit — ${roomLabel}`,
              description: `${duration}hr session on ${date} at ${startTime} (50% deposit)`,
            },
            unit_amount: pricing.deposit,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        setup_future_usage: 'off_session',
      },
      success_url: `${SITE_URL}/book/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/book`,
      metadata: {
        type: 'booking_deposit',
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone || '',
        session_date: date,
        start_time: startTime,
        end_time: endTime,
        duration_hours: String(duration),
        room,
        engineer: engineer || '',
        notes: notes || '',
        total_amount: String(pricing.total),
        deposit_amount: String(pricing.deposit),
        remainder_amount: String(pricing.total - pricing.deposit),
        night_fees: String(pricing.nightFees),
        same_day: String(sameDayBooking),
        same_day_fee: String(pricing.sameDayFee),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Booking creation error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
