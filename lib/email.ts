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
  room: string; total: number; deposit: number; bookingId?: string;
}) {
  try {
    const roomLabel = ROOM_LABELS[details.room as Room] || details.room;
    const prepUrl = details.bookingId ? `${SITE_URL}/dashboard/prep/${details.bookingId}` : `${SITE_URL}/dashboard`;
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
        <div style="margin-top:24px;padding:20px;background:#111;border-left:3px solid #F4C430">
          ${p('<strong style="color:#F4C430">🎤 Prepare for Your Session</strong>')}
          ${p('Don\'t waste studio time searching for beats! Upload your beat, share reference tracks, and let your engineer know what you want to accomplish — so you can hit the ground running.')}
          ${btn('Prepare Now', prepUrl)}
        </div>
        ${btn('View Dashboard', `${SITE_URL}/dashboard`)}
      `),
    });
  } catch (e) { console.error('Email error (booking confirmation):', e); }
}

export async function sendEngineerNewBookingAlert(engineerEmails: string[], booking: {
  id: string; customerName: string; date: string; startTime: string;
  duration: number; room: string;
}) {
  const roomLabel = ROOM_LABELS[booking.room as Room] || booking.room;
  const html = wrap(`
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
  `);

  // Send individually so one bounce doesn't kill all
  for (const email of engineerEmails) {
    try {
      console.log('[EMAIL] Sending engineer alert to:', email);
      await resend.emails.send({
        from: FROM, to: email, subject: 'New Session Available — Claim It', html,
      });
      console.log('[EMAIL] Sent successfully to:', email);
    } catch (e) {
      console.error('[EMAIL] Failed to send engineer alert to:', email, e);
    }
  }
}

export async function sendEngineerPriorityAlert(to: string, details: {
  id: string; customerName: string; date: string; startTime: string;
  duration: number; room: string; priorityHours: number | string;
}) {
  try {
    const roomLabel = ROOM_LABELS[details.room as Room] || details.room;
    const windowLabel = typeof details.priorityHours === 'number'
      ? `${details.priorityHours} hours`
      : details.priorityHours;
    await resend.emails.send({
      from: FROM, to,
      subject: 'You\'ve Been Requested — Accept or Pass',
      html: wrap(`
        ${h1('You\'ve Been Requested')}
        ${p(`A client specifically requested you for their session. You have <strong>${windowLabel}</strong> to accept before it opens to other engineers.`)}
        ${detailTable(`
          ${detail('Client', details.customerName)}
          ${detail('Date', details.date)}
          ${detail('Time', details.startTime)}
          ${detail('Duration', `${details.duration} hour${details.duration > 1 ? 's' : ''}`)}
          ${detail('Studio', roomLabel)}
          ${detail('Priority Window', windowLabel)}
        `)}
        ${btn('Accept or Pass', `${SITE_URL}/engineer`)}
        ${p('Click <strong>Accept</strong> to lock in the session, or <strong>Pass</strong> to immediately open it to other engineers.')}
        ${p('If you don\'t respond, the session will automatically open to others when the priority window expires.')}
      `),
    });
  } catch (e) { console.error('Email error (priority alert):', e); }
}

export async function sendPriorityReminderToEngineer(to: string, details: {
  customerName: string; date: string; startTime: string; room: string;
  hoursRemaining: string;
}) {
  try {
    const roomLabel = ROOM_LABELS[details.room as Room] || details.room;
    await resend.emails.send({
      from: FROM, to,
      subject: `Priority Expiring Soon — ${details.customerName}'s Session`,
      html: wrap(`
        ${h1('Priority Expiring Soon')}
        ${p(`You were requested for a session with ${details.customerName} and your priority expires in <strong>${details.hoursRemaining}</strong>.`)}
        ${detailTable(`
          ${detail('Client', details.customerName)}
          ${detail('Date', details.date)}
          ${detail('Time', details.startTime)}
          ${detail('Studio', roomLabel)}
        `)}
        ${btn('Accept or Pass', `${SITE_URL}/engineer`)}
        ${p('If you don\'t respond, the session will automatically open to all engineers.')}
      `),
    });
  } catch (e) { console.error('Email error (priority reminder):', e); }
}

export async function sendEngineerAssignedNonRequested(to: string, details: {
  customerName: string; requestedEngineer: string; assignedEngineer: string;
  date: string; startTime: string; rescheduleDeadline: string;
}) {
  try {
    await resend.emails.send({
      from: FROM, to,
      subject: 'Engineer Update — Sweet Dreams Music',
      html: wrap(`
        ${h1('Your Session Engineer')}
        ${p(`Hey ${details.customerName},`)}
        ${p(`Unfortunately, <strong>${details.requestedEngineer}</strong> was not available for your session. <strong>${details.assignedEngineer}</strong> has accepted your session and will be your engineer.`)}
        ${detailTable(`
          ${detail('Your Engineer', details.assignedEngineer)}
          ${detail('Originally Requested', details.requestedEngineer)}
          ${detail('Session Date', details.date)}
          ${detail('Session Time', details.startTime)}
        `)}
        ${p('All of our engineers are professionals who will give you an amazing session.')}
        <div style="margin-top:24px;padding:20px;background:#111;border-left:3px solid #F4C430">
          ${p('If you\'d like to reschedule to try to get your preferred engineer, you can request a reschedule from your dashboard.')}
          ${p(`<span style="color:#F4C430;font-size:12px;font-weight:700">Reschedule requests must be submitted by ${details.rescheduleDeadline} (8 hours before your session).</span>`)}
          ${btn('Request Reschedule', `${SITE_URL}/dashboard`)}
        </div>
      `),
    });
  } catch (e) { console.error('Email error (non-requested engineer assigned):', e); }
}

export async function sendEngineerPassNotification(engineerEmails: string[], details: {
  customerName: string; date: string; startTime: string;
  duration: number; room: string; passedEngineer: string;
}) {
  const roomLabel = ROOM_LABELS[details.room as Room] || details.room;
  const html = wrap(`
    ${h1('Session Now Available')}
    ${p(`${details.passedEngineer} passed on this session. It's now open — first to accept gets it.`)}
    ${detailTable(`
      ${detail('Client', details.customerName)}
      ${detail('Date', details.date)}
      ${detail('Time', details.startTime)}
      ${detail('Duration', `${details.duration} hour${details.duration > 1 ? 's' : ''}`)}
      ${detail('Studio', roomLabel)}
    `)}
    ${btn('Accept Session', `${SITE_URL}/engineer`)}
  `);

  for (const email of engineerEmails) {
    try {
      await resend.emails.send({
        from: FROM, to: email, subject: `Session Available — ${details.customerName}`, html,
      });
    } catch (e) {
      console.error(`Email error (pass notification to ${email}):`, e);
    }
  }
}

export async function sendPriorityExpiredToClient(to: string, details: {
  customerName: string; requestedEngineer: string; date: string; startTime: string;
}) {
  try {
    await resend.emails.send({
      from: FROM, to,
      subject: 'Engineer Update — Sweet Dreams Music',
      html: wrap(`
        ${h1('Engineer Update')}
        ${p(`Hey ${details.customerName},`)}
        ${p(`Unfortunately, ${details.requestedEngineer} is not available for your session on ${details.date} at ${details.startTime}. One of our other talented engineers will be reaching out to handle your session.`)}
        ${p('If you\'d like to reschedule to wait for your preferred engineer, you can request a reschedule from your dashboard.')}
        ${detailTable(`
          ${detail('Requested Engineer', details.requestedEngineer)}
          ${detail('Session Date', details.date)}
          ${detail('Session Time', details.startTime)}
        `)}
        ${btn('View Dashboard', `${SITE_URL}/dashboard`)}
        ${p('All of our engineers are professionals who will give you an amazing session. If you have any concerns, reach out to us.')}
      `),
    });
  } catch (e) { console.error('Email error (priority expired):', e); }
}

export async function sendRescheduleRequestAlert(details: {
  customerName: string; customerEmail: string; artistName?: string | null;
  date: string; startTime: string; room: string;
  reason: string; currentEngineer: string | null;
}) {
  try {
    const roomLabel = ROOM_LABELS[details.room as Room] || details.room;
    await resend.emails.send({
      from: FROM, to: [...SUPER_ADMINS],
      subject: `Reschedule Request — ${details.customerName}`,
      html: wrap(`
        ${h1('Reschedule Request')}
        ${p(`${details.customerName} has requested to reschedule their session.`)}
        ${detailTable(`
          ${detail('Client', details.customerName)}
          ${details.artistName ? detail('Artist Name', details.artistName) : ''}
          ${detail('Email', details.customerEmail)}
          ${detail('Current Date', details.date)}
          ${detail('Current Time', details.startTime)}
          ${detail('Studio', roomLabel)}
          ${details.currentEngineer ? detail('Current Engineer', details.currentEngineer) : ''}
          ${detail('Reason', details.reason)}
        `)}
        ${p('Please review this request and reach out to the client to coordinate.')}
        ${btn('View Admin Dashboard', `${SITE_URL}/admin`)}
      `),
    });
  } catch (e) { console.error('Email error (reschedule request):', e); }
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
  customerName: string; artistName?: string | null; date: string; startTime: string;
  room: string; engineerName: string | null; bookingId?: string; hasPrep?: boolean;
}) {
  try {
    const roomLabel = ROOM_LABELS[details.room as Room] || details.room;
    const prepUrl = details.bookingId ? `${SITE_URL}/dashboard/prep/${details.bookingId}` : null;
    await resend.emails.send({
      from: FROM, to, subject: 'Session in 1 Hour — Sweet Dreams Music',
      html: wrap(`
        ${h1('Session Reminder')}
        ${p(`Hey ${details.customerName}, your session starts in 1 hour!`)}
        ${detailTable(`
          ${detail('Date', details.date)}
          ${detail('Time', details.startTime)}
          ${detail('Studio', roomLabel)}
          ${details.engineerName ? detail('Engineer', details.engineerName) : ''}
        `)}
        ${!details.hasPrep && prepUrl ? `
          <div style="margin-top:16px;padding:16px;background:#111;border-left:3px solid #F4C430">
            ${p('<strong style="color:#F4C430">⚡ Quick Tip</strong>')}
            ${p('You haven\'t filled out your session prep yet. Even a quick note about what you want to work on helps your engineer prepare.')}
            ${btn('Prepare Now', prepUrl)}
          </div>
        ` : ''}
        ${p('Make sure to arrive a few minutes early. See you soon!')}
      `),
    });
  } catch (e) { console.error('Email error (session reminder):', e); }
}

export async function sendSessionReminderToStaff(emails: string[], details: {
  customerName: string; customerEmail: string; artistName?: string | null;
  date: string; startTime: string; duration: number;
  room: string; engineerName: string;
  prepSummary?: { sessionType?: string; hasBeats?: boolean; beatSource?: string; lyricsStatus?: string; goals?: string; refCount?: number } | null;
}) {
  try {
    const roomLabel = ROOM_LABELS[details.room as Room] || details.room;
    const prep = details.prepSummary;
    const prepSection = prep ? `
      <div style="margin-top:16px;padding:16px;background:#111;border-left:3px solid #F4C430">
        <p style="font-size:12px;color:#F4C430;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 12px">Session Prep</p>
        ${detailTable(`
          ${prep.sessionType ? detail('Type', prep.sessionType) : ''}
          ${prep.goals ? detail('Goals', prep.goals.substring(0, 120) + (prep.goals.length > 120 ? '...' : '')) : ''}
          ${prep.beatSource ? detail('Beat', prep.beatSource) : ''}
          ${prep.lyricsStatus ? detail('Lyrics', prep.lyricsStatus) : ''}
          ${prep.refCount ? detail('References', `${prep.refCount} track${prep.refCount > 1 ? 's' : ''}`) : ''}
        `)}
      </div>
    ` : '';

    const html = wrap(`
      ${h1('Upcoming Session — 1 Hour')}
      ${p('A session is starting in about 1 hour.')}
      ${detailTable(`
        ${detail('Name', details.customerName)}
        ${details.artistName ? detail('Artist Name', details.artistName) : ''}
        ${detail('Email', details.customerEmail)}
        ${detail('Date', details.date)}
        ${detail('Time', details.startTime)}
        ${detail('Duration', `${details.duration} hour${details.duration > 1 ? 's' : ''}`)}
        ${detail('Studio', roomLabel)}
        ${detail('Engineer', details.engineerName)}
      `)}
      ${prepSection}
      ${btn('View Dashboard', `${SITE_URL}/admin`)}
    `);

    for (const email of emails) {
      try {
        await resend.emails.send({
          from: FROM, to: email,
          subject: `Session in 1 Hour — ${details.customerName}${details.artistName ? ` (${details.artistName})` : ''}`,
          html,
        });
      } catch (e) {
        console.error(`Email error (staff reminder to ${email}):`, e);
      }
    }
  } catch (e) { console.error('Email error (staff reminder):', e); }
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

export async function sendPaymentLink(to: string, details: {
  customerName: string; amount: number; paymentUrl: string;
}) {
  try {
    await resend.emails.send({
      from: FROM, to, subject: 'Complete Your Remaining Balance — Sweet Dreams Music',
      html: wrap(`
        ${h1('Remaining Balance')}
        ${p(`Hey ${details.customerName}, your session is complete! Please pay the remaining balance below.`)}
        ${detailTable(`
          ${detail('Amount Due', formatMoney(details.amount))}
        `)}
        ${p('Click the button below to securely complete your payment.')}
        ${btn('PAY NOW', details.paymentUrl)}
        ${p('<span style="color:#666;font-size:11px">This is a secure payment link powered by Stripe. If you have any questions, reply to this email.</span>')}
      `),
    });
  } catch (e) { console.error('Email error (payment link):', e); }
}

export async function sendSessionInvite(to: string, details: {
  customerName: string; engineerName: string; date: string; startTime: string;
  duration: number; room: string; total: number; deposit: number;
  inviteUrl: string; isCash: boolean;
}) {
  try {
    const roomLabel = ROOM_LABELS[details.room as Room] || details.room;
    const subject = details.isCash
      ? 'Session Scheduled — Sweet Dreams Music'
      : 'You\'re Invited to a Session — Sweet Dreams Music';

    await resend.emails.send({
      from: FROM, to, subject,
      html: wrap(`
        ${h1(details.isCash ? 'Session Scheduled' : 'Session Invite')}
        ${p(`Hey ${details.customerName}, ${details.engineerName} has ${details.isCash ? 'booked a session for you' : 'invited you to a session'} at Sweet Dreams Music!`)}
        ${detailTable(`
          ${detail('Date', details.date)}
          ${detail('Time', details.startTime)}
          ${detail('Duration', `${details.duration} hour${details.duration > 1 ? 's' : ''}`)}
          ${detail('Studio', roomLabel)}
          ${detail('Total', formatMoney(details.total))}
          ${details.isCash
            ? detail('Payment', 'Cash — pay at the studio')
            : detail('Deposit Due', formatMoney(details.deposit))
          }
        `)}
        ${details.isCash
          ? p('Your session is confirmed. See you at the studio!')
          : p('Click the button below to pay your deposit and confirm your session.')
        }
        ${btn(details.isCash ? 'VIEW SESSION' : 'PAY DEPOSIT & CONFIRM', details.inviteUrl)}
        ${p('<span style="color:#666;font-size:11px">If you have any questions, reply to this email.</span>')}
      `),
    });
  } catch (e) { console.error('Email error (session invite):', e); }
}

export async function sendBeatReviewNotification(to: string, details: {
  producerName: string; beatTitle: string;
}) {
  try {
    await resend.emails.send({
      from: FROM, to,
      subject: 'New Beat Uploaded — Review Required',
      html: wrap(`
        ${h1('New Beat for Review')}
        ${p(`Hey ${details.producerName},`)}
        ${p(`A new beat has been uploaded to your catalog and needs your review before it goes live on the store.`)}
        ${detailTable(`
          ${detail('Beat', details.beatTitle)}
          ${detail('Status', 'Pending Review')}
        `)}
        ${p('Please log in to your Producer Dashboard to review the beat details and sign the agreement to make it live.')}
        ${btn('Review Beat', `${SITE_URL}/producer`)}
        ${p('<span style="color:#666;font-size:11px">The beat will not appear on the store until you review and approve it.</span>')}
      `),
    });
  } catch (e) { console.error('Email error (beat review notification):', e); }
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

// ── Private Beat Sale Emails ──────────────────────────────────────────

export async function sendPrivateBeatSaleInvite(to: string, details: {
  buyerName: string; beatTitle: string; producerName: string;
  licenseType: string; amount: number; requiresPayment: boolean; token: string;
}) {
  try {
    const actionText = details.requiresPayment ? 'Review & Purchase' : 'Review & Sign';
    await resend.emails.send({
      from: FROM, to,
      subject: `Private Beat Sale — ${details.beatTitle}`,
      html: wrap(`
        ${h1('PRIVATE BEAT SALE')}
        ${p(`Hey ${details.buyerName}, ${details.producerName} has set up a private beat sale for you.`)}
        ${detailTable(`
          ${detail('Beat', details.beatTitle)}
          ${detail('Producer', details.producerName)}
          ${detail('License', details.licenseType)}
          ${detail('Price', details.requiresPayment ? formatMoney(details.amount) : 'Included / No Charge')}
        `)}
        ${p(details.requiresPayment
          ? 'Review the details below, sign the license agreement, and complete your payment to receive your files.'
          : 'Review the details below and sign the license agreement to receive your files.'
        )}
        ${btn(actionText, `${SITE_URL}/beats/private/${details.token}`)}
        ${p('<span style="color:#666;font-size:11px">If you have any questions, reply to this email.</span>')}
      `),
    });
  } catch (e) { console.error('Email error (private beat sale invite):', e); }
}

export async function sendPrivateBeatSaleComplete(to: string, details: {
  buyerName: string; beatTitle: string; producerName: string;
  licenseType: string; amount: number; token: string;
}) {
  try {
    await resend.emails.send({
      from: FROM, to,
      subject: `Beat Purchase Complete — ${details.beatTitle}`,
      html: wrap(`
        ${h1('PURCHASE COMPLETE')}
        ${p(`Hey ${details.buyerName}, your beat purchase is complete! You can now download your files.`)}
        ${detailTable(`
          ${detail('Beat', details.beatTitle)}
          ${detail('Producer', details.producerName)}
          ${detail('License', details.licenseType)}
          ${detail('Amount Paid', formatMoney(details.amount))}
        `)}
        ${btn('Download Files', `${SITE_URL}/beats/private/${details.token}`)}
        ${p('<span style="color:#666;font-size:11px">Your license agreement is available on your download page.</span>')}
      `),
    });
  } catch (e) { console.error('Email error (private beat sale complete):', e); }
}

export async function sendPrivateBeatSaleNotification(to: string, details: {
  buyerName: string; buyerEmail: string; beatTitle: string;
  licenseType: string; amount: number; paymentMethod: string;
}) {
  try {
    await resend.emails.send({
      from: FROM, to,
      subject: `Beat Sale Completed — ${details.beatTitle}`,
      html: wrap(`
        ${h1('SALE COMPLETED')}
        ${p(`${details.buyerName} has completed their private beat purchase.`)}
        ${detailTable(`
          ${detail('Buyer', details.buyerName)}
          ${detail('Email', details.buyerEmail)}
          ${detail('Beat', details.beatTitle)}
          ${detail('License', details.licenseType)}
          ${detail('Amount', formatMoney(details.amount))}
          ${detail('Payment', details.paymentMethod)}
        `)}
        ${p('The buyer now has access to download their files and license agreement.')}
      `),
    });
  } catch (e) { console.error('Email error (private beat sale notification):', e); }
}

// Beat purchase confirmation (public store)
export async function sendBeatPurchaseConfirmation(to: string, details: {
  buyerName: string;
  beatTitle: string;
  producerName: string;
  licenseType: string;
  amount: number;
  purchaseId: string;
}) {
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Purchase Confirmed — ${details.beatTitle}`,
      html: wrap(
        h1('PURCHASE CONFIRMED') +
        p(`${details.buyerName}, your beat purchase is complete.`) +
        detailTable(
          detail('Beat', details.beatTitle) +
          detail('Producer', details.producerName) +
          detail('License', details.licenseType) +
          detail('Amount', formatMoney(details.amount)) +
          detail('Purchase ID', details.purchaseId)
        ) +
        p('Your files are ready for download. You can also access your purchases anytime from your dashboard.') +
        btn('VIEW MY PURCHASES', `${SITE_URL}/dashboard/purchases`) +
        p('Your signed license agreement is stored in your account and attached to this purchase. You can view and download it at any time.')
      ),
    });
  } catch (e) { console.error('Email error (beat purchase confirmation):', e); }
}

// Producer notification when someone buys their beat
export async function sendBeatSaleProducerNotification(to: string, details: {
  buyerName: string;
  buyerEmail: string;
  beatTitle: string;
  licenseType: string;
  amount: number;
  producerEarnings: number;
}) {
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Beat Sold — ${details.beatTitle}`,
      html: wrap(
        h1('BEAT SOLD') +
        p(`Someone just purchased your beat "${details.beatTitle}".`) +
        detailTable(
          detail('Beat', details.beatTitle) +
          detail('Buyer', details.buyerName) +
          detail('Email', details.buyerEmail) +
          detail('License', details.licenseType) +
          detail('Sale Amount', formatMoney(details.amount)) +
          detail('Your Earnings (60%)', formatMoney(details.producerEarnings))
        ) +
        btn('VIEW YOUR EARNINGS', `${SITE_URL}/producer`)
      ),
    });
  } catch (e) { console.error('Email error (producer sale notification):', e); }
}
