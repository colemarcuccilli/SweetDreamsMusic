import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';
import { PRICING, SITE_URL, ROOM_LABELS, STUDIO_A_WEEKDAY_START, type Room } from '@/lib/constants';
import { calculateSessionTotal, parseTimeSlot } from '@/lib/utils';

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

    const startHour = parseTimeSlot(startTime);

    // Studio A weekday restriction: only available 6:30 PM+ on Mon-Fri
    if (room === 'studio_a') {
      const [y, m, d] = date.split('-').map(Number);
      const bookingDate = new Date(y, m - 1, d);
      const dow = bookingDate.getDay(); // 0=Sun, 1-5=Mon-Fri, 6=Sat
      if (dow >= 1 && dow <= 5 && startHour < STUDIO_A_WEEKDAY_START) {
        return NextResponse.json({ error: 'Studio A is only available 6:30 PM and later on weekdays. Try Studio B or choose an evening time.' }, { status: 400 });
      }
    }

    // Server-side double-booking check using half-hour slots
    const supabase = createServiceClient();
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('start_time, duration, room')
      .gte('start_time', `${date}T00:00:00`)
      .lte('start_time', `${date}T23:59:59`)
      .in('status', ['confirmed', 'pending']);

    if (existingBookings && existingBookings.length > 0) {
      const requestedSlots = Array.from({ length: duration * 2 }, (_, i) => (startHour + i * 0.5) % 24);
      for (const booking of existingBookings) {
        const bt = new Date(booking.start_time);
        const bookedStart = bt.getUTCHours() + bt.getUTCMinutes() / 60;
        const bookedSlots = Array.from({ length: (booking.duration || 1) * 2 }, (_, i) => (bookedStart + i * 0.5) % 24);
        const overlap = requestedSlots.some(s => bookedSlots.includes(s));
        if (overlap) {
          return NextResponse.json({ error: 'This time slot is already booked. Please choose a different time.' }, { status: 409 });
        }
      }
    }
    // Same-day check using date strings to avoid UTC timezone mismatch
    // Vercel runs UTC, studio is in Fort Wayne (America/Indiana/Indianapolis)
    const todayLocal = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Indiana/Indianapolis' });
    const sameDayBooking = date === todayLocal;

    // 3-hour buffer for same-day bookings
    if (sameDayBooking) {
      const nowFW = new Date().toLocaleString('en-US', { timeZone: 'America/Indiana/Indianapolis' });
      const nowDate = new Date(nowFW);
      const currentDecimal = nowDate.getHours() + nowDate.getMinutes() / 60;
      const bufferCutoff = Math.ceil((currentDecimal + 3) * 2) / 2; // round up to next 30-min
      if (startHour < bufferCutoff) {
        return NextResponse.json({ error: `Same-day bookings require a 3-hour buffer. The earliest available time is ${Math.floor(bufferCutoff)}:${bufferCutoff % 1 >= 0.5 ? '30' : '00'} ${bufferCutoff >= 12 ? 'PM' : 'AM'}.` }, { status: 400 });
      }
    }

    const pricing = calculateSessionTotal(room as Room, duration, startHour, sameDayBooking);

    const endDec = (startHour + duration) % 24;
    const endTime = `${Math.floor(endDec)}:${endDec % 1 >= 0.5 ? '30' : '00'}`;
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
