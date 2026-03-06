import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';
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

        await supabase.from('bookings').insert({
          customer_name: meta.customer_name,
          customer_email: meta.customer_email,
          customer_phone: meta.customer_phone || null,
          start_time: startDateTime,
          end_time: endDateTime,
          duration: parseInt(meta.duration_hours),
          room: meta.room,
          engineer_name: meta.engineer || null,
          total_amount: parseInt(meta.total_amount),
          deposit_amount: parseInt(meta.deposit_amount),
          remainder_amount: parseInt(meta.remainder_amount),
          actual_deposit_paid: session.amount_total,
          after_hours_fee: meta.after_hours === 'true',
          after_hours_fee_amount: parseInt(meta.after_hours_fee || '0'),
          same_day_fee: meta.same_day === 'true',
          same_day_fee_amount: parseInt(meta.same_day_fee || '0'),
          stripe_customer_id: session.customer as string,
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string,
          status: 'confirmed',
          admin_notes: meta.notes || null,
        });
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
