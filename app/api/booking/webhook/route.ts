import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';
import { sendBookingConfirmation, sendAdminBookingAlert, sendEngineerNewBookingAlert } from '@/lib/email';
import { ENGINEERS, type Room } from '@/lib/constants';
import type Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = session.metadata || {};

      if (meta.type === 'booking_deposit') {
        // Session booking deposit paid
        const startDateTime = `${meta.session_date}T${meta.start_time}:00`;
        const endDateTime = `${meta.session_date}T${meta.end_time}:00`;

        const { data: newBooking } = await supabase.from('bookings').insert({
          customer_name: meta.customer_name,
          customer_email: meta.customer_email,
          customer_phone: meta.customer_phone || null,
          start_time: startDateTime,
          end_time: endDateTime,
          duration: parseInt(meta.duration_hours),
          room: meta.room,
          engineer_name: null,
          requested_engineer: meta.engineer || null,
          total_amount: parseInt(meta.total_amount),
          deposit_amount: parseInt(meta.deposit_amount),
          remainder_amount: parseInt(meta.remainder_amount),
          actual_deposit_paid: session.amount_total,
          night_fees_amount: parseInt(meta.night_fees || '0'),
          same_day_fee: meta.same_day === 'true',
          same_day_fee_amount: parseInt(meta.same_day_fee || '0'),
          stripe_customer_id: session.customer as string,
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string,
          status: 'confirmed',
          admin_notes: meta.notes || null,
        }).select().single();

        // Send emails — use Fort Wayne timezone since Vercel runs UTC
        const startDate = new Date(startDateTime);
        // Times are stored as local Fort Wayne hours in UTC — format as UTC to preserve the intended hour
        const dateStr = startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
        const timeStr = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
        const duration = parseInt(meta.duration_hours);

        // Customer confirmation
        await sendBookingConfirmation(meta.customer_email, {
          customerName: meta.customer_name,
          date: dateStr,
          startTime: timeStr,
          duration,
          room: meta.room,
          total: parseInt(meta.total_amount),
          deposit: session.amount_total || parseInt(meta.deposit_amount),
        });

        // Admin alert
        await sendAdminBookingAlert({
          id: newBooking?.id || '',
          customerName: meta.customer_name,
          customerEmail: meta.customer_email,
          date: dateStr,
          startTime: timeStr,
          duration,
          room: meta.room,
          total: parseInt(meta.total_amount),
        });

        // Notify engineers who can work in this studio
        const room = meta.room as string;
        const engineerEmails = ENGINEERS
          .filter((e) => e.studios.includes(room as Room))
          .map((e) => e.email);

        console.log('[WEBHOOK] Sending engineer alerts to:', engineerEmails, 'for room:', room);

        if (engineerEmails.length > 0) {
          await sendEngineerNewBookingAlert(engineerEmails, {
            id: newBooking?.id || '',
            customerName: meta.customer_name,
            date: dateStr,
            startTime: timeStr,
            duration,
            room: meta.room,
          });
        } else {
          console.warn('[WEBHOOK] No engineers found for room:', room);
        }
      } else if (meta.type === 'invite_deposit') {
        // Invite booking — deposit paid, confirm the existing pending booking
        const bookingId = meta.booking_id;

        const { data: existingBooking } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .single();

        if (existingBooking) {
          await supabase.from('bookings').update({
            status: 'confirmed',
            actual_deposit_paid: session.amount_total,
            stripe_customer_id: session.customer as string,
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent as string,
            updated_at: new Date().toISOString(),
          }).eq('id', bookingId);

          // Send confirmation emails
          const startDate = new Date(existingBooking.start_time);
          const dateStr = startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
          const timeStr = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });

          if (existingBooking.customer_email) {
            await sendBookingConfirmation(existingBooking.customer_email, {
              customerName: existingBooking.customer_name,
              date: dateStr,
              startTime: timeStr,
              duration: existingBooking.duration,
              room: existingBooking.room || '',
              total: existingBooking.total_amount,
              deposit: session.amount_total || existingBooking.deposit_amount,
            });
          }

          await sendAdminBookingAlert({
            id: bookingId,
            customerName: existingBooking.customer_name,
            customerEmail: existingBooking.customer_email || '',
            date: dateStr,
            startTime: timeStr,
            duration: existingBooking.duration,
            room: existingBooking.room || '',
            total: existingBooking.total_amount,
          });

          // Notify engineers
          const room = existingBooking.room as string;
          const engineerEmails = ENGINEERS
            .filter((e) => e.studios.includes(room as Room))
            .map((e) => e.email);

          if (engineerEmails.length > 0) {
            await sendEngineerNewBookingAlert(engineerEmails, {
              id: bookingId,
              customerName: existingBooking.customer_name,
              date: dateStr,
              startTime: timeStr,
              duration: existingBooking.duration,
              room: existingBooking.room || '',
            });
          }
        }
      } else if (meta.type === 'booking_remainder') {
        // Remainder paid via Checkout (fallback when off-session charge failed)
        const bookingId = meta.booking_id;
        const chargeAmount = parseInt(meta.charge_amount || '0') || (session.amount_total || 0);

        const { data: remainderBooking } = await supabase
          .from('bookings')
          .select('remainder_amount, total_amount')
          .eq('id', bookingId)
          .single();

        if (remainderBooking) {
          await supabase.from('bookings').update({
            remainder_amount: Math.max(0, remainderBooking.remainder_amount - chargeAmount),
            updated_at: new Date().toISOString(),
          }).eq('id', bookingId);
        }
      } else if (meta.type === 'beat_purchase') {
        // Beat store purchase
        await supabase.from('beat_purchases').insert({
          beat_id: meta.beat_id,
          buyer_id: meta.buyer_id || null,
          buyer_email: session.customer_details?.email || meta.buyer_email,
          license_type: meta.license_type,
          amount_paid: session.amount_total,
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string,
        });

        // If exclusive, mark beat as sold
        if (meta.license_type === 'exclusive') {
          await supabase.from('beats').update({
            status: 'sold_exclusive',
            exclusive_buyer_id: meta.buyer_id || null,
            exclusive_sold_at: new Date().toISOString(),
          }).eq('id', meta.beat_id);
        }
      }
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      // Update booking status if refunded
      if (charge.payment_intent) {
        await supabase.from('bookings')
          .update({ status: 'cancelled' })
          .eq('stripe_payment_intent_id', charge.payment_intent as string);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
