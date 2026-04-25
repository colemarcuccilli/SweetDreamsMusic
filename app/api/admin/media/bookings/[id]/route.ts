// app/api/admin/media/bookings/[id]/route.ts
//
// Admin updates to a single media booking. PATCH handles two things:
//   1. status transitions (deposited → scheduled → in_production → delivered)
//   2. deliverables JSONB updates (admin paste video URLs, file links, etc)
//
// Why combined: admin typically marks a booking 'delivered' AT the same
// moment they paste the final deliverables. One PATCH = one round-trip.
//
// Status transition rules: we don't enforce a strict state machine here
// (admin needs to recover from mistakes). We just whitelist the allowed
// values and let admin land on any of them.

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

const ALLOWED_STATUSES = new Set([
  'inquiry',
  'deposited',
  'scheduled',
  'in_production',
  'delivered',
  'cancelled',
]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const update: Record<string, unknown> = {};

  // Status — whitelist only
  if (typeof body.status === 'string') {
    if (!ALLOWED_STATUSES.has(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    update.status = body.status;
  }

  // Deliverables — must be a plain object or null. We stash it verbatim;
  // the agreed shape is `{ items: [{ label, url, kind, added_at }] }` but
  // we don't validate item-level structure here so admins can experiment.
  if ('deliverables' in body) {
    if (body.deliverables === null || (typeof body.deliverables === 'object' && !Array.isArray(body.deliverables))) {
      update.deliverables = body.deliverables;
    } else {
      return NextResponse.json(
        { error: 'deliverables must be an object or null' },
        { status: 400 },
      );
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from('media_bookings')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('[admin/media/bookings] PATCH error:', error);
    return NextResponse.json({ error: 'Could not update booking' }, { status: 400 });
  }
  return NextResponse.json({ booking: data });
}
