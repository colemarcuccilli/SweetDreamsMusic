import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { verifyAdminAccess } from '@/lib/admin-auth';
import { sendEventCancellation } from '@/lib/email';

/**
 * GET /api/admin/events/[id] — single event + RSVP roster (admin view).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  if (!(await verifyAdminAccess(supabase))) {
    return NextResponse.json({ error: 'Admins only' }, { status: 401 });
  }

  const service = createServiceClient();
  const { data: event } = await service.from('events').select('*').eq('id', id).maybeSingle();
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  const { data: rsvps } = await service
    .from('event_rsvps')
    .select('*')
    .eq('event_id', id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ event, rsvps: rsvps || [] });
}

/**
 * PATCH /api/admin/events/[id] — update event fields. All fields optional;
 * only the keys in the body are updated. Use this for cancellation too
 * (set is_cancelled=true + cancellation_reason).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  if (!(await verifyAdminAccess(supabase))) {
    return NextResponse.json({ error: 'Admins only' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  // Whitelist what the admin can change. We deliberately exclude slug, id,
  // created_by, created_at — those are identity/audit fields.
  const patch: Record<string, unknown> = {};
  if (typeof body.title === 'string') patch.title = body.title.trim();
  if (typeof body.tagline === 'string') patch.tagline = body.tagline.trim() || null;
  if (typeof body.description === 'string') patch.description = body.description.trim() || null;
  if (typeof body.cover_image_url === 'string') patch.cover_image_url = body.cover_image_url.trim() || null;
  if (typeof body.starts_at === 'string') patch.starts_at = body.starts_at;
  if (typeof body.ends_at === 'string') patch.ends_at = body.ends_at || null;
  if (body.ends_at === null) patch.ends_at = null;
  if (typeof body.location === 'string') patch.location = body.location.trim() || null;
  if (typeof body.visibility === 'string') {
    if (!['public', 'private_listed', 'private_hidden'].includes(body.visibility)) {
      return NextResponse.json({ error: 'Invalid visibility' }, { status: 400 });
    }
    patch.visibility = body.visibility;
  }
  if (typeof body.capacity === 'number') patch.capacity = body.capacity > 0 ? body.capacity : null;
  if (body.capacity === null) patch.capacity = null;
  if (typeof body.is_cancelled === 'boolean') patch.is_cancelled = body.is_cancelled;
  if (typeof body.cancellation_reason === 'string') patch.cancellation_reason = body.cancellation_reason.trim() || null;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const service = createServiceClient();

  // Read the current state BEFORE updating so we can detect the false→true
  // transition on is_cancelled. If is_cancelled was already true, the admin
  // is just editing the reason — no need to re-notify attendees.
  const { data: before } = await service
    .from('events')
    .select('is_cancelled, title, starts_at, location')
    .eq('id', id)
    .maybeSingle();

  const { data, error } = await service.from('events').update(patch).eq('id', id).select().single();
  if (error) {
    console.error('[admin:events:update] failed:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }

  // Cancellation notification — only on the false→true transition.
  const justCancelled = before && !before.is_cancelled && patch.is_cancelled === true;
  if (justCancelled && before) {
    // Gather attendee emails (only 'going' / 'maybe' / 'invited' — 'not_going'
    // already said they weren't coming, and 'requested' never got approved).
    // event_rsvps rows come in two shapes: logged-in users (user_id set, email
    // lives in profiles) and token invites (invited_email set directly).
    const { data: rsvps } = await service
      .from('event_rsvps')
      .select('user_id, invited_email')
      .eq('event_id', id)
      .in('status', ['going', 'maybe', 'invited']);

    const emailsFromInvites = (rsvps || [])
      .map((r) => r.invited_email)
      .filter((e): e is string => typeof e === 'string' && e.length > 0);

    const userIds = (rsvps || [])
      .map((r) => r.user_id)
      .filter((u): u is string => typeof u === 'string' && u.length > 0);

    let emailsFromProfiles: string[] = [];
    if (userIds.length > 0) {
      // profiles.user_id is the FK to auth.users.id; event_rsvps.user_id
      // references auth.users.id too, so we join on profiles.user_id.
      const { data: profiles } = await service
        .from('profiles')
        .select('email')
        .in('user_id', userIds);
      emailsFromProfiles = (profiles || [])
        .map((p) => p.email)
        .filter((e): e is string => typeof e === 'string' && e.length > 0);
    }

    // De-dup the union — a user might also appear as an invited_email from
    // an earlier invite they later claimed.
    const toEmails = Array.from(new Set([...emailsFromProfiles, ...emailsFromInvites]));

    if (toEmails.length > 0) {
      sendEventCancellation({
        toEmails,
        eventTitle: before.title,
        eventStartsAt: before.starts_at,
        eventLocation: before.location,
        reason: typeof patch.cancellation_reason === 'string'
          ? patch.cancellation_reason
          : null,
      }).catch((e) => console.error('[admin:events:update] cancellation mail failed:', e));
    }
  }

  return NextResponse.json({ event: data });
}

/**
 * DELETE /api/admin/events/[id] — hard delete. RSVPs cascade (per migration
 * ON DELETE CASCADE). Prefer PATCH { is_cancelled: true } for events that
 * already have attendees — delete is for typos and never-published drafts.
 *
 * Refuses if there are any RSVPs unless ?force=true is provided.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  if (!(await verifyAdminAccess(supabase))) {
    return NextResponse.json({ error: 'Admins only' }, { status: 401 });
  }

  const url = new URL(request.url);
  const force = url.searchParams.get('force') === 'true';

  const service = createServiceClient();

  if (!force) {
    const { count } = await service
      .from('event_rsvps')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', id);
    if ((count || 0) > 0) {
      return NextResponse.json(
        { error: `Event has ${count} RSVP${count === 1 ? '' : 's'}. Pass ?force=true to delete anyway, or cancel instead.` },
        { status: 409 },
      );
    }
  }

  const { error } = await service.from('events').delete().eq('id', id);
  if (error) {
    console.error('[admin:events:delete] failed:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
