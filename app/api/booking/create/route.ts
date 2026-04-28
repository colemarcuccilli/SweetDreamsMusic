import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getSessionUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { PRICING, SITE_URL, ROOM_LABELS, STUDIO_A_WEEKDAY_START, MAX_GUESTS, type Room } from '@/lib/constants';
import { calculateSessionTotal, calculateBandSessionTotal, isSelfServeBandHours, parseTimeSlot } from '@/lib/utils';
import { memberHasFlag } from '@/lib/bands';
import { getMembership } from '@/lib/bands-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, startTime, duration, room, engineer, customerName, customerEmail: bodyCustomerEmail, customerPhone, guestCount: rawGuestCount, notes, bandId } = body;
    const guestCount = Math.min(Math.max(1, Number(rawGuestCount) || 1), MAX_GUESTS);
    const isBandBooking = typeof bandId === 'string' && bandId.length > 0;

    if (!date || !startTime || !duration || !room || !customerName || !bodyCustomerEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Strict email format check — prevents garbage strings from becoming
    // Stripe customer records and downstream receipt emails.
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof bodyCustomerEmail !== 'string' || !EMAIL_RE.test(bodyCustomerEmail.trim())) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    // IDENTITY POLICY:
    //   - Solo bookings are OPEN (first-time customers don't have accounts yet).
    //   - If the booker IS signed in, we prefer their verified session email
    //     over whatever is in the body. This closes a hole where a signed-in
    //     user with an unpaid balance could type a different email to bypass
    //     the unpaid-balance check below.
    //   - Band bookings always require auth (handled in the `isBandBooking`
    //     block below).
    const sessionUser = await getSessionUser();
    const customerEmail = sessionUser?.email
      ? sessionUser.email
      : bodyCustomerEmail.trim().toLowerCase();

    // Band bookings: require authentication, membership, and can_book_band_sessions.
    // We verify via the session cookie — NOT by trusting anything in the body.
    // The permission check is what gives band_id any meaning; everything else
    // trusts the body (customer email, name, phone) because it's a solo-style
    // self-attestation by the booker.
    let band: { id: string; display_name: string } | null = null;
    if (isBandBooking) {
      // Band bookings still require auth — reuse sessionUser loaded above.
      if (!sessionUser) {
        return NextResponse.json({ error: 'Sign in required to book a band session' }, { status: 401 });
      }
      const membership = await getMembership(bandId, sessionUser.id);
      if (!membership || !memberHasFlag(membership, 'can_book_band_sessions')) {
        return NextResponse.json({ error: 'You don\'t have permission to book sessions for this band' }, { status: 403 });
      }
      const supabase = createServiceClient();
      const { data: bandRow } = await supabase
        .from('bands')
        .select('id, display_name')
        .eq('id', bandId)
        .maybeSingle();
      if (!bandRow) {
        return NextResponse.json({ error: 'Band not found' }, { status: 404 });
      }
      band = bandRow as { id: string; display_name: string };

      // Band sessions are Studio A only (BAND_PRICING is Studio A).
      if (room !== 'studio_a') {
        return NextResponse.json({ error: 'Band sessions are Studio A only' }, { status: 400 });
      }
      // Self-serve band tiers: 4h or 8h. 24h ("3 Days") is handled via contact, not this endpoint.
      if (!isSelfServeBandHours(Number(duration))) {
        return NextResponse.json({ error: 'Band sessions must be 4 or 8 hours. Contact us for multi-day bookings.' }, { status: 400 });
      }
    } else {
      // Solo flow — unchanged bounds.
      if (duration < PRICING.minHours || duration > PRICING.maxHours) {
        return NextResponse.json({ error: 'Invalid duration' }, { status: 400 });
      }
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

    // Check for unpaid balance from previous sessions
    const { data: unpaidBookings } = await supabase
      .from('bookings')
      .select('id, remainder_amount')
      .eq('customer_email', customerEmail)
      .eq('status', 'completed')
      .gt('remainder_amount', 0)
      .limit(1);

    if (unpaidBookings && unpaidBookings.length > 0) {
      return NextResponse.json({
        error: `You have an unpaid balance from a previous session. Please pay your outstanding balance before booking a new session.`,
      }, { status: 400 });
    }

    // Branch pricing on booking type. Band bookings are flat-rate packages
    // (no night / same-day / guest surcharges stack); solo sessions keep the
    // full per-hour surcharge matrix.
    const pricing = isBandBooking
      ? calculateBandSessionTotal(Number(duration) as 4 | 8)
      : calculateSessionTotal(room as Room, duration, startHour, sameDayBooking, guestCount);

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
    // NOTE: We use automatic payment methods (Stripe Dashboard controls which are shown).
    // setup_future_usage is set ONLY for card via payment_method_options, because
    // Cash App Pay, Venmo, etc. do NOT support saving for future off-session charges.
    // Previously this was set at the payment_intent_data level which caused Cash App Pay
    // payments to silently fail (checkout never completed, webhook never fired).
    // Stripe Checkout line item — copy distinguishes band vs solo so the
    // customer's receipt and Stripe dashboard read naturally. The webhook
    // doesn't read `product_data.name`; it's pure UX.
    const lineItemName = isBandBooking && band
      ? `Band Session Deposit — ${band.display_name}`
      : `Recording Session Deposit — ${roomLabel}`;
    const lineItemDescription = isBandBooking
      ? `${duration}hr band session on ${date} at ${startTime} (50% deposit)`
      : `${duration}hr session on ${date} at ${startTime} (50% deposit)`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: PRICING.currency,
            product_data: {
              name: lineItemName,
              description: lineItemDescription,
            },
            unit_amount: pricing.deposit,
          },
          quantity: 1,
        },
      ],
      payment_method_options: {
        card: {
          setup_future_usage: 'off_session',
        },
      },
      success_url: `${SITE_URL}/book/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/book`,
      metadata: {
        // `type` is the discriminator the webhook branches on. Keeping the
        // original `booking_deposit` value for solo sessions means zero
        // change to existing webhook logic; band bookings get their own
        // tag so the webhook can persist `band_id` + skip solo-only fields.
        type: isBandBooking ? 'band_booking_deposit' : 'booking_deposit',
        band_id: isBandBooking && band ? band.id : '',
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
        guest_count: String(guestCount),
        guest_fee: String(pricing.guestFee),
        // Free setup hour reservation for band 4hr / 8hr sessions only.
        // Solo sessions get 0 (default behavior). The 24hr 3-day band block
        // is admin-only and not routed through this endpoint, so we don't
        // worry about its day-1-only padding rule here.
        setup_minutes_before: isBandBooking ? '60' : '0',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Booking creation error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
