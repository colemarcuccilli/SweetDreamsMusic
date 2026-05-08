// app/api/quotes/[token]/accept/route.ts
//
// POST — recipient accepts a quote. Authenticated; the logged-in user
// must match the quote's user_id (solo) or be a member with admin role
// of the quote's band_id (band).
//
// Round C scope: state transition only. Sets accepted_at, status='accepted'.
// No entitlement minting, no payment plumbing — that comes in Round D
// (Stripe Checkout for one-off, Stripe Subscription for membership).
// Notifies admins via email so they can begin payment follow-up.

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { sendPackageQuoteAccepted } from '@/lib/email';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: 'You must be signed in to accept a quote.' },
      { status: 401 },
    );
  }

  const { token } = await params;
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const service = createServiceClient();

  const { data: quoteRow, error: qErr } = await service
    .from('package_quotes')
    .select('id, template_id, user_id, band_id, status, total_price_cents, expires_at')
    .eq('token', token)
    .maybeSingle();
  if (qErr || !quoteRow) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
  }

  type Quote = {
    id: string; template_id: string; user_id: string | null; band_id: string | null;
    status: string; total_price_cents: number; expires_at: string | null;
  };
  const quote = quoteRow as Quote;

  if (quote.status === 'accepted') {
    return NextResponse.json({ ok: true, alreadyAccepted: true });
  }
  if (quote.status === 'declined') {
    return NextResponse.json(
      { error: 'This quote was already declined. Ask admin for a new one.' },
      { status: 400 },
    );
  }
  if (quote.status === 'expired' || (quote.expires_at && new Date(quote.expires_at) < new Date())) {
    return NextResponse.json(
      { error: 'This quote has expired. Ask admin for a new one.' },
      { status: 400 },
    );
  }
  if (quote.status === 'draft') {
    return NextResponse.json(
      { error: 'This quote has not been sent yet.' },
      { status: 400 },
    );
  }

  // Authorization: the logged-in user must be the recipient.
  if (quote.user_id) {
    if (user.id !== quote.user_id) {
      return NextResponse.json(
        { error: 'This quote was sent to a different account.' },
        { status: 403 },
      );
    }
  } else if (quote.band_id) {
    // Band quote — caller must be an admin of the band.
    const { data: membership } = await service
      .from('band_members')
      .select('role')
      .eq('band_id', quote.band_id)
      .eq('user_id', user.id)
      .maybeSingle();
    type BM = { role: string };
    const m = membership as BM | null;
    if (!m || m.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only band admins can accept band quotes.' },
        { status: 403 },
      );
    }
  } else {
    return NextResponse.json({ error: 'Quote has no recipient' }, { status: 500 });
  }

  // Race-safe consume — only sent → accepted, prevents double-accept.
  const nowISO = new Date().toISOString();
  const { data: updated, error: updateErr } = await service
    .from('package_quotes')
    .update({ status: 'accepted', accepted_at: nowISO })
    .eq('id', quote.id)
    .eq('status', 'sent')
    .select('id');
  if (updateErr || !updated || updated.length === 0) {
    console.error('[quotes/accept] race or update error:', updateErr);
    return NextResponse.json(
      { error: 'Could not accept — refresh and try again.' },
      { status: 409 },
    );
  }

  // Notify admins. Pull template name + recipient name for the email.
  try {
    const [{ data: tpl }, { data: profile }] = await Promise.all([
      service.from('package_templates').select('name, is_membership').eq('id', quote.template_id).maybeSingle(),
      service.from('profiles').select('display_name, email').eq('user_id', user.id).maybeSingle(),
    ]);
    const t = tpl as { name: string; is_membership: boolean } | null;
    const p = profile as { display_name: string | null; email: string | null } | null;
    if (t) {
      await sendPackageQuoteAccepted({
        templateName: t.name,
        recipientName: p?.display_name ?? user.email.split('@')[0],
        recipientEmail: p?.email ?? user.email,
        totalPriceCents: quote.total_price_cents,
        isMembership: t.is_membership,
        quoteId: quote.id,
      });
    }
  } catch (e) {
    // Non-fatal — accept already committed.
    console.error('[quotes/accept] admin notify error:', e);
  }

  return NextResponse.json({ ok: true });
}
