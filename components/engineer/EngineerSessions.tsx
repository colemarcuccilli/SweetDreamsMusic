'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatCents } from '@/lib/utils';

interface Booking {
  id: string;
  customer_name: string;
  customer_email?: string;
  start_time: string;
  end_time: string;
  duration: number;
  room?: string;
  total_amount: number;
  deposit_amount: number;
  remainder_amount?: number;
  actual_deposit_paid: number | null;
  status: string;
  created_at: string;
  admin_notes: string | null;
  engineer_name?: string | null;
}

export default function EngineerSessions({ userEmail }: { userEmail: string }) {
  const [mySessions, setMySessions] = useState<Booking[]>([]);
  const [unclaimed, setUnclaimed] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [myRes, unclaimedRes] = await Promise.all([
        fetch('/api/engineer/accounting'),
        fetch('/api/booking/unclaimed'),
      ]);
      const myData = await myRes.json();
      const unclaimedData = await unclaimedRes.json();
      setMySessions(myData.bookings || []);
      setUnclaimed(unclaimedData.bookings || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function claimSession(bookingId: string) {
    setClaiming(bookingId);
    try {
      const res = await fetch('/api/booking/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to claim session');
        return;
      }
      await loadData();
    } catch {
      alert('Network error');
    } finally {
      setClaiming(null);
    }
  }

  if (loading) return <p className="font-mono text-sm text-black/40">Loading sessions...</p>;

  const myActive = mySessions.filter((b) =>
    ['confirmed', 'pending'].includes(b.status) && b.engineer_name
  );
  const myCompleted = mySessions.filter((b) => b.status === 'completed');

  return (
    <div className="space-y-10">
      {/* Available Sessions (Unclaimed) */}
      <div>
        <h3 className="font-mono text-sm font-semibold uppercase tracking-wider mb-4">
          Available Sessions ({unclaimed.length})
        </h3>
        {unclaimed.length === 0 ? (
          <p className="font-mono text-xs text-black/30 border border-black/10 p-6 text-center">
            No available sessions right now
          </p>
        ) : (
          <div className="space-y-3">
            {unclaimed.map((b) => (
              <div key={b.id} className="border-2 border-[#F4C430]/40 bg-[#F4C430]/5 p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-bold">{b.customer_name}</p>
                    <p className="font-mono text-xs text-black/40 mt-1">
                      {new Date(b.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {' · '}
                      {new Date(b.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      {' · '}
                      {b.duration}hr
                      {b.room && ` · ${b.room === 'studio_a' ? 'Studio A' : 'Studio B'}`}
                    </p>
                  </div>
                  <button
                    onClick={() => claimSession(b.id)}
                    disabled={claiming === b.id}
                    className="font-mono text-xs font-bold uppercase tracking-wider bg-[#F4C430] text-black px-5 py-2.5 hover:bg-[#F4C430]/80 disabled:opacity-50 transition-colors"
                  >
                    {claiming === b.id ? 'Claiming...' : 'Claim Session'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Active Sessions */}
      <div>
        <h3 className="font-mono text-sm font-semibold uppercase tracking-wider mb-4">
          My Sessions ({myActive.length})
        </h3>
        {myActive.length === 0 ? (
          <p className="font-mono text-xs text-black/30 border border-black/10 p-6 text-center">No active sessions</p>
        ) : (
          <div className="space-y-3">
            {myActive.map((b) => (
              <BookingCard key={b.id} booking={b} onUpdate={loadData} />
            ))}
          </div>
        )}
      </div>

      {/* Completed */}
      <div>
        <h3 className="font-mono text-sm font-semibold uppercase tracking-wider mb-4">
          Completed ({myCompleted.length})
        </h3>
        {myCompleted.length === 0 ? (
          <p className="font-mono text-xs text-black/30 border border-black/10 p-6 text-center">No completed sessions</p>
        ) : (
          <div className="space-y-3">
            {myCompleted.map((b) => (
              <BookingCard key={b.id} booking={b} onUpdate={loadData} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BookingCard({ booking, onUpdate }: { booking: Booking; onUpdate?: () => void }) {
  const [charging, setCharging] = useState(false);
  const [chargeError, setChargeError] = useState('');
  const [completing, setCompleting] = useState(false);
  const date = new Date(booking.start_time);
  const remainder = booking.remainder_amount || 0;
  const canCharge = booking.status === 'confirmed' && remainder > 0 && booking.engineer_name;

  async function chargeRemainder() {
    if (!confirm(`Charge ${formatCents(remainder)} to ${booking.customer_name}'s card on file?`)) return;
    setCharging(true);
    setChargeError('');
    try {
      const res = await fetch('/api/booking/charge-remainder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setChargeError(data.error || 'Failed to charge');
        return;
      }
      alert(`Charged ${formatCents(data.amountCharged)} successfully`);
      onUpdate?.();
    } catch {
      setChargeError('Network error');
    } finally {
      setCharging(false);
    }
  }

  async function markComplete() {
    setCompleting(true);
    try {
      await fetch('/api/admin/bookings/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: booking.id, status: 'completed' }),
      });
      onUpdate?.();
    } catch {
      // silent
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div className="border-2 border-black/10 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="font-mono text-sm font-bold">{booking.customer_name}</p>
          {booking.customer_email && (
            <p className="font-mono text-xs text-black/50">{booking.customer_email}</p>
          )}
          <p className="font-mono text-xs text-black/40 mt-1">
            {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            {' · '}
            {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            {' · '}
            {booking.duration}hr
            {booking.room && ` · ${booking.room === 'studio_a' ? 'Studio A' : 'Studio B'}`}
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
              Deposit: {formatCents(booking.actual_deposit_paid)}
              {remainder > 0 && ` · Remainder: ${formatCents(remainder)}`}
            </p>
          )}
        </div>
      </div>

      {booking.admin_notes && (
        <p className="font-mono text-xs text-black/50 mt-2 border-t border-black/5 pt-2">{booking.admin_notes}</p>
      )}

      {/* Engineer actions */}
      {canCharge && (
        <div className="mt-3 pt-3 border-t border-black/10 flex flex-wrap gap-2">
          <button
            onClick={chargeRemainder}
            disabled={charging}
            className="font-mono text-xs font-bold uppercase tracking-wider bg-black text-white px-4 py-2 hover:bg-black/80 disabled:opacity-50 transition-colors"
          >
            {charging ? 'Charging...' : `Charge Remainder — ${formatCents(remainder)}`}
          </button>
          <button
            onClick={markComplete}
            disabled={completing}
            className="font-mono text-xs font-bold uppercase tracking-wider border-2 border-green-600 text-green-700 px-4 py-2 hover:bg-green-50 disabled:opacity-50 transition-colors"
          >
            {completing ? 'Updating...' : 'Mark Complete'}
          </button>
        </div>
      )}
      {chargeError && (
        <p className="font-mono text-xs text-red-600 mt-2">{chargeError}</p>
      )}
    </div>
  );
}
