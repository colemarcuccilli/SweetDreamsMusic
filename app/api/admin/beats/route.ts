import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminAccess } from '@/lib/admin-auth';

// GET - list all beats
export async function GET() {
  const supabase = await createClient();

  const { data: beats, error } = await supabase
    .from('beats')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ beats: beats || [] });
}

// POST - admin creates a new beat listing
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const isAdmin = await verifyAdminAccess(supabase);
  if (!isAdmin) return NextResponse.json({ error: 'Admins only' }, { status: 401 });

  const formData = await request.formData();
  const audioFile = formData.get('audio_file') as File;
  const title = formData.get('title') as string;
  const producer = formData.get('producer') as string;
  const genre = formData.get('genre') as string;
  const bpm = formData.get('bpm') as string;
  const key = formData.get('key') as string;
  const tags = formData.get('tags') as string;
  const mp3LeasePrice = formData.get('mp3_lease_price') as string;
  const wavLeasePrice = formData.get('wav_lease_price') as string;
  const unlimitedPrice = formData.get('unlimited_price') as string;
  const exclusivePrice = formData.get('exclusive_price') as string;

  if (!audioFile || !title || !producer) {
    return NextResponse.json({ error: 'audio_file, title, and producer required' }, { status: 400 });
  }

  // Upload preview audio
  const timestamp = Date.now();
  const filePath = `beats/${timestamp}_${audioFile.name}`;

  const { error: uploadError } = await supabase.storage
    .from('media')
    .upload(filePath, audioFile);

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage
    .from('media')
    .getPublicUrl(filePath);

  const { data: beat, error: dbError } = await supabase
    .from('beats')
    .insert({
      title,
      producer,
      genre: genre || null,
      bpm: bpm ? parseInt(bpm) : null,
      musical_key: key || null,
      tags: tags ? tags.split(',').map((t: string) => t.trim()) : [],
      preview_url: publicUrl,
      audio_file_path: filePath,
      mp3_lease_price: mp3LeasePrice ? parseInt(mp3LeasePrice) : null,
      wav_lease_price: wavLeasePrice ? parseInt(wavLeasePrice) : null,
      unlimited_price: unlimitedPrice ? parseInt(unlimitedPrice) : null,
      exclusive_price: exclusivePrice ? parseInt(exclusivePrice) : null,
      status: 'active',
    })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ beat });
}

// DELETE - admin removes a beat
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const isAdmin = await verifyAdminAccess(supabase);
  if (!isAdmin) return NextResponse.json({ error: 'Admins only' }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  // Get file path
  const { data: beat } = await supabase
    .from('beats')
    .select('audio_file_path')
    .eq('id', id)
    .single();

  if (beat?.audio_file_path) {
    await supabase.storage.from('media').remove([beat.audio_file_path]);
  }

  const { error } = await supabase.from('beats').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
