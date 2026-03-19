import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { verifyProducerAccess } from '@/lib/admin-auth';
import { PRODUCER_COMMISSION, PLATFORM_COMMISSION } from '@/lib/constants';

export async function GET() {
  const supabase = await createClient();
  const { isProducer, profileId } = await verifyProducerAccess(supabase);
  if (!isProducer || !profileId) return NextResponse.json({ error: 'Producer access required' }, { status: 401 });

  const serviceClient = createServiceClient();

  // Get all beats by this producer
  const { data: producerBeats } = await serviceClient
    .from('beats')
    .select('id, total_lease_revenue')
    .eq('producer_id', profileId);

  if (!producerBeats || producerBeats.length === 0) {
    return NextResponse.json({
      totalGross: 0,
      platformFee: 0,
      netEarnings: 0,
      totalBeats: 0,
      totalLeases: 0,
    });
  }

  const beatIds = producerBeats.map((b) => b.id);

  // Get all purchases for these beats
  const { data: purchases } = await serviceClient
    .from('beat_purchases')
    .select('amount_paid')
    .in('beat_id', beatIds);

  const totalGross = purchases?.reduce((sum, p) => sum + p.amount_paid, 0) || 0;
  const netEarnings = Math.round(totalGross * PRODUCER_COMMISSION);
  const platformFee = Math.round(totalGross * PLATFORM_COMMISSION);

  // Get payouts
  const { data: payouts } = await serviceClient
    .from('producer_payouts')
    .select('amount, status')
    .eq('producer_id', profileId)
    .eq('status', 'paid');

  const totalPaid = payouts?.reduce((sum, p) => sum + p.amount, 0) || 0;

  return NextResponse.json({
    totalGross,
    platformFee,
    netEarnings,
    totalPaid,
    pendingPayout: netEarnings - totalPaid,
    totalBeats: producerBeats.length,
    totalLeases: purchases?.length || 0,
  });
}
