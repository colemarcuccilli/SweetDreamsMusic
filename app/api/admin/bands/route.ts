// app/api/admin/bands/route.ts
//
// GET — admin search/list of all bands. Used by the GenerateQuoteModal
// to pick a band recipient for band-audience templates. Returns up to
// 50 results, prefer alphabetical.
//
// Read-only. Admin-only. Doesn't expose member rosters — just
// id + display_name + member_count for selection UX.

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim();

  const service = createServiceClient();

  let query = service
    .from('bands')
    .select('id, display_name')
    .order('display_name', { ascending: true })
    .limit(50);
  if (q.length >= 2) {
    query = query.ilike('display_name', `%${q}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ bands: data ?? [] });
}
