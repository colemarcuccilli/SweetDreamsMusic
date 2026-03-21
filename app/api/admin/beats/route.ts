import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { verifyAdminAccess } from '@/lib/admin-auth';
import { sendBeatReviewNotification } from '@/lib/email';

// GET - list all beats with producer info
export async function GET() {
  const supabase = await createClient();

  const { data: beats, error } = await supabase
    .from('beats')
    .select('*, producer_profile:profiles!producer_id(display_name, producer_name)')
    .order('created_at', { ascending: false });

  if (error) {
    // Fallback without join if producer_id column doesn't exist yet
    const { data: fallbackBeats, error: fallbackError } = await supabase
      .from('beats')
      .select('*')
      .order('created_at', { ascending: false });

    if (fallbackError) return NextResponse.json({ error: fallbackError.message }, { status: 500 });
    return NextResponse.json({ beats: fallbackBeats || [] });
  }

  return NextResponse.json({ beats: beats || [] });
}

// POST - admin creates a new beat listing
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const isAdmin = await verifyAdminAccess(supabase);
  if (!isAdmin) return NextResponse.json({ error: 'Admins only' }, { status: 401 });

  const serviceClient = createServiceClient();
  const formData = await request.formData();

  const previewFile = formData.get('preview_file') as File;
  const title = formData.get('title') as string;
  const producerId = formData.get('producer_id') as string;
  const genre = formData.get('genre') as string;
  const bpm = formData.get('bpm') as string;
  const key = formData.get('key') as string;
  const tags = formData.get('tags') as string;
  const mp3LeasePrice = formData.get('mp3_lease_price') as string;
  const trackoutLeasePrice = formData.get('trackout_lease_price') as string;
  const exclusivePrice = formData.get('exclusive_price') as string;
  const hasExclusive = formData.get('has_exclusive') === 'true';
  const containsSamples = formData.get('contains_samples') === 'true';
  const sampleDetails = formData.get('sample_details') as string;
  const mp3File = formData.get('mp3_file') as File | null;
  const trackoutFile = formData.get('trackout_file') as File | null;

  if (!previewFile || !title || !producerId) {
    return NextResponse.json({ error: 'preview_file, title, and producer_id required' }, { status: 400 });
  }

  // Get producer info for the text producer field (backward compat)
  const { data: producerProfile } = await serviceClient
    .from('profiles')
    .select('display_name, producer_name')
    .eq('id', producerId)
    .single();

  const producerName = producerProfile?.producer_name || producerProfile?.display_name || 'Unknown';

  // Generate a beat ID prefix for organizing files
  const beatPrefix = `beats/${Date.now()}`;

  // Upload preview audio
  const previewPath = `${beatPrefix}/preview_${previewFile.name}`;
  const { error: previewUploadError } = await serviceClient.storage
    .from('media')
    .upload(previewPath, previewFile);

  if (previewUploadError) {
    return NextResponse.json({ error: `Preview upload failed: ${previewUploadError.message}` }, { status: 500 });
  }

  const { data: { publicUrl: previewUrl } } = serviceClient.storage
    .from('media')
    .getPublicUrl(previewPath);

  // Upload MP3 master if provided
  let mp3FilePath: string | null = null;
  if (mp3File && mp3File.size > 0) {
    mp3FilePath = `${beatPrefix}/mp3_${mp3File.name}`;
    const { error: mp3Error } = await serviceClient.storage.from('media').upload(mp3FilePath, mp3File);
    if (mp3Error) {
      console.error('MP3 upload failed:', mp3Error);
      mp3FilePath = null;
    }
  }

  // Upload trackout/stems ZIP if provided
  let trackoutFilePath: string | null = null;
  if (trackoutFile && trackoutFile.size > 0) {
    trackoutFilePath = `${beatPrefix}/trackout_${trackoutFile.name}`;
    const { error: trackoutError } = await serviceClient.storage.from('media').upload(trackoutFilePath, trackoutFile);
    if (trackoutError) {
      console.error('Trackout upload failed:', trackoutError);
      trackoutFilePath = null;
    }
  }

  // Insert beat record
  const { data: beat, error: dbError } = await serviceClient
    .from('beats')
    .insert({
      title,
      producer: producerName,
      producer_id: producerId,
      genre: genre || null,
      bpm: bpm ? parseInt(bpm) : null,
      musical_key: key || null,
      tags: tags ? tags.split(',').map((t: string) => t.trim()) : [],
      preview_url: previewUrl,
      audio_file_path: previewPath,
      mp3_file_path: mp3FilePath,
      trackout_file_path: trackoutFilePath,
      mp3_lease_price: mp3LeasePrice ? parseInt(mp3LeasePrice) : null,
      trackout_lease_price: trackoutLeasePrice ? parseInt(trackoutLeasePrice) : null,
      exclusive_price: hasExclusive && exclusivePrice ? parseInt(exclusivePrice) : null,
      has_exclusive: hasExclusive,
      contains_samples: containsSamples,
      sample_details: containsSamples ? sampleDetails || null : null,
      status: 'pending_review',
    })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  // Send review notification email to producer
  try {
    const { data: producerUser } = await serviceClient
      .from('profiles')
      .select('user_id')
      .eq('id', producerId)
      .single();

    if (producerUser?.user_id) {
      const { data: { user: authUser } } = await serviceClient.auth.admin.getUserById(producerUser.user_id);
      if (authUser?.email) {
        await sendBeatReviewNotification(authUser.email, {
          producerName,
          beatTitle: title,
        });
      }
    }
  } catch (e) {
    console.error('Failed to send beat review notification:', e);
  }

  return NextResponse.json({ beat });
}

// DELETE - admin removes a beat
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const isAdmin = await verifyAdminAccess(supabase);
  if (!isAdmin) return NextResponse.json({ error: 'Admins only' }, { status: 401 });

  const serviceClient = createServiceClient();
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  // Get all file paths
  const { data: beat } = await serviceClient
    .from('beats')
    .select('audio_file_path, mp3_file_path, trackout_file_path')
    .eq('id', id)
    .single();

  // Remove all associated files
  if (beat) {
    const filesToRemove = [beat.audio_file_path, beat.mp3_file_path, beat.trackout_file_path].filter(Boolean) as string[];
    if (filesToRemove.length > 0) {
      await serviceClient.storage.from('media').remove(filesToRemove);
    }
  }

  const { error } = await serviceClient.from('beats').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
