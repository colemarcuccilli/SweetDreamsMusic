import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyProducerAccess } from '@/lib/admin-auth';

export async function GET() {
  const supabase = await createClient();
  const { isProducer, profileId } = await verifyProducerAccess(supabase);
  if (!isProducer || !profileId) return NextResponse.json({ error: 'Producer access required' }, { status: 401 });

  const { data: beats, error } = await supabase
    .from('beats')
    .select('id, title, genre, bpm, musical_key, mp3_lease_price, trackout_lease_price, exclusive_price, has_exclusive, lease_count, total_lease_revenue, status, created_at')
    .eq('producer_id', profileId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ beats: beats || [] });
}
