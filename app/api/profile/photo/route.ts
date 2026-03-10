import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const type = (formData.get('type') as string) || 'profile';
  const projectId = formData.get('projectId') as string | null;

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File must be under 5MB' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  let filePath: string;

  if (type === 'cover') {
    filePath = `cover-photos/${user.id}.${ext}`;
  } else if (type === 'project' && projectId) {
    filePath = `project-covers/${user.id}/${projectId}-${timestamp}.${ext}`;
  } else {
    filePath = `profile-pictures/${user.id}.${ext}`;
  }

  const { error: uploadError } = await supabase.storage
    .from('media')
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage
    .from('media')
    .getPublicUrl(filePath);

  // Update the appropriate record
  if (type === 'cover') {
    await supabase
      .from('profiles')
      .update({ cover_photo_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);
  } else if (type === 'project' && projectId) {
    await supabase
      .from('profile_projects')
      .update({ cover_image_url: publicUrl })
      .eq('id', projectId)
      .eq('user_id', user.id);
  } else {
    await supabase
      .from('profiles')
      .update({ profile_picture_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);
  }

  return NextResponse.json({ url: publicUrl });
}
