'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Calendar, Clock, Music, DollarSign, CheckCircle, Loader2 } from 'lucide-react';
import { ROOM_LABELS, type Room } from '@/lib/constants';
import { formatCents } from '@/lib/utils';

type BookingData = {
  id: string;
  customer_name: string;
  customer_email: string;
  start_time: string;
  duration: number;
  room: string;
  total_amount: number;
  deposit_amount: number;
  remainder_amount: number;
  status: string;
  engineer_name: string | null;
  admin_notes: string | null;
};

export default function InvitePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const bookingId = searchParams.get('booking');

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    async function loadBooking() {
      if (!bookingId || !token) {
        setError('Invalid invite link.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/booking/invite/lookup?booking=${bookingId}&token=${token}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Invalid or expired invite.');
          setLoading(false);
          return;
        }

        setBooking(data.booking);

        // If already confirmed (cash booking), show confirmation
        if (data.booking.status === 'confirmed') {
          setConfirmed(true);
        }
      } catch {
        setError('Failed to load invite.');
      } finally {
        setLoading(false);
      }
    }

    loadBooking();
  }, [bookingId, token]);

  async function handlePayDeposit() {
    if (!booking) return;
    setPaying(true);

    try {
      const res = await fetch('/api/booking/invite/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, token }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to start payment');
        setPaying(false);
      }
    } catch {
      alert('Something went wrong');
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-accent" />
          <p className="font-mono text-sm text-black/60">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-heading-sm mb-4">INVITE NOT FOUND</h1>
          <p className="font-mono text-sm text-black/60 mb-6">{error}</p>
          <a href="/book" className="font-mono text-sm text-accent hover:underline">
            Book a session instead &rarr;
          </a>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  const startDate = new Date(booking.start_time);
  const dateStr = startDate.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC',
  });
  const timeStr = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', timeZone: 'UTC',
  });
  const roomLabel = ROOM_LABELS[booking.room as Room] || booking.room;
  const isCash = booking.deposit_amount === 0;

  if (confirmed) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-lg w-full">
          <div className="border-2 border-accent p-8 text-center">
            <CheckCircle className="w-12 h-12 text-accent mx-auto mb-4" />
            <h1 className="text-heading-sm mb-2">SESSION CONFIRMED</h1>
            <p className="font-mono text-sm text-black/60 mb-6">
              {isCash
                ? 'Your session is booked. Payment will be collected at the studio.'
                : 'Your session is booked and deposit has been paid.'}
            </p>

            <div className="text-left border-t border-black/10 pt-4 space-y-3 font-mono text-sm">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-black/40 shrink-0" />
                <span>{dateStr}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-black/40 shrink-0" />
                <span>{timeStr} &mdash; {booking.duration} hour{booking.duration > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-3">
                <Music className="w-4 h-4 text-black/40 shrink-0" />
                <span>{roomLabel}</span>
              </div>
              {booking.engineer_name && (
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 text-black/40 shrink-0 text-center text-xs font-bold">E</span>
                  <span>Engineer: {booking.engineer_name}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <DollarSign className="w-4 h-4 text-black/40 shrink-0" />
                <span>Total: {formatCents(booking.total_amount)}</span>
              </div>
            </div>

            <a href="/dashboard" className="inline-block mt-6 font-mono text-sm text-accent hover:underline">
              View your dashboard &rarr;
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Pending online payment — show details + pay button
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="border-2 border-black p-8">
          <h1 className="text-heading-sm mb-2">YOU&apos;RE INVITED</h1>
          <p className="font-mono text-sm text-black/60 mb-6">
            A recording session has been set up for you at Sweet Dreams Music.
            Review the details below and pay your deposit to confirm.
          </p>

          <div className="space-y-3 font-mono text-sm mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-black/40 shrink-0" />
              <span>{dateStr}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-black/40 shrink-0" />
              <span>{timeStr} &mdash; {booking.duration} hour{booking.duration > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-3">
              <Music className="w-4 h-4 text-black/40 shrink-0" />
              <span>{roomLabel}</span>
            </div>
            {booking.engineer_name && (
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 text-black/40 shrink-0 text-center text-xs font-bold">E</span>
                <span>Engineer: {booking.engineer_name}</span>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="border-t border-b border-black/10 py-4 mb-6 font-mono text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-black/60">Session Total</span>
              <span className="font-bold">{formatCents(booking.total_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-black/60">Deposit Due Now (50%)</span>
              <span className="font-bold text-accent">{formatCents(booking.deposit_amount)}</span>
            </div>
            <div className="flex justify-between text-black/40 text-xs">
              <span>Remainder due after session</span>
              <span>{formatCents(booking.remainder_amount)}</span>
            </div>
          </div>

          <button
            onClick={handlePayDeposit}
            disabled={paying}
            className="w-full bg-accent text-black font-mono text-base font-bold uppercase tracking-wider py-4 hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {paying ? 'REDIRECTING TO PAYMENT...' : `PAY ${formatCents(booking.deposit_amount)} DEPOSIT`}
          </button>

          <p className="font-mono text-[10px] text-black/40 text-center mt-3">
            Secure payment powered by Stripe. Your card will be saved for the remainder charge.
          </p>
        </div>
      </div>
    </div>
  );
}
