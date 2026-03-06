'use client';

import { useState, useEffect } from 'react';
import { formatCents } from '@/lib/utils';

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string;
  start_time: string;
  end_time: string;
  duration: number;
  total_amount: number;
  deposit_amount: number;
  remainder_amount: number;
  actual_deposit_paid: number | null;
  status: string;
  created_at: string;
  admin_notes: string | null;
}

export default function EngineerSessions({ userEmail }: { userEmail: string }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Filter by engineer assignment when that field exists
    // For now engineers see all bookings — admins filter in admin panel
    fetch('/api/admin/bookings?limit=30')
      .then((r) => r.json())
      .then((d) => setBookings(d.bookings || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userEmail]);

  if (loading) return <p className="font-mono text-sm text-black/40">Loading sessions...</p>;

  const active = bookings.filter((b) => ['confirmed', 'pending', 'pending_approval'].includes(b.status));
  const completed = bookings.filter((b) => b.status === 'completed');

  return (
    <div className="space-y-8">
      {/* Active Sessions */}
      <div>
        <h3 className="font-mono text-sm font-semibold uppercase tracking-wider mb-4">
          Active Sessions ({active.length})
        </h3>
        {active.length === 0 ? (
          <p className="font-mono text-xs text-black/30 border border-black/10 p-6 text-center">No active sessions</p>
        ) : (
          <div className="space-y-3">
            {active.map((b) => (
              <BookingCard key={b.id} booking={b} />
            ))}
          </div>
        )}
      </div>

      {/* Completed */}
      <div>
        <h3 className="font-mono text-sm font-semibold uppercase tracking-wider mb-4">
          Completed ({completed.length})
        </h3>
        {completed.length === 0 ? (
          <p className="font-mono text-xs text-black/30 border border-black/10 p-6 text-center">No completed sessions</p>
        ) : (
          <div className="space-y-3">
            {completed.map((b) => (
              <BookingCard key={b.id} booking={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const date = new Date(booking.start_time);

  return (
    <div className="border-2 border-black/10 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="font-mono text-sm font-bold">{booking.customer_name}</p>
          <p className="font-mono text-xs text-black/50">{booking.customer_email}</p>
          <p className="font-mono text-xs text-black/40 mt-1">
            {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            {' · '}
            {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            {' · '}
            {booking.duration}hr
          </p>
        </div>
        <div className="text-right">
          <span className={`font-mono text-xs font-bold uppercase tracking-wider px-2 py-1 inline-block ${
            booking.status === 'completed' ? 'bg-green-100 text-green-700' :
            booking.status === 'confirmed' ? 'bg-accent/20 text-amber-700' :
            booking.status === 'cancelled' ? 'bg-red-100 text-red-600' :
            'bg-black/5 text-black/50'
          }`}>
            {booking.status}
          </span>
          <p className="font-mono text-sm font-semibold mt-1">
            {formatCents(booking.total_amount)}
          </p>
          {booking.actual_deposit_paid != null && booking.actual_deposit_paid > 0 && (
            <p className="font-mono text-[10px] text-black/40">
              Deposit paid: {formatCents(booking.actual_deposit_paid)}
            </p>
          )}
        </div>
      </div>
      {booking.admin_notes && (
        <p className="font-mono text-xs text-black/50 mt-2 border-t border-black/5 pt-2">{booking.admin_notes}</p>
      )}
    </div>
  );
}
