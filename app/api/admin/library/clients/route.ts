import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyEngineerAccess } from '@/lib/admin-auth';

export async function GET() {
  const supabase = await createClient();
  const hasAccess = await verifyEngineerAccess(supabase);
  if (!hasAccess) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get all profiles with their file and note counts
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, user_id, display_name, profile_picture_url, public_profile_slug, role, email, is_producer, producer_name')
    .order('display_name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get file counts per user
  const { data: fileCounts } = await supabase
    .from('deliverables')
    .select('user_id');

  // Get note counts per user
  const { data: noteCounts } = await supabase
    .from('library_notes')
    .select('user_id');

  const fileCountMap: Record<string, number> = {};
  fileCounts?.forEach((f) => {
    fileCountMap[f.user_id] = (fileCountMap[f.user_id] || 0) + 1;
  });

  const noteCountMap: Record<string, number> = {};
  noteCounts?.forEach((n) => {
    noteCountMap[n.user_id] = (noteCountMap[n.user_id] || 0) + 1;
  });

  const clients = profiles?.map((p) => ({
    id: p.id,
    user_id: p.user_id,
    display_name: p.display_name,
    profile_picture_url: p.profile_picture_url,
    public_profile_slug: p.public_profile_slug,
    role: p.role || 'user',
    email: p.email,
    is_producer: p.is_producer || false,
    producer_name: p.producer_name,
    files_count: fileCountMap[p.user_id] || 0,
    notes_count: noteCountMap[p.user_id] || 0,
  })) || [];

  return NextResponse.json({ clients });
}
