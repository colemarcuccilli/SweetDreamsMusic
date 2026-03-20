import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendSessionReminder, sendSessionReminderToStaff } from '@/lib/email';
import { ENGINEERS, SUPER_ADMINS } from '@/lib/constants';

export const maxDuration = 30;

// Vercel Cron — runs every 15 minutes
// Finds confirmed sessions starting in the next 45-75 minutes and sends reminders
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date();

  // Window: 45 to 75 minutes from now (to account for 15-min cron interval)
  const windowStart = new Date(now.getTime() + 45 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 75 * 60 * 1000);

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, customer_name, customer_email, artist_name, start_time, duration, room, engineer_name, created_by_email, status')
    .eq('status', 'confirmed')
    .eq('reminder_sent', false)
    .gte('start_time', windowStart.toISOString())
    .lte('start_time', windowEnd.toISOString());

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

      // 1. Send reminder to client (if they have an email)
      if (booking.customer_email) {
        await sendSessionReminder(booking.customer_email, {
          customerName: booking.customer_name || 'Client',
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
        customerName: booking.customer_name || 'Client',
        customerEmail: booking.customer_email || 'N/A',
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
