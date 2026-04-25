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
import { sendMediaDeliverablesReady } from '@/lib/email';

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

  // Read the row before updating so we can detect "first deliverable"
  // transitions for the buyer-notification email. Single row read; cheap.
  const { data: prevRow } = await service
    .from('media_bookings')
    .select('deliverables, user_id, offering_id')
    .eq('id', id)
    .maybeSingle();

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

  // Phase E follow-up: first-deliverable notification.
  // Trigger conditions:
  //   1. This PATCH actually touched the deliverables field
  //   2. Previous state had no items (null, missing, or items=[])
  //   3. New state has at least 1 item
  // Subsequent additions don't fire — admin can email batch updates manually.
  // Fire-and-forget: any email failure is logged but never breaks the PATCH.
  if ('deliverables' in update && prevRow) {
    type DeliverablesShape = { items?: Array<{ label: string; url: string }> } | null;
    const prevItems = ((prevRow as { deliverables?: DeliverablesShape }).deliverables?.items ?? []);
    const newItems = ((update.deliverables as DeliverablesShape)?.items ?? []);
    if (prevItems.length === 0 && newItems.length > 0) {
      try {
        const buyerId = (prevRow as { user_id: string }).user_id;
        const offeringId = (prevRow as { offering_id: string }).offering_id;
        const [{ data: buyerProfile }, { data: offeringRow }] = await Promise.all([
          service.from('profiles').select('display_name, full_name, email').eq('user_id', buyerId).maybeSingle(),
          service.from('media_offerings').select('title').eq('id', offeringId).maybeSingle(),
        ]);
        const buyer = buyerProfile as { display_name?: string; full_name?: string; email?: string } | null;
        const offering = offeringRow as { title?: string } | null;
        const buyerEmail = buyer?.email;
        if (buyerEmail) {
          await sendMediaDeliverablesReady(buyerEmail, {
            buyerName: buyer?.full_name || buyer?.display_name || buyerEmail.split('@')[0] || 'there',
            offeringTitle: offering?.title || 'your media order',
            bookingId: id,
            itemCount: newItems.length,
          });
        }
      } catch (e) {
        console.error('[admin/media/bookings] deliverables ready email error:', e);
      }
    }
  }

  return NextResponse.json({ booking: data });
}
