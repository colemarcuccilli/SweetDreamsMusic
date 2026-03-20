import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendSessionReminder, sendSessionReminderToStaff } from '@/lib/email';
import { ENGINEERS, SUPER_ADMINS, TIMEZONE } from '@/lib/constants';

export const maxDuration = 30;

// Vercel Cron — runs every 15 minutes
// Finds confirmed sessions starting in the next 45-75 minutes and sends reminders
//
// IMPORTANT: Session times are stored as LOCAL Fort Wayne time in UTC columns.
// e.g., a 10:30 PM session is stored as T22:30:00 regardless of timezone.
// We must compare against Fort Wayne local time, NOT UTC.
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Get current Fort Wayne time as a comparable value
  // Since DB stores local FW time in UTC columns, we need to compare
  // using FW local time, not UTC
  const nowFW = new Date(new Date().toLocaleString('en-US', { timeZone: TIMEZONE }));

  // Window: 45 to 75 minutes from now in Fort Wayne time
  const windowStart = new Date(nowFW.getTime() + 45 * 60 * 1000);
  const windowEnd = new Date(nowFW.getTime() + 75 * 60 * 1000);

  // Format as ISO strings for DB comparison (these will match the stored local times)
  const windowStartISO = windowStart.toISOString();
  const windowEndISO = windowEnd.toISOString();

  console.log(`[CRON] Session reminder check — FW time: ${nowFW.toISOString()}, window: ${windowStartISO} to ${windowEndISO}`);

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, customer_name, customer_email, artist_name, start_time, duration, room, engineer_name, created_by_email, status')
    .eq('status', 'confirmed')
    .eq('reminder_sent', false)
    .gte('start_time', windowStartISO)
    .lte('start_time', windowEndISO);

  if (error) {
    console.error('[CRON] Failed to fetch bookings:', error);
    return NextResponse.json({ error: 'DB query failed' }, { status: 500 });
  }

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ message: 'No reminders to send', count: 0 });
  }

  let sent = 0;

  for (const booking of bookings) {
    try {
      const startDate = new Date(booking.start_time);
      const dateStr = startDate.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC',
      });
      const timeStr = startDate.toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', timeZone: 'UTC',
      });

      // Resolve actual client name — invites may store 'Pending Invite' as fallback
      const displayName = (booking.customer_name && !booking.customer_name.includes('Pending') && !booking.customer_name.includes('Invited:'))
        ? booking.customer_name
        : booking.artist_name || booking.customer_email || 'Client';

      // 1. Send reminder to client (if they have an email and it's not empty)
      if (booking.customer_email && booking.customer_email.trim()) {
        await sendSessionReminder(booking.customer_email, {
          customerName: displayName,
          artistName: booking.artist_name || null,
          date: dateStr,
          startTime: timeStr,
          room: booking.room || '',
          engineerName: booking.engineer_name || null,
        });
      }

      // 2. Send to admins and assigned/creating engineer
      const staffEmails = new Set<string>([...SUPER_ADMINS]);

      // Add the assigned engineer's email
      if (booking.engineer_name) {
        const eng = ENGINEERS.find(
          (e) => e.name === booking.engineer_name || e.displayName === booking.engineer_name
        );
        if (eng) staffEmails.add(eng.email);
      }

      // Add the engineer who created the invite
      if (booking.created_by_email) {
        staffEmails.add(booking.created_by_email);
      }

      await sendSessionReminderToStaff([...staffEmails], {
        customerName: displayName,
        customerEmail: booking.customer_email?.trim() || 'Not provided',
        artistName: booking.artist_name || null,
        date: dateStr,
        startTime: timeStr,
        duration: booking.duration,
        room: booking.room || '',
        engineerName: booking.engineer_name || 'Unassigned',
      });

      // 3. Mark reminder as sent
      await supabase
        .from('bookings')
        .update({ reminder_sent: true })
        .eq('id', booking.id);

      sent++;
      console.log(`[CRON] Reminder sent for booking ${booking.id} — ${booking.customer_name}`);
    } catch (err) {
      console.error(`[CRON] Failed to send reminder for booking ${booking.id}:`, err);
    }
  }

  return NextResponse.json({ message: `Sent ${sent} reminders`, count: sent });
}
