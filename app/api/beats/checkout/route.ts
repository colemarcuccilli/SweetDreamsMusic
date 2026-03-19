import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { SITE_URL, BEAT_LICENSES } from '@/lib/constants';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { beatId, licenseType } = await request.json();

  if (!beatId || !licenseType) {
    return NextResponse.json({ error: 'beatId and licenseType required' }, { status: 400 });
  }

  if (!(licenseType in BEAT_LICENSES)) {
    return NextResponse.json({ error: 'Invalid license type' }, { status: 400 });
  }

  // Get beat details
  const { data: beat, error } = await supabase
    .from('beats')
    .select('*')
    .eq('id', beatId)
    .eq('status', 'active')
    .single();

  if (error || !beat) {
    return NextResponse.json({ error: 'Beat not found or unavailable' }, { status: 404 });
  }

  // Get price for the selected license
  const priceField = `${licenseType}_price` as keyof typeof beat;
  const price = beat[priceField] as number | null;

  if (!price) {
    return NextResponse.json({ error: 'This license type is not available for this beat' }, { status: 400 });
  }

  const license = BEAT_LICENSES[licenseType as keyof typeof BEAT_LICENSES];

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      automatic_tax: { enabled: true },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${beat.title} — ${license.name}`,
              description: `${license.description} | Delivery: ${license.deliveryFormat}`,
              tax_code: 'txcd_10202000', // Digital goods - audio
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      success_url: `${SITE_URL}/beats/success?session_id={CHECKOUT_SESSION_ID}&beat=${beatId}`,
      cancel_url: `${SITE_URL}/beats`,
      customer_email: user?.email || undefined,
      metadata: {
        type: 'beat_purchase',
        beat_id: beatId,
        beat_title: beat.title,
        producer: beat.producer,
        producer_id: beat.producer_id || '',
        license_type: licenseType,
        buyer_id: user?.id || '',
        buyer_email: user?.email || '',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Beat checkout error:', err);
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
  }
}
