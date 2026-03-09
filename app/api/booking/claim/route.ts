import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyEngineerAccess } from '@/lib/admin-auth';
import { sendEngineerAssigned } from '@/lib/email';
import { ENGINEERS } from '@/lib/constants';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const hasAccess = await verifyEngineerAccess(supabase);
  if (!hasAccess) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { bookingId } = await request.json();
  if (!bookingId) return NextResponse.json({ error: 'bookingId required' }, { status: 400 });

  // Get user's display name from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('user_id', user.id)
    .single();

  const engineerName = profile?.display_name || user.email || 'Engineer';

  // Check the booking's studio to enforce studio restrictions
  const { data: booking } = await supabase
    .from('bookings')
    .select('room')
    .eq('id', bookingId)
    .single();

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  // Verify this engineer can work in this studio
  const engineerConfig = ENGINEERS.find(
    (e) => e.name === engineerName || e.displayName === engineerName
  );
  if (engineerConfig && booking.room && !engineerConfig.studios.includes(booking.room)) {
    const studioLabel = booking.room === 'studio_a' ? 'Studio A' : 'Studio B';
    return NextResponse.json(
      { error: `You are not assigned to ${studioLabel}` },
      { status: 403 }
    );
  }

  // Claim the session — only succeeds if engineer_name is still null
  const { data: updated, error } = await supabase
    .from('bookings')
    .update({
      engineer_name: engineerName,
      claimed_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .is('engineer_name', null)
    .select()
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: 'Session already claimed by another engineer' }, { status: 409 });
  }

  // Notify the customer that an engineer has been assigned
  if (updated.customer_email) {
    const startDate = new Date(updated.start_time);
    await sendEngineerAssigned(updated.customer_email, {
      customerName: updated.customer_name,
      engineerName,
      date: startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      startTime: startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    });
  }

  return NextResponse.json({ success: true, booking: updated });
}
