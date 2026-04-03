import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { verifyAdminAccess, verifyProducerAccess } from '@/lib/admin-auth';
import { sendPrivateBeatSaleInvite } from '@/lib/email';
import { BEAT_LICENSES, type BeatLicenseType } from '@/lib/constants';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const serviceClient = createServiceClient();

  // Verify admin or producer
  const isAdmin = await verifyAdminAccess(supabase);
  const { isProducer, profileId } = await verifyProducerAccess(supabase);

  if (!isAdmin && !isProducer) {
    return NextResponse.json({ error: 'Unauthorized — admin or producer access required' }, { status: 401 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const body = await request.json();
    const {
      beatId,
      buyerName,
      buyerEmail,
      licenseType,
      amount, // dollars from client
      paymentMethod,
      requiresPayment,
      notes,
      beatTitle: providedTitle,
      beatProducer: providedProducer,
      producerId,
    } = body;

    if (!buyerName || !buyerEmail || !licenseType) {
      return NextResponse.json({ error: 'buyerName, buyerEmail, and licenseType are required' }, { status: 400 });
    }

    if (!(licenseType in BEAT_LICENSES)) {
      return NextResponse.json({ error: 'Invalid license type' }, { status: 400 });
    }

    // Convert dollars to cents
    const amountCents = Math.round((amount || 0) * 100);

    let beatTitle = providedTitle || '';
    let beatProducer = providedProducer || '';
    let resolvedBeatId = beatId || null;

    // If beatId provided, fetch beat details
    if (beatId) {
      const { data: beat } = await serviceClient
        .from('beats')
        .select('title, producer, producer_id, cover_image_url')
        .eq('id', beatId)
        .single();

      if (beat) {
        beatTitle = beat.title || beatTitle;
        beatProducer = beat.producer || beatProducer;
      }
    }

    const token = crypto.randomUUID();

    const { data: sale, error } = await serviceClient
      .from('private_beat_sales')
      .insert({
        token,
        beat_id: resolvedBeatId,
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        license_type: licenseType,
        amount: amountCents,
        payment_method: paymentMethod || 'stripe',
        requires_payment: requiresPayment !== false,
        notes: notes || null,
        beat_title: beatTitle,
        beat_producer: beatProducer,
        producer_id: producerId || (isProducer ? profileId : null),
        created_by: user.id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create private sale:', error);
      return NextResponse.json({ error: 'Failed to create private sale' }, { status: 500 });
    }

    // Send invite email
    const license = BEAT_LICENSES[licenseType as BeatLicenseType];
    await sendPrivateBeatSaleInvite(buyerEmail, {
      buyerName,
      beatTitle,
      producerName: beatProducer,
      licenseType: license.name,
      amount: amountCents,
      requiresPayment: requiresPayment !== false,
      token,
    });

    return NextResponse.json(sale);
  } catch (err) {
    console.error('Private sale creation error:', err);
    return NextResponse.json({ error: 'Failed to create private sale' }, { status: 500 });
  }
}

export async function GET() {
  const supabase = await createClient();
  const serviceClient = createServiceClient();

  const isAdmin = await verifyAdminAccess(supabase);
  const { isProducer, profileId } = await verifyProducerAccess(supabase);

  if (!isAdmin && !isProducer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    let query = serviceClient
      .from('private_beat_sales')
      .select('*, beats(title, producer, cover_image_url)')
      .order('created_at', { ascending: false });

    // Producers only see their own sales
    if (!isAdmin && isProducer && profileId) {
      query = query.or(`created_by.eq.${user.id},producer_id.eq.${profileId}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to list private sales:', error);
      return NextResponse.json({ error: 'Failed to list private sales' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error('Private sale list error:', err);
    return NextResponse.json({ error: 'Failed to list private sales' }, { status: 500 });
  }
}
