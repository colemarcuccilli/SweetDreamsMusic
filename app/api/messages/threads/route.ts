// app/api/messages/threads/route.ts
//
// Round 9b: GET the inbox list for the signed-in user.
//
// Returns all threads the user can see (Sweet Dreams + booking threads
// they own + producer DMs they participate in), sorted by recent
// activity, with display name + unread state precomputed for the UI.
//
// Staff (admin/engineer) get THEIR OWN inbox here — not the support
// queue. The support queue is /admin/messages and is admin-only.

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import type { Thread, ThreadWithMeta } from '@/lib/messaging';
import { defaultThreadDisplayName } from '@/lib/messaging';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  const service = createServiceClient();

  // Three queries (parallel) cover the user's three thread types:
  //   1. Sweet Dreams thread (owner_user_id = user)
  //   2. Booking threads (user is the booking's owner OR a band member)
  //   3. Producer DMs (user is a participant)
  const [sd, bookings, dms] = await Promise.all([
    service
      .from('message_threads')
      .select('*')
      .eq('kind', 'sweet_dreams')
      .eq('owner_user_id', user.id),

    // Booking threads visible to this user — joined with media_bookings to
    // filter by ownership/band-membership. RLS would handle this for
    // authenticated client, but we use service client + explicit filtering
    // for predictable behavior + N+1 avoidance.
    (async () => {
      // Get the user's owned booking IDs + their band-attached booking IDs
      const { data: ownedBookings } = await service
        .from('media_bookings')
        .select('id, offering_id')
        .eq('user_id', user.id);
      const { data: bandMemberships } = await service
        .from('band_members')
        .select('band_id')
        .eq('user_id', user.id);
      const bandIds = (bandMemberships ?? []).map((m: { band_id: string }) => m.band_id);
      let bandBookings: Array<{ id: string; offering_id: string }> = [];
      if (bandIds.length > 0) {
        const { data } = await service
          .from('media_bookings')
          .select('id, offering_id')
          .in('band_id', bandIds);
        bandBookings = (data ?? []) as typeof bandBookings;
      }
      // Plus any booking where this user is an attached engineer
      const { data: engineerSessions } = await service
        .from('media_session_bookings')
        .select('parent_booking_id')
        .eq('engineer_id', user.id);
      const engineerBookingIds = Array.from(
        new Set((engineerSessions ?? []).map((s: { parent_booking_id: string }) => s.parent_booking_id)),
      );

      // For admin: every booking. For everyone else: just the union above.
      let bookingIds: string[] = [];
      if (user.role === 'admin') {
        const { data: allBookings } = await service
          .from('media_bookings')
          .select('id, offering_id');
        const all = (allBookings ?? []) as Array<{ id: string; offering_id: string }>;
        bookingIds = all.map((b) => b.id);
      } else {
        bookingIds = Array.from(
          new Set([
            ...(ownedBookings ?? []).map((b: { id: string }) => b.id),
            ...bandBookings.map((b) => b.id),
            ...engineerBookingIds,
          ]),
        );
      }
      if (bookingIds.length === 0) return { data: [] };

      const { data: threads } = await service
        .from('message_threads')
        .select('*')
        .eq('kind', 'media_booking')
        .in('media_booking_id', bookingIds);

      // Hydrate offering titles for display names
      const threadsArr = (threads ?? []) as Thread[];
      const bookingIdToOfferingId = new Map<string, string>();
      const allBookingsResp = await service
        .from('media_bookings')
        .select('id, offering_id')
        .in('id', bookingIds);
      for (const b of (allBookingsResp.data ?? []) as Array<{ id: string; offering_id: string }>) {
        bookingIdToOfferingId.set(b.id, b.offering_id);
      }
      const offeringIds = Array.from(new Set(Array.from(bookingIdToOfferingId.values())));
      const titlesResp = offeringIds.length > 0
        ? await service.from('media_offerings').select('id, title').in('id', offeringIds)
        : { data: [] };
      const offeringTitles = new Map<string, string>();
      for (const o of (titlesResp.data ?? []) as Array<{ id: string; title: string }>) {
        offeringTitles.set(o.id, o.title);
      }

      return {
        data: threadsArr.map((t) => ({
          ...t,
          // Override the display name with the offering title when we have it
          subject: t.media_booking_id
            ? offeringTitles.get(bookingIdToOfferingId.get(t.media_booking_id) ?? '') ?? t.subject
            : t.subject,
        })),
      };
    })(),

    // Producer DMs — threads where the user is a participant
    (async () => {
      const { data: parts } = await service
        .from('message_thread_participants')
        .select('thread_id')
        .eq('user_id', user.id);
      const threadIds = (parts ?? []).map((p: { thread_id: string }) => p.thread_id);
      if (threadIds.length === 0) return { data: [] };
      const { data: threads } = await service
        .from('message_threads')
        .select('*')
        .eq('kind', 'producer_dm')
        .in('id', threadIds);
      return { data: threads ?? [] };
    })(),
  ]);

  const allThreads: Thread[] = [
    ...((sd.data ?? []) as Thread[]),
    ...((bookings.data ?? []) as Thread[]),
    ...((dms.data ?? []) as Thread[]),
  ];

  if (allThreads.length === 0) {
    return NextResponse.json({ threads: [] });
  }

  // Per-user last_read_at lookup for unread state
  const { data: parts } = await service
    .from('message_thread_participants')
    .select('thread_id, last_read_at')
    .eq('user_id', user.id)
    .in('thread_id', allThreads.map((t) => t.id));
  const lastReadByThread = new Map<string, string>();
  for (const p of (parts ?? []) as Array<{ thread_id: string; last_read_at: string }>) {
    lastReadByThread.set(p.thread_id, p.last_read_at);
  }

  // Last-message preview for each thread (one query, ranked per thread)
  const { data: previews } = await service
    .from('messages')
    .select('thread_id, body, author_role, kind, created_at')
    .in('thread_id', allThreads.map((t) => t.id))
    .order('created_at', { ascending: false });
  const latestByThread = new Map<string, { body: string | null; role: string; kind: string; at: string }>();
  for (const m of (previews ?? []) as Array<{ thread_id: string; body: string | null; author_role: string; kind: string; created_at: string }>) {
    if (!latestByThread.has(m.thread_id)) {
      latestByThread.set(m.thread_id, { body: m.body, role: m.author_role, kind: m.kind, at: m.created_at });
    }
  }

  const enriched: ThreadWithMeta[] = allThreads
    .map((t) => {
      const latest = latestByThread.get(t.id);
      const lastRead = lastReadByThread.get(t.id);
      const unread = !!latest && (!lastRead || latest.at > lastRead);
      return {
        ...t,
        display_name: defaultThreadDisplayName(t),
        unread,
        last_message_preview: latest?.body?.slice(0, 120) ?? undefined,
        last_message_role: latest?.role as ThreadWithMeta['last_message_role'],
      };
    })
    // Sweet Dreams thread always pinned at top, then other threads by recency
    .sort((a, b) => {
      if (a.kind === 'sweet_dreams' && b.kind !== 'sweet_dreams') return -1;
      if (b.kind === 'sweet_dreams' && a.kind !== 'sweet_dreams') return 1;
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
    });

  return NextResponse.json({ threads: enriched });
}
