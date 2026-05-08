// app/api/admin/packages/templates/route.ts
//
// GET /api/admin/packages/templates — list all package templates with
// their lines hydrated. Admin-only. Read-only in this round; create /
// edit endpoints come in Round B alongside the calculator UI.
//
// The shape returned matches what the admin Templates list view expects:
// templates[] each with `lines: TemplateLine[]` already attached, so the
// component renders without additional fetches per row.

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

export interface TemplateLine {
  id: string;
  template_id: string;
  kind: 'studio_hours' | 'media_offering' | 'beat_credit' | 'custom';
  quantity: number;
  media_offering_id: string | null;
  full_price_cents: number;
  package_value_cents: number;
  notes: string | null;
  sort_order: number;
}

export interface PackageTemplate {
  id: string;
  name: string;
  description: string | null;
  slug: string | null;
  audience: 'solo' | 'band';
  is_membership: boolean;
  duration_days: number | null;
  membership_months: number | null;
  price_cents: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  lines: TemplateLine[];
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const service = createServiceClient();

  // Pull all templates (active + archived) sorted newest-first. Admin
  // sees archived too — they need to be able to reactivate or compare.
  const { data: templates, error: tErr } = await service
    .from('package_templates')
    .select('*')
    .order('created_at', { ascending: false });
  if (tErr) {
    console.error('[admin/packages/templates] fetch templates:', tErr);
    return NextResponse.json({ error: tErr.message }, { status: 500 });
  }

  const templatesArr = (templates ?? []) as Omit<PackageTemplate, 'lines'>[];

  // Empty state — no templates yet (the typical case in Round A). Skip
  // the lines query entirely.
  if (templatesArr.length === 0) {
    return NextResponse.json({ templates: [] });
  }

  // Hydrate lines in a single query, then group client-side. Avoids
  // N+1 even at low template counts.
  const templateIds = templatesArr.map((t) => t.id);
  const { data: lines, error: lErr } = await service
    .from('package_template_lines')
    .select('*')
    .in('template_id', templateIds)
    .order('sort_order', { ascending: true });
  if (lErr) {
    console.error('[admin/packages/templates] fetch lines:', lErr);
    return NextResponse.json({ error: lErr.message }, { status: 500 });
  }

  const linesByTemplate = new Map<string, TemplateLine[]>();
  for (const line of (lines ?? []) as TemplateLine[]) {
    const list = linesByTemplate.get(line.template_id) ?? [];
    list.push(line);
    linesByTemplate.set(line.template_id, list);
  }

  const result: PackageTemplate[] = templatesArr.map((t) => ({
    ...t,
    lines: linesByTemplate.get(t.id) ?? [],
  }));

  return NextResponse.json({ templates: result });
}
