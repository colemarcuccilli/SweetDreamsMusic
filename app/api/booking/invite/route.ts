import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SITE_URL, ENGINEERS } from '@/lib/constants';
import { getUserRole, parseTimeSlot } from '@/lib/utils';
import { sendBookingConfirmation } from '@/lib/email';

// Engineer creates a session and generates an invite link
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const role = getUserRole(user.email);
    if (role !== 'engineer' && role !== 'admin') {
      return NextResponse.json({ error: 'Engineers and admins only' }, { status: 403 });
    }

    const body = await request.json();
    const {
      date, startTime, duration, room,
      totalAmount, depositAmount,
      clientEmail, clientName, notes,
      paymentMethod, customPrice,
    } = body;

    if (!date || !startTime || !duration || !room || !totalAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Auto-assign engineer from the creating user
    const engineerConfig = ENGINEERS.find(e => e.email.toLowerCase() === user.email!.toLowerCase());
    const engineerName = engineerConfig?.name || null;

    const startDec = parseTimeSlot(startTime);
    const endDec = (startDec + duration) % 24;
    const endTime = `${Math.floor(endDec)}:${endDec % 1 >= 0.5 ? '30' : '00'}`;

    const inviteToken = crypto.randomUUID();

    if (paymentMethod === 'cash') {
      // Cash booking — create confirmed immediately, no Stripe needed
      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
          customer_name: clientName || 'Cash Client',
          customer_email: clientEmail || '',
          start_time: `${date}T${startTime}:00+00:00`,
          end_time: `${date}T${endTime}:00+00:00`,
          duration,
          room,
          engineer_name: engineerName,
          total_amount: totalAmount,
          deposit_amount: 0,
          remainder_amount: totalAmount,
          actual_deposit_paid: 0,
          status: 'confirmed',
          admin_notes: `Cash session created by ${user.email}. ${customPrice ? `Custom price: $${(customPrice / 100).toFixed(2)}. ` : ''}${notes || ''}`,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to create cash booking:', error);
        return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
      }

      // Send confirmation email if client email provided
      if (clientEmail) {
        const startDate = new Date(`${date}T${startTime}:00+00:00`);
        const dateStr = startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
        const timeStr = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });

        await sendBookingConfirmation(clientEmail, {
          customerName: clientName || 'Client',
          date: dateStr,
          startTime: timeStr,
          duration,
          room,
          total: totalAmount,
          deposit: 0,
        });
      }

      // No engineer claim emails — the creating engineer is already assigned

      // Return a shareable link even for cash bookings
      const inviteUrl = `${SITE_URL}/book/invite/${inviteToken}?booking=${booking.id}`;

      // Store token in admin_notes for lookup
      await supabase.from('bookings').update({
        admin_notes: `Cash session created by ${user.email}. Token: ${inviteToken}. ${customPrice ? `Custom price: $${(customPrice / 100).toFixed(2)}. ` : ''}${notes || ''}`,
      }).eq('id', booking.id);

      return NextResponse.json({ inviteUrl, bookingId: booking.id });
    }

    // Online payment — create pending booking, client pays deposit via invite link
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        customer_name: clientName || (clientEmail ? `Invited: ${clientEmail}` : 'Pending Invite'),
        customer_email: clientEmail || '',
        start_time: `${date}T${startTime}:00+00:00`,
        end_time: `${date}T${endTime}:00+00:00`,
        duration,
        room,
        engineer_name: engineerName,
        total_amount: totalAmount,
        deposit_amount: depositAmount,
        remainder_amount: totalAmount - depositAmount,
        status: 'pending',
        admin_notes: `Invite created by ${user.email}. Token: ${inviteToken}. ${customPrice ? `Custom price: $${(customPrice / 100).toFixed(2)}. ` : ''}${notes || ''}`,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create invite booking:', error);
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
    }

    const inviteUrl = `${SITE_URL}/book/invite/${inviteToken}?booking=${booking.id}`;

    return NextResponse.json({ inviteUrl, bookingId: booking.id });
  } catch (error) {
    console.error('Invite creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
