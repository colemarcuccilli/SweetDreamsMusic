import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  const serviceClient = createServiceClient();

  // Get all purchases by this user (by ID or email)
  const { data: purchases, error } = await serviceClient
    .from('beat_purchases')
    .select('*, beats(id, title, producer, genre, cover_image_url, preview_url, mp3_file_path, trackout_file_path, audio_file_path)')
    .or(`buyer_id.eq.${user.id},buyer_email.eq.${user.email}`)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ purchases: purchases || [] });
}
