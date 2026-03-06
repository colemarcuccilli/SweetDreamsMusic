import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SITE_URL } from '@/lib/constants';
import { getUserRole } from '@/lib/utils';

// Engineer creates a session and generates an invite link
// The invited user clicks the link, signs in / creates account, and pays deposit
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
    const { date, startTime, duration, room, totalAmount, clientEmail, notes } = body;

    if (!date || !startTime || !duration || !room || !totalAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const endHour = (parseInt(startTime.split(':')[0]) + duration) % 24;

    // Create a pending booking with an invite token
    const inviteToken = crypto.randomUUID();

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        first_name: '',
        last_name: '',
        artist_name: '',
        customer_name: clientEmail ? `Invited: ${clientEmail}` : 'Pending Invite',
        customer_email: clientEmail || '',
        start_time: `${date}T${startTime}:00+00:00`,
        end_time: `${date}T${endHour}:00:00+00:00`,
        duration,
        deposit_amount: Math.round(totalAmount / 2),
        total_amount: totalAmount,
        remainder_amount: Math.round(totalAmount / 2),
        status: 'pending',
        admin_notes: `Invite created by ${user.email}. Token: ${inviteToken}. ${notes || ''}`,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create invite booking:', error);
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
    }

    const inviteUrl = `${SITE_URL}/book/invite/${inviteToken}?booking=${booking.id}`;

    return NextResponse.json({
      inviteUrl,
      bookingId: booking.id,
    });
  } catch (error) {
    console.error('Invite creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
