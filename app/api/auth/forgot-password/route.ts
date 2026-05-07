// app/api/auth/forgot-password/route.ts
//
// POST /api/auth/forgot-password — initiate a branded password reset email.
//
// Why this exists: Supabase Auth's built-in `resetPasswordForEmail` sends the
// email through Supabase's own SMTP, which on free/default config is heavily
// rate-limited and uses an unbranded generic template. Users were reporting
// reset emails not arriving at all.
//
// Strategy: we use service.auth.admin.generateLink({ type: 'recovery' }) to
// MINT the recovery token without triggering Supabase's email send. That
// returns the same `action_link` URL Supabase would have emailed. Then we
// fire our own Resend email via the existing `sendPasswordReset` helper —
// fully branded with the studio's templates, delivered through the same
// Resend pipeline that handles every other transactional email on the
// platform.
//
// Security:
// - Always responds 200 regardless of whether the email matches a user
//   (anti-enumeration). The actual outcome is logged server-side.
// - Rate-limited to 5/min per IP via the `auth` bucket (configured in
//   middleware.ts → classifyPath).
// - Doesn't mirror into the user's Sweet Dreams thread — credential
//   rotation links shouldn't live in an inbox someone else might read.

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendPasswordReset } from '@/lib/email';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sweetdreamsmusic.com';

export async function POST(request: Request) {
  let email: string | undefined;
  try {
    const body = await request.json();
    email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : undefined;
  } catch {
    // Fall through to validation
  }

  // Basic shape check — don't bother going further if it's not even an email.
  // We still respond 200 so callers can't tell the difference between a bad
  // input and a non-existent user.
  if (!email || !/.+@.+\..+/.test(email)) {
    return NextResponse.json({ ok: true });
  }

  const service = createServiceClient();

  try {
    // Generate the recovery link without sending Supabase's built-in email.
    // The returned `action_link` is a Supabase verify URL — when clicked it
    // verifies the token, sets a session cookie, and redirects to our
    // `redirectTo`. The link is single-use and expires after 1 hour.
    const { data, error } = await service.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${SITE_URL}/reset-password`,
      },
    });

    if (error || !data?.properties?.action_link) {
      // Most common cause: no user with that email. Log it but don't tell
      // the caller — they'd be able to enumerate accounts.
      console.warn('[forgot-password] generateLink failed for', email, error?.message ?? '(no link)');
      return NextResponse.json({ ok: true });
    }

    const resetLink = data.properties.action_link;

    // Look up display_name for personalization. Fail-soft — if no profile,
    // we still send the email, just without the "Hey X" greeting.
    let userName: string | undefined;
    try {
      const { data: profile } = await service
        .from('profiles')
        .select('display_name')
        .eq('email', email)
        .maybeSingle();
      userName = (profile as { display_name?: string | null } | null)?.display_name ?? undefined;
    } catch (e) {
      console.error('[forgot-password] profile lookup error:', e);
    }

    await sendPasswordReset(email, resetLink, userName);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[forgot-password] unexpected error:', e);
    // Even on internal failure, don't leak — the user retries from the UI.
    return NextResponse.json({ ok: true });
  }
}
