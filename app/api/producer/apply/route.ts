import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const formData = await request.formData();
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const producerName = formData.get('producer_name') as string;
  const portfolioLinksRaw = formData.get('portfolio_links') as string;
  const genreSpecialties = formData.get('genre_specialties') as string;
  const reason = formData.get('reason') as string;
  const sampleBeat = formData.get('sample_beat') as File | null;

  if (!name || !email || !producerName) {
    return NextResponse.json({ error: 'name, email, and producer_name required' }, { status: 400 });
  }

  let portfolioLinks: string[] = [];
  try {
    portfolioLinks = portfolioLinksRaw ? JSON.parse(portfolioLinksRaw) : [];
  } catch {
    portfolioLinks = portfolioLinksRaw ? [portfolioLinksRaw] : [];
  }

  const serviceClient = createServiceClient();

  // Upload sample beat if provided
  let sampleBeatPath: string | null = null;
  if (sampleBeat && sampleBeat.size > 0) {
    const timestamp = Date.now();
    const filePath = `producer-applications/${timestamp}_${sampleBeat.name}`;
    const { error: uploadError } = await serviceClient.storage
      .from('media')
      .upload(filePath, sampleBeat);

    if (!uploadError) {
      sampleBeatPath = filePath;
    }
  }

  const { data, error } = await serviceClient
    .from('producer_applications')
    .insert({
      user_id: user?.id || null,
      name,
      email,
      producer_name: producerName,
      portfolio_links: portfolioLinks,
      genre_specialties: genreSpecialties ? genreSpecialties.split(',').map((s: string) => s.trim()) : [],
      sample_beat_path: sampleBeatPath,
      reason: reason || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ application: data });
}
