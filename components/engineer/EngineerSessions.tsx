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
  requested_engineer?: string | null;
  stripe_customer_id?: string | null;
  stripe_payment_intent_id?: string | null;
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
                    {b.requested_engineer && (
                      <p className="font-mono text-[10px] text-amber-600 font-semibold mt-0.5">
                        Requested: {b.requested_engineer}
                      </p>
                    )}
                    <p className="font-mono text-xs text-black/40 mt-1">
                      {new Date(b.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {' · '}
                      {new Date(b.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      {' · '}
                      {b.duration}hr
                      {b.room && ` · ${b.room === 'studio_a' ? 'Studio A' : 'Studio B'}`}
                    </p>
                    <p className="font-mono text-xs text-black/40 mt-0.5">
                      Total: {formatCents(b.total_amount)}
                      {b.remainder_amount ? ` · Remainder: ${formatCents(b.remainder_amount)}` : ''}
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
                {b.admin_notes && (
                  <p className="font-mono text-xs text-black/50 mt-2 border-t border-black/5 pt-2">{b.admin_notes}</p>
                )}
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
              <BookingCard key={b.id} booking={b} onUpdate={loadData} completed />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BookingCard({ booking, onUpdate, completed }: { booking: Booking; onUpdate?: () => void; completed?: boolean }) {
  const [charging, setCharging] = useState(false);
  const [chargeError, setChargeError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const date = new Date(booking.start_time);
  const remainder = booking.remainder_amount || 0;
  const canCharge = booking.status === 'confirmed' && remainder > 0 && booking.engineer_name;
  const canComplete = booking.status === 'confirmed' && booking.engineer_name;
  const canCancel = ['confirmed', 'pending'].includes(booking.status);

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

  async function updateBooking(updates: Record<string, unknown>, label: string) {
    setActionLoading(label);
    try {
      const res = await fetch('/api/booking/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, ...updates }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || `Failed to ${label}`);
        return;
      }
      onUpdate?.();
    } catch {
      alert('Network error');
    } finally {
      setActionLoading(null);
    }
  }

  function handleCancel() {
    if (!confirm(`Cancel ${booking.customer_name}'s session? This cannot be undone.`)) return;
    updateBooking({ status: 'cancelled' }, 'cancel');
  }

  function handleComplete() {
    updateBooking({ status: 'completed' }, 'complete');
  }

  function handleReschedule() {
    if (!newDate || !newTime) {
      alert('Select a date and time');
      return;
    }
    const startTime = `${newDate}T${newTime}:00`;
    if (!confirm(`Reschedule to ${newDate} at ${newTime}?`)) return;
    updateBooking({ startTime }, 'reschedule');
    setShowReschedule(false);
  }

  async function handleFileUpload() {
    if (!uploadFile || !booking.customer_email) return;
    setUploading(true);

    // We need the user_id for the client. Look it up by email via a helper approach.
    // The deliverables API needs user_id, so we pass customer_email and let the API find them.
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('user_id', booking.customer_email); // Will be resolved by lookup
    formData.append('display_name', uploadName || uploadFile.name);
    formData.append('description', `From session on ${date.toLocaleDateString()}`);
    formData.append('send_email', 'true');
    formData.append('customer_name', booking.customer_name);
    formData.append('booking_room', booking.room || '');
    formData.append('booking_date', date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));

    try {
      // First get the user_id from the email
      const lookupRes = await fetch(`/api/booking/lookup-user?email=${encodeURIComponent(booking.customer_email)}`);
      const lookupData = await lookupRes.json();
      if (!lookupData.userId) {
        alert('Could not find client account. They may need to sign up first.');
        setUploading(false);
        return;
      }
      formData.set('user_id', lookupData.userId);

      const res = await fetch('/api/admin/library/deliverables', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Upload failed');
      } else {
        setUploadSuccess(true);
        setUploadFile(null);
        setUploadName('');
      }
    } catch {
      alert('Network error');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="border-2 border-black/10 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm font-bold">{booking.customer_name}</p>
          {booking.customer_email && (
            <p className="font-mono text-xs text-black/50">{booking.customer_email}</p>
          )}
          {booking.requested_engineer && (
            <p className="font-mono text-[10px] text-amber-600 font-semibold mt-0.5">
              Requested: {booking.requested_engineer}
            </p>
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

      {/* Action buttons */}
      {!completed && (
        <div className="mt-3 pt-3 border-t border-black/10 flex flex-wrap gap-2">
          {canCharge && (
            <button
              onClick={chargeRemainder}
              disabled={charging}
              className="font-mono text-xs font-bold uppercase tracking-wider bg-black text-white px-4 py-2 hover:bg-black/80 disabled:opacity-50 transition-colors"
            >
              {charging ? 'Charging...' : `Charge Remainder — ${formatCents(remainder)}`}
            </button>
          )}
          {canComplete && (
            <button
              onClick={handleComplete}
              disabled={actionLoading === 'complete'}
              className="font-mono text-xs font-bold uppercase tracking-wider border-2 border-green-600 text-green-700 px-4 py-2 hover:bg-green-50 disabled:opacity-50 transition-colors"
            >
              {actionLoading === 'complete' ? 'Updating...' : 'Mark Complete'}
            </button>
          )}
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={actionLoading === 'cancel'}
              className="font-mono text-xs font-bold uppercase tracking-wider border-2 border-red-500 text-red-600 px-4 py-2 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              {actionLoading === 'cancel' ? 'Cancelling...' : 'Cancel Session'}
            </button>
          )}
          <button
            onClick={() => setShowReschedule(!showReschedule)}
            className="font-mono text-xs font-bold uppercase tracking-wider border-2 border-black/20 text-black/60 px-4 py-2 hover:bg-black/5 transition-colors"
          >
            Reschedule
          </button>
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="font-mono text-xs uppercase tracking-wider text-black/30 px-3 py-2 hover:text-black/60 transition-colors"
          >
            {showDebug ? 'Hide Details' : 'Debug'}
          </button>
        </div>
      )}

      {/* Reschedule form */}
      {showReschedule && (
        <div className="mt-3 p-3 bg-black/5 border border-black/10 space-y-2">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider">Reschedule Session</p>
          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="font-mono text-[10px] text-black/40 block">Date</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="font-mono text-xs border border-black/20 px-2 py-1.5"
              />
            </div>
            <div>
              <label className="font-mono text-[10px] text-black/40 block">Time</label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="font-mono text-xs border border-black/20 px-2 py-1.5"
              />
            </div>
            <button
              onClick={handleReschedule}
              disabled={actionLoading === 'reschedule'}
              className="font-mono text-xs font-bold uppercase tracking-wider bg-[#F4C430] text-black px-4 py-2 hover:bg-[#F4C430]/80 disabled:opacity-50 transition-colors"
            >
              {actionLoading === 'reschedule' ? 'Saving...' : 'Confirm'}
            </button>
          </div>
        </div>
      )}

      {/* Send Files (for completed sessions) */}
      {completed && (
        <div className="mt-3 pt-3 border-t border-black/10">
          {uploadSuccess ? (
            <div className="bg-green-50 border border-green-200 p-4 text-center">
              <p className="font-mono text-xs text-green-700 font-bold">Files sent! Client has been emailed with a download link and review request.</p>
              <button
                onClick={() => { setUploadSuccess(false); setShowFileUpload(true); }}
                className="font-mono text-[10px] text-green-600 hover:underline mt-2"
              >
                Upload another file
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowFileUpload(!showFileUpload)}
                  className="font-mono text-xs font-bold uppercase tracking-wider bg-black text-white px-4 py-2 hover:bg-black/80 transition-colors"
                >
                  {showFileUpload ? 'Cancel' : 'Send Files to Client'}
                </button>
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="font-mono text-xs uppercase tracking-wider text-black/30 px-3 py-2 hover:text-black/60 transition-colors"
                >
                  {showDebug ? 'Hide Details' : 'Debug'}
                </button>
              </div>
              {showFileUpload && (
                <div className="mt-3 p-4 bg-black/5 border border-black/10 space-y-3">
                  <p className="font-mono text-xs font-semibold uppercase tracking-wider">Upload Session Files</p>
                  <p className="font-mono text-[10px] text-black/50">
                    Upload the final files for {booking.customer_name}. They will receive an email with a download link and a Google review request.
                  </p>
                  <input
                    type="file"
                    accept="audio/*,.wav,.mp3,.flac,.aiff,.m4a,.zip"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full font-mono text-xs"
                  />
                  <input
                    type="text"
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    placeholder="Display name (e.g. 'Final Mix - Track Name')"
                    className="w-full border border-black/20 px-3 py-2 font-mono text-xs focus:border-accent focus:outline-none"
                  />
                  <button
                    onClick={handleFileUpload}
                    disabled={!uploadFile || uploading || !booking.customer_email}
                    className="bg-[#F4C430] text-black font-mono text-xs font-bold uppercase tracking-wider px-5 py-2.5 hover:bg-[#F4C430]/80 disabled:opacity-50 transition-colors"
                  >
                    {uploading ? 'Uploading & Sending Email...' : 'Upload & Send to Client'}
                  </button>
                  {!booking.customer_email && (
                    <p className="font-mono text-[10px] text-red-500">No email on file for this client</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Debug info */}
      {showDebug && (
        <div className="mt-3 p-3 bg-black/5 border border-black/10 font-mono text-[10px] text-black/50 space-y-1">
          <p>ID: {booking.id}</p>
          <p>Status: {booking.status}</p>
          <p>Created: {new Date(booking.created_at).toLocaleString()}</p>
          <p>Start: {booking.start_time}</p>
          <p>End: {booking.end_time}</p>
          <p>Room: {booking.room || 'none'}</p>
          <p>Engineer: {booking.engineer_name || 'unassigned'}</p>
          <p>Requested: {booking.requested_engineer || 'any'}</p>
          <p>Total: {formatCents(booking.total_amount)} · Deposit: {formatCents(booking.deposit_amount)} · Remainder: {formatCents(remainder)}</p>
          <p>Deposit Paid: {booking.actual_deposit_paid != null ? formatCents(booking.actual_deposit_paid) : 'N/A'}</p>
          <p>Stripe Customer: {booking.stripe_customer_id || 'none'}</p>
          <p>Stripe PI: {booking.stripe_payment_intent_id || 'none'}</p>
        </div>
      )}

      {chargeError && (
        <p className="font-mono text-xs text-red-600 mt-2">{chargeError}</p>
      )}
    </div>
  );
}
