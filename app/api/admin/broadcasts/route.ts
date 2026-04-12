import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { verifyAdminAccess } from '@/lib/admin-auth';
import { SITE_URL } from '@/lib/constants';

const FROM = 'Sweet Dreams Music <studio@sweetdreamsmusic.com>';

function wrapEmail(content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#000;font-family:'IBM Plex Mono',monospace;color:#fff"><div style="max-width:600px;margin:0 auto;padding:40px 24px">${content}<div style="margin-top:40px;padding-top:24px;border-top:1px solid #333;text-align:center"><p style="color:#666;font-size:11px;margin:0">Sweet Dreams Music LLC &mdash; Fort Wayne, IN</p><p style="color:#666;font-size:11px;margin:4px 0 0"><a href="${SITE_URL}" style="color:#F4C430;text-decoration:none">sweetdreamsmusic.com</a></p></div></div></body></html>`;
}

// GET — list broadcast history
export async function GET() {
  const supabase = await createClient();
  const isAdmin = await verifyAdminAccess(supabase);
  if (!isAdmin) return NextResponse.json({ error: 'Admins only' }, { status: 401 });

  const service = createServiceClient();
  const { data, error } = await service
    .from('admin_broadcasts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ broadcasts: data || [] });
}

// POST — send a broadcast email
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const isAdmin = await verifyAdminAccess(supabase);
  if (!isAdmin) return NextResponse.json({ error: 'Admins only' }, { status: 401 });

  const { data: { user } } = await supabase.auth.getUser();

  const { subject, bodyHtml, templateKey, recipientEmails } = await request.json();

  if (!subject || !bodyHtml || !recipientEmails || recipientEmails.length === 0) {
    return NextResponse.json({ error: 'subject, bodyHtml, and recipientEmails required' }, { status: 400 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const fullHtml = wrapEmail(bodyHtml);

  let sentCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  // Send to each recipient individually (not BCC — each gets their own email)
  for (const email of recipientEmails) {
    try {
      await resend.emails.send({ from: FROM, to: email, subject, html: fullHtml });
      sentCount++;
    } catch (e) {
      failedCount++;
      errors.push(`${email}: ${(e as Error).message}`);
    }
  }

  // Log the broadcast
  const service = createServiceClient();
  await service.from('admin_broadcasts').insert({
    subject,
    body_html: bodyHtml,
    template_key: templateKey || null,
    recipient_count: sentCount,
    recipient_emails: recipientEmails,
    sent_by: user?.email || null,
  });

  return NextResponse.json({ sentCount, failedCount, errors, total: recipientEmails.length });
}
