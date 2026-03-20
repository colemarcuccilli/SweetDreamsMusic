import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PHASE_TASKS, type ProjectPhase } from '@/lib/hub-constants';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data: projects, error } = await supabase
    .from('artist_projects')
    .select('*, artist_project_tasks(id, phase, title, is_completed, display_order, completed_at)')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ projects: projects || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const { title, project_type, description, genre, target_release_date, featured_artists } = body;

  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 });

  // Create project
  const { data: project, error } = await supabase
    .from('artist_projects')
    .insert({
      user_id: user.id,
      title: title.trim(),
      project_type: project_type || 'single',
      description: description || null,
      genre: genre || null,
      target_release_date: target_release_date || null,
      featured_artists: featured_artists || [],
      current_phase: 'concept',
      status: 'active',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Generate default tasks for all phases
  const tasks = Object.entries(DEFAULT_PHASE_TASKS).flatMap(([phase, titles]) =>
    titles.map((taskTitle, idx) => ({
      project_id: project.id,
      phase,
      title: taskTitle,
      is_default: true,
      display_order: idx,
    }))
  );

  await supabase.from('artist_project_tasks').insert(tasks);

  return NextResponse.json({ project });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  updates.updated_at = new Date().toISOString();

  const { data: project, error } = await supabase
    .from('artist_projects')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ project });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await supabase.from('artist_projects').delete().eq('id', id).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
