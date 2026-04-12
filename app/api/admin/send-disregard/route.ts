import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminAccess } from '@/lib/admin-auth';

// One-time route — sends "please disregard" emails
// DELETE THIS FILE after use
export async function POST() {
  const supabase = await createClient();
  const isAdmin = await verifyAdminAccess(supabase);
  if (!isAdmin) return NextResponse.json({ error: 'Admins only' }, { status: 401 });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const FROM = 'Sweet Dreams Music <studio@sweetdreamsmusic.com>';

  const recipients = [
    { name: 'Victorion', email: 'victorion.brown@yahoo.com' },
    { name: 'Makayla', email: 'kayla206.098@gmail.com' },
    { name: 'Otmdw', email: 'bardockfan21savaeg@icloud.com' },
    { name: 'OTMskubwealth', email: 'Nigelbennett2008@icloud.com' },
  ];

  const results = [];
  for (const r of recipients) {
    try {
      const result = await resend.emails.send({
        from: FROM,
        to: r.email,
        subject: 'Please Disregard — Previous Email Sent in Error',
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#000;font-family:'IBM Plex Mono',monospace;color:#fff"><div style="max-width:600px;margin:0 auto;padding:40px 24px"><h1 style="font-size:24px;font-weight:700;color:#F4C430;text-transform:uppercase;margin:0 0 16px">PLEASE DISREGARD</h1><p style="font-size:14px;line-height:1.6;color:#ccc;margin:0 0 12px">Hey ${r.name}, we apologize for the confusion!</p><p style="font-size:14px;line-height:1.6;color:#ccc;margin:0 0 12px">You may have received a "Session Balance Due" email from us recently. That email was sent in error due to a system update. <strong>Please disregard it — no action is needed on your part.</strong></p><p style="font-size:14px;line-height:1.6;color:#ccc;margin:0 0 12px">We're sorry for any inconvenience. If you have any questions, feel free to reach out.</p><p style="font-size:14px;line-height:1.6;color:#ccc;margin:0 0 12px">— Sweet Dreams Music</p><div style="margin-top:40px;padding-top:24px;border-top:1px solid #333;text-align:center"><p style="color:#666;font-size:11px;margin:0">Sweet Dreams Music LLC — Fort Wayne, IN</p><p style="color:#666;font-size:11px;margin:4px 0 0"><a href="https://sweetdreamsmusic.com" style="color:#F4C430;text-decoration:none">sweetdreamsmusic.com</a></p></div></div></body></html>`,
      });
      results.push({ name: r.name, email: r.email, sent: true, id: result.data?.id });
    } catch (e) {
      results.push({ name: r.name, email: r.email, sent: false, error: (e as Error).message });
    }
  }

  return NextResponse.json({ results });
}
