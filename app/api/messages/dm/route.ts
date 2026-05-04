// app/api/messages/dm/route.ts
//
// Round 9d: create-or-reuse a producer↔user DM thread.
//
// POST { target_user_id } — initiated by a producer (or by a regular
// user contacting a specific producer). Returns the existing thread
// if these two have one already, otherwise creates a new producer_dm
// thread + 2 participant rows.
//
// "Always reuse a DM thread" per Cole — never two threads for the
// same pair of users.

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const targetUserId = typeof body.target_user_id === 'string' ? body.target_user_id.trim() : '';
  if (!targetUserId) {
    return NextResponse.json({ error: 'target_user_id required' }, { status: 400 });
  }
  if (targetUserId === user.id) {
    return NextResponse.json({ error: "You can't DM yourself" }, { status: 400 });
  }

  const service = createServiceClient();

  // Look up both profiles + their roles to determine who's the producer
  // side. Rule: at least one of the two must be a producer (is_producer=true).
  const { data: profiles } = await service
    .from('profiles')
    .select('user_id, is_producer, display_name, email, role')
    .in('user_id', [user.id, targetUserId]);
  type Prof = { user_id: string; is_producer: boolean; display_name: string | null; email: string | null; role: string };
  const profs = (profiles ?? []) as Prof[];
  if (profs.length < 2) {
    return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
  }
  const me = profs.find((p) => p.user_id === user.id);
  const target = profs.find((p) => p.user_id === targetUserId);
  if (!me || !target) {
    return NextResponse.json({ error: 'Profile lookup failed' }, { status: 500 });
  }

  const callerIsProducer = !!me.is_producer;
  const targetIsProducer = !!target.is_producer;
  if (!callerIsProducer && !targetIsProducer) {
    // Producer DMs require a producer on at least one side. For
    // user→admin/engineer, the user posts in their Sweet Dreams thread
    // (collective channel) — there's no separate DM model for staff.
    return NextResponse.json(
      {
        error:
          'DMs require a producer on at least one side. To message an admin or engineer, use your Sweet Dreams thread (the floating chat or /dashboard/inbox).',
      },
      { status: 403 },
    );
  }

  // Determine the buyer-side user_id (= owner_user_id on the thread).
  // If both are producers (rare), pick the caller as buyer-side; the
  // role tagging on participant rows is what actually matters for
  // permissions, not which one is "owner" on the thread row.
  const buyerSideId = callerIsProducer && !targetIsProducer ? targetUserId
    : !callerIsProducer && targetIsProducer ? user.id
    : user.id;
  const producerSideId = buyerSideId === user.id ? targetUserId : user.id;

  // Look for an existing DM thread between these two. The "always reuse"
  // rule: find any producer_dm where BOTH user_ids are participants.
  // We can't do this in a single SQL filter, so we get participant
  // rows for each side and intersect.
  const { data: meThreads } = await service
    .from('message_thread_participants')
    .select('thread_id')
    .eq('user_id', user.id);
  const myThreadIds = new Set((meThreads ?? []).map((p: { thread_id: string }) => p.thread_id));
  if (myThreadIds.size > 0) {
    const { data: targetThreads } = await service
      .from('message_thread_participants')
      .select('thread_id')
      .eq('user_id', targetUserId)
      .in('thread_id', Array.from(myThreadIds));
    const candidateIds = (targetThreads ?? []).map((p: { thread_id: string }) => p.thread_id);
    if (candidateIds.length > 0) {
      // Filter to only producer_dm kind
      const { data: existingThreads } = await service
        .from('message_threads')
        .select('id, kind')
        .in('id', candidateIds)
        .eq('kind', 'producer_dm');
      const existing = (existingThreads ?? [])[0] as { id: string } | undefined;
      if (existing) {
        return NextResponse.json({ thread_id: existing.id, reused: true });
      }
    }
  }

  // No existing thread — create one. owner_user_id is the buyer side
  // (the SD-thread participant gets to see this in their inbox alongside
  // their other personal threads).
  const subject = `${me.display_name ?? 'User'} ↔ ${target.display_name ?? 'User'}`;
  const { data: created, error: createErr } = await service
    .from('message_threads')
    .insert({
      kind: 'producer_dm',
      owner_user_id: buyerSideId,
      subject,
    })
    .select('id')
    .single();
  if (createErr || !created) {
    return NextResponse.json(
      { error: `Could not create DM thread: ${createErr?.message ?? 'unknown'}` },
      { status: 500 },
    );
  }
  const threadId = (created as { id: string }).id;

  // Add both participants
  await service.from('message_thread_participants').insert([
    { thread_id: threadId, user_id: buyerSideId, role: 'owner' },
    { thread_id: threadId, user_id: producerSideId, role: 'producer' },
  ]);

  return NextResponse.json({ thread_id: threadId, reused: false });
}
