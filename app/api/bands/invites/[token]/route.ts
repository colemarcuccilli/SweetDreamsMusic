import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * POST /api/bands/invites/[token] — accept or reject a pending invite.
 *
 * Body: { action: 'accept' | 'reject' }
 *
 * On accept:
 *   - Creates a band_members row carrying the invite's role + permission flags
 *   - Marks the invite accepted_at
 *   - Returns the bandId so the client can redirect
 *
 * Guardrails:
 *   - Caller must be authenticated AND their auth-verified email must match
 *     invited_email (case-insensitive). We don't trust client-supplied emails.
 *   - Invite must not be expired or already handled.
 *   - If the user is somehow already a member (edge case), we gracefully mark
 *     the invite accepted and return the band — don't double-insert.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  let body: { action?: 'accept' | 'reject' };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const action = body.action;
  if (action !== 'accept' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be "accept" or "reject"' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: invite, error: inviteErr } = await supabase
    .from('band_invites')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (inviteErr || !invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
  }
  if (invite.invited_email.toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json(
      { error: 'This invite was sent to a different email address.' },
      { status: 403 }
    );
  }
  if (invite.accepted_at || invite.rejected_at) {
    return NextResponse.json({ error: 'This invite has already been handled.' }, { status: 400 });
  }
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This invite has expired.' }, { status: 400 });
  }

  // Reject path: mark rejected_at and we're done.
  if (action === 'reject') {
    const { error } = await supabase
      .from('band_invites')
      .update({ rejected_at: new Date().toISOString() })
      .eq('id', invite.id);
    if (error) {
      console.error('[bands:invite:reject] update failed:', error);
      return NextResponse.json({ error: 'Failed to reject invite' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // Accept path: check not already a member, then insert band_members + mark accepted.
  const { data: existingMember } = await supabase
    .from('band_members')
    .select('id')
    .eq('band_id', invite.band_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!existingMember) {
    const { error: insertErr } = await supabase.from('band_members').insert({
      band_id: invite.band_id,
      user_id: user.id,
      role: invite.role,
      stage_name: invite.stage_name,
      band_role: invite.band_role,
      can_edit_public_page: invite.can_edit_public_page,
      can_book_sessions: invite.can_book_sessions,
      can_book_band_sessions: invite.can_book_band_sessions,
      can_manage_members: invite.can_manage_members,
    });

    if (insertErr) {
      console.error('[bands:invite:accept] member insert failed:', insertErr);
      return NextResponse.json({ error: 'Failed to join band' }, { status: 500 });
    }
  }

  // Mark accepted.
  const { error: updateErr } = await supabase
    .from('band_invites')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invite.id);
  if (updateErr) {
    // Non-fatal: the member row is created, just the invite flag didn't flip.
    console.error('[bands:invite:accept] invite update failed (non-fatal):', updateErr);
  }

  return NextResponse.json({ ok: true, bandId: invite.band_id });
}
