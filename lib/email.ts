import { Resend } from 'resend';
import { SUPER_ADMINS, ROOM_LABELS, SITE_URL, type Room } from './constants';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Sweet Dreams Music <studio@sweetdreamsmusic.com>';

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function wrap(content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#000;font-family:'IBM Plex Mono',monospace;color:#fff"><div style="max-width:600px;margin:0 auto;padding:40px 24px">${content}<div style="margin-top:40px;padding-top:24px;border-top:1px solid #333;text-align:center"><p style="color:#666;font-size:11px;margin:0">Sweet Dreams Music LLC &mdash; Fort Wayne, IN</p><p style="color:#666;font-size:11px;margin:4px 0 0"><a href="${SITE_URL}" style="color:#F4C430;text-decoration:none">sweetdreamsmusic.com</a></p></div></div></body></html>`;
}

function btn(text: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:#F4C430;color:#000;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;font-size:13px;padding:14px 28px;text-decoration:none;margin-top:16px">${text}</a>`;
}

function h1(text: string): string {
  return `<h1 style="font-size:24px;font-weight:700;color:#F4C430;text-transform:uppercase;letter-spacing:0.02em;margin:0 0 16px">${text}</h1>`;
}

function p(text: string): string {
  return `<p style="font-size:14px;line-height:1.6;color:#ccc;margin:0 0 12px">${text}</p>`;
}

function detail(label: string, value: string): string {
  return `<tr><td style="padding:6px 16px 6px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.05em">${label}</td><td style="padding:6px 0;color:#fff;font-size:14px;font-weight:600">${value}</td></tr>`;
}

function detailTable(rows: string): string {
  return `<table style="margin:20px 0;border-collapse:collapse">${rows}</table>`;
}

export async function sendBookingConfirmation(to: string, details: {
  customerName: string; date: string; startTime: string; duration: number;
  room: string; total: number; deposit: number;
}) {
  try {
    const roomLabel = ROOM_LABELS[details.room as Room] || details.room;
    await resend.emails.send({
      from: FROM, to, subject: 'Booking Confirmed — Sweet Dreams Music',
      html: wrap(`
        ${h1('Booking Confirmed')}
        ${p(`Hey ${details.customerName}, your session is booked!`)}
        ${detailTable(`
          ${detail('Date', details.date)}
          ${detail('Time', details.startTime)}
          ${detail('Duration', `${details.duration} hour${details.duration > 1 ? 's' : ''}`)}
          ${detail('Studio', roomLabel)}
          ${detail('Deposit Paid', formatMoney(details.deposit))}
          ${detail('Remainder Due', formatMoney(details.total - details.deposit))}
          ${detail('Total', formatMoney(details.total))}
        `)}
        ${p('An engineer will be assigned to your session shortly. You\'ll receive another email when they\'re confirmed.')}
        ${p('The remaining balance will be charged to your card on file after your session.')}
        ${btn('View Dashboard', `${SITE_URL}/dashboard`)}
      `),
    });
  } catch (e) { console.error('Email error (booking confirmation):', e); }
}

export async function sendEngineerNewBookingAlert(engineerEmails: string[], booking: {
  id: string; customerName: string; date: string; startTime: string;
  duration: number; room: string;
}) {
  try {
    const roomLabel = ROOM_LABELS[booking.room as Room] || booking.room;
    await resend.emails.send({
      from: FROM, to: engineerEmails, subject: 'New Session Available — Claim It',
      html: wrap(`
        ${h1('New Session Available')}
        ${p('A new booking just came in. First to claim it gets the session.')}
        ${detailTable(`
          ${detail('Client', booking.customerName)}
          ${detail('Date', booking.date)}
          ${detail('Time', booking.startTime)}
          ${detail('Duration', `${booking.duration} hour${booking.duration > 1 ? 's' : ''}`)}
          ${detail('Studio', roomLabel)}
        `)}
        ${btn('Claim Session', `${SITE_URL}/engineer`)}
      `),
    });
  } catch (e) { console.error('Email error (engineer alert):', e); }
}

export async function sendEngineerAssigned(to: string, details: {
  customerName: string; engineerName: string; date: string; startTime: string;
}) {
  try {
    await resend.emails.send({
      from: FROM, to, subject: 'Engineer Assigned — Sweet Dreams Music',
      html: wrap(`
        ${h1('Engineer Assigned')}
        ${p(`Hey ${details.customerName}, your engineer has been confirmed!`)}
        ${detailTable(`
          ${detail('Engineer', details.engineerName)}
          ${detail('Date', details.date)}
          ${detail('Time', details.startTime)}
        `)}
        ${p('See you at the studio. If you need to make changes, reach out to us.')}
        ${btn('View Dashboard', `${SITE_URL}/dashboard`)}
      `),
    });
  } catch (e) { console.error('Email error (engineer assigned):', e); }
}

export async function sendEngineerClaimConfirmation(to: string, details: {
  engineerName: string; customerName: string; date: string; startTime: string;
  duration: number; room: string; total: number; remainder: number;
}) {
  try {
    const roomLabel = ROOM_LABELS[details.room as Room] || details.room;
    await resend.emails.send({
      from: FROM, to, subject: 'Session Claimed — Sweet Dreams Music',
      html: wrap(`
        ${h1('Session Claimed')}
        ${p(`Hey ${details.engineerName}, you've claimed this session.`)}
        ${detailTable(`
          ${detail('Client', details.customerName)}
          ${detail('Date', details.date)}
          ${detail('Time', details.startTime)}
          ${detail('Duration', `${details.duration} hour${details.duration > 1 ? 's' : ''}`)}
          ${detail('Studio', roomLabel)}
          ${detail('Session Total', formatMoney(details.total))}
          ${detail('Remainder to Collect', formatMoney(details.remainder))}
        `)}
        ${p('Remember to charge the remainder after the session wraps up.')}
        ${btn('View Dashboard', `${SITE_URL}/engineer`)}
      `),
    });
  } catch (e) { console.error('Email error (engineer claim confirmation):', e); }
}

export async function sendAdminBookingAlert(booking: {
  id: string; customerName: string; customerEmail: string; date: string;
  startTime: string; duration: number; room: string; total: number;
}) {
  try {
    const roomLabel = ROOM_LABELS[booking.room as Room] || booking.room;
    await resend.emails.send({
      from: FROM, to: [...SUPER_ADMINS], subject: `New Booking — ${booking.customerName}`,
      html: wrap(`
        ${h1('New Booking')}
        ${detailTable(`
          ${detail('Client', booking.customerName)}
          ${detail('Email', booking.customerEmail)}
          ${detail('Date', booking.date)}
          ${detail('Time', booking.startTime)}
          ${detail('Duration', `${booking.duration}hr`)}
          ${detail('Studio', roomLabel)}
          ${detail('Total', formatMoney(booking.total))}
        `)}
        ${btn('View in Admin', `${SITE_URL}/admin`)}
      `),
    });
  } catch (e) { console.error('Email error (admin alert):', e); }
}

export async function sendSessionReminder(to: string, details: {
  customerName: string; date: string; startTime: string;
  room: string; engineerName: string | null;
}) {
  try {
    const roomLabel = ROOM_LABELS[details.room as Room] || details.room;
    await resend.emails.send({
      from: FROM, to, subject: 'Session in 1 Hour — Sweet Dreams Music',
      html: wrap(`
        ${h1('Session Reminder')}
        ${p(`Hey ${details.customerName}, your session starts in 1 hour!`)}
        ${detailTable(`
          ${detail('Time', details.startTime)}
          ${detail('Studio', roomLabel)}
          ${details.engineerName ? detail('Engineer', details.engineerName) : ''}
        `)}
        ${p('Make sure to arrive a few minutes early. See you soon!')}
      `),
    });
  } catch (e) { console.error('Email error (session reminder):', e); }
}

export async function sendPasswordReset(to: string, resetLink: string) {
  try {
    await resend.emails.send({
      from: FROM, to, subject: 'Reset Your Password — Sweet Dreams Music',
      html: wrap(`
        ${h1('Reset Password')}
        ${p('We received a request to reset your password. Click the button below to set a new one.')}
        ${btn('Reset Password', resetLink)}
        ${p('If you didn\'t request this, you can safely ignore this email.')}
        <p style="font-size:11px;color:#666;margin-top:24px;word-break:break-all">${resetLink}</p>
      `),
    });
  } catch (e) { console.error('Email error (password reset):', e); }
}

export async function sendWelcomeEmail(to: string, name: string) {
  try {
    await resend.emails.send({
      from: FROM, to, subject: 'Welcome to Sweet Dreams Music',
      html: wrap(`
        ${h1('Welcome')}
        ${p(`Hey ${name}, welcome to Sweet Dreams Music!`)}
        ${p('Your account is set up. You can now book recording sessions, browse beats, and build your public artist profile.')}
        ${btn('Book a Session', `${SITE_URL}/book`)}
        ${p('See you in the studio.')}
      `),
    });
  } catch (e) { console.error('Email error (welcome):', e); }
}

export async function sendSessionFilesDelivered(to: string, details: {
  customerName: string; engineerName: string; fileCount: number;
  date: string; room: string;
}) {
  try {
    const roomLabel = ROOM_LABELS[details.room as Room] || details.room;
    const reviewUrl = 'https://g.page/r/CcWAY0XlIQNpEBM/review';
    await resend.emails.send({
      from: FROM, to, subject: 'Your Session Files Are Ready — Sweet Dreams Music',
      html: wrap(`
        ${h1('Your Files Are Ready')}
        ${p(`Hey ${details.customerName},`)}
        ${p(`Thanks for coming in! ${details.engineerName} has uploaded ${details.fileCount} file${details.fileCount > 1 ? 's' : ''} from your ${roomLabel} session. You can download them from your dashboard.`)}
        ${btn('Download Files', `${SITE_URL}/dashboard`)}
        <div style="margin-top:32px;padding:24px;background:#111;border-left:3px solid #F4C430">
          ${p('We hope you had a great experience at Sweet Dreams Music. If you did, it would mean a lot if you left us a quick review on Google.')}
          <a href="${reviewUrl}" style="display:inline-block;background:#F4C430;color:#000;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;font-size:13px;padding:14px 28px;text-decoration:none;margin-top:12px">Leave a Review</a>
        </div>
        ${p('See you next time!')}
      `),
    });
  } catch (e) { console.error('Email error (files delivered):', e); }
}

export async function sendContactForm(details: {
  name: string; email: string; subject: string; message: string;
}) {
  try {
    await resend.emails.send({
      from: FROM, to: [...SUPER_ADMINS], replyTo: details.email,
      subject: `Contact Form: ${details.subject}`,
      html: wrap(`
        ${h1('Contact Form')}
        ${detailTable(`
          ${detail('Name', details.name)}
          ${detail('Email', details.email)}
          ${detail('Subject', details.subject)}
        `)}
        <div style="background:#111;padding:16px;margin:16px 0;border-left:3px solid #F4C430">
          <p style="font-size:14px;color:#ccc;margin:0;white-space:pre-wrap">${details.message}</p>
        </div>
      `),
    });
  } catch (e) { console.error('Email error (contact form):', e); }
}
