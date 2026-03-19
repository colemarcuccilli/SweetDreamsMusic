import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { generateLicenseText } from '@/lib/license-templates';
import type { BeatLicenseType } from '@/lib/constants';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const purchaseId = searchParams.get('purchaseId');
  if (!purchaseId) return NextResponse.json({ error: 'purchaseId required' }, { status: 400 });

  const serviceClient = createServiceClient();

  const { data: purchase, error } = await serviceClient
    .from('beat_purchases')
    .select('*, beats(title, producer)')
    .eq('id', purchaseId)
    .single();

  if (error || !purchase) {
    return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
  }

  if (purchase.buyer_id !== user.id && purchase.buyer_email !== user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const beat = Array.isArray(purchase.beats) ? purchase.beats[0] : purchase.beats;

  const licenseText = generateLicenseText({
    buyerName: user.email?.split('@')[0] || 'Buyer',
    buyerEmail: purchase.buyer_email,
    beatTitle: beat?.title || 'Unknown',
    producerName: beat?.producer || 'Unknown',
    licenseType: purchase.license_type as BeatLicenseType,
    amountPaid: purchase.amount_paid,
    purchaseDate: new Date(purchase.created_at).toLocaleDateString(),
    purchaseId: purchase.id,
  });

  return NextResponse.json({ license: licenseText });
}
