import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { verifyProducerAccess } from '@/lib/admin-auth';
import { sendAdminBeatApprovalNotification } from '@/lib/email';
import { SUPER_ADMINS } from '@/lib/constants';

export async function GET() {
  const supabase = await createClient();
  const { isProducer, profileId } = await verifyProducerAccess(supabase);
  if (!isProducer || !profileId) return NextResponse.json({ error: 'Producer access required' }, { status: 401 });

  const { data: beats, error } = await supabase
    .from('beats')
    .select('id, title, genre, bpm, musical_key, tags, mp3_lease_price, trackout_lease_price, exclusive_price, has_exclusive, lease_count, total_lease_revenue, status, created_at, preview_url, cover_image_url, mp3_file_path, trackout_file_path, audio_file_path, contains_samples, sample_details')
    .eq('producer_id', profileId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ beats: beats || [] });
}

// POST — producer uploads a beat (pending admin approval)
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { isProducer, profileId } = await verifyProducerAccess(supabase);
  if (!isProducer || !profileId) return NextResponse.json({ error: 'Producer access required' }, { status: 401 });

  const serviceClient = createServiceClient();
  const formData = await request.formData();

  const previewFile = formData.get('preview_file') as File;
  const title = formData.get('title') as string;
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

  if (!previewFile || !title) {
    return NextResponse.json({ error: 'preview_file and title required' }, { status: 400 });
  }

  // Convert dollar amounts to cents
  function dollarsToCents(val: string): number | null {
    if (!val) return null;
    const num = parseFloat(val);
    if (isNaN(num)) return null;
    return Math.round(num * 100);
  }

  // Get producer info
  const { data: producerProfile } = await serviceClient
    .from('profiles')
    .select('display_name, producer_name')
    .eq('id', profileId)
    .single();

  const producerName = producerProfile?.producer_name || producerProfile?.display_name || 'Unknown';

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
      producer_id: profileId,
      genre: genre || null,
      bpm: bpm ? parseInt(bpm) : null,
      musical_key: key || null,
      tags: tags ? tags.split(',').map((t: string) => t.trim()).filter(Boolean).concat(['Sweet Dreams']) : ['Sweet Dreams'],
      preview_url: previewUrl,
      audio_file_path: previewPath,
      mp3_file_path: mp3FilePath,
      trackout_file_path: trackoutFilePath,
      mp3_lease_price: dollarsToCents(mp3LeasePrice),
      trackout_lease_price: dollarsToCents(trackoutLeasePrice),
      exclusive_price: hasExclusive ? dollarsToCents(exclusivePrice) : null,
      has_exclusive: hasExclusive,
      contains_samples: containsSamples,
      sample_details: containsSamples ? sampleDetails || null : null,
      status: 'pending_approval',
    })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  // Notify admins that a new beat needs approval
  try {
    await sendAdminBeatApprovalNotification([...SUPER_ADMINS], {
      producerName,
      beatTitle: title,
      genre: genre || null,
    });
  } catch (e) {
    console.error('Failed to send admin beat approval notification:', e);
  }

  return NextResponse.json({ beat });
}

// DELETE — producer removes their own beat
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { isProducer, profileId } = await verifyProducerAccess(supabase);
  if (!isProducer || !profileId) return NextResponse.json({ error: 'Producer access required' }, { status: 401 });

  const serviceClient = createServiceClient();
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  // Verify this beat belongs to this producer
  const { data: beat } = await serviceClient
    .from('beats')
    .select('audio_file_path, mp3_file_path, trackout_file_path, producer_id')
    .eq('id', id)
    .single();

  if (!beat || beat.producer_id !== profileId) {
    return NextResponse.json({ error: 'Beat not found or not yours' }, { status: 404 });
  }

  // Remove all associated files
  const filesToRemove = [beat.audio_file_path, beat.mp3_file_path, beat.trackout_file_path].filter(Boolean) as string[];
  if (filesToRemove.length > 0) {
    await serviceClient.storage.from('media').remove(filesToRemove);
  }

  const { error } = await serviceClient.from('beats').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
