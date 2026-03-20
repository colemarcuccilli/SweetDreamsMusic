'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatCents } from '@/lib/utils';
import { ENGINEERS } from '@/lib/constants';

interface Booking {
  id: string;
  customer_name: string;
  customer_email?: string;
  artist_name?: string | null;
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
  priority_expires_at?: string | null;
  reschedule_requested?: boolean;
  stripe_customer_id?: string | null;
  stripe_payment_intent_id?: string | null;
}

interface StudioBooking {
  id: string;
  customer_name: string;
  artist_name: string | null;
  start_time: string;
  end_time: string;
  duration: number;
  room: string | null;
  engineer_name: string | null;
  status: string;
}

export default function EngineerSessions({ userEmail }: { userEmail: string }) {
  const [mySessions, setMySessions] = useState<Booking[]>([]);
  const [unclaimed, setUnclaimed] = useState<Booking[]>([]);
  const [allBookings, setAllBookings] = useState<StudioBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [showAllBookings, setShowAllBookings] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [myRes, unclaimedRes, allRes] = await Promise.all([
        fetch('/api/engineer/accounting'),
        fetch('/api/booking/unclaimed'),
        fetch('/api/booking/all'),
      ]);
      const myData = await myRes.json();
      const unclaimedData = await unclaimedRes.json();
      const allData = await allRes.json();
      setMySessions(myData.bookings || []);
      setUnclaimed(unclaimedData.bookings || []);
      setAllBookings(allData.bookings || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function respondToSession(bookingId: string, action: 'accept' | 'pass') {
    setClaiming(bookingId);
    try {
      const res = await fetch('/api/booking/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || `Failed to ${action} session`);
        return;
      }
      if (action === 'pass') {
        alert('Session passed. Other engineers have been notified.');
      }
      await loadData();
    } catch {
      alert('Network error');
    } finally {
      setClaiming(null);
    }
  }

  // Legacy wrapper
  async function claimSession(bookingId: string) {
    return respondToSession(bookingId, 'accept');
  }

  if (loading) return <p className="font-mono text-sm text-black/40">Loading sessions...</p>;

  const pendingInvites = mySessions.filter((b) =>
    b.status === 'pending_deposit' && b.engineer_name
  );
  const myActive = mySessions.filter((b) =>
    ['confirmed', 'pending', 'approved'].includes(b.status) && b.engineer_name
  );
  const myCompleted = mySessions.filter((b) => b.status === 'completed');

  return (
    <div className="space-y-10">
      {/* All Studio Bookings — for availability reference */}
      <div>
        <button
          onClick={() => setShowAllBookings(!showAllBookings)}
          className="font-mono text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2 hover:text-accent transition-colors"
        >
          Studio Schedule ({allBookings.length} upcoming)
          <span className="text-xs font-normal text-black/40">{showAllBookings ? '▲ Hide' : '▼ Show'}</span>
        </button>
        {showAllBookings && (
          allBookings.length === 0 ? (
            <p className="font-mono text-xs text-black/30 border border-black/10 p-6 text-center">
              No upcoming bookings
            </p>
          ) : (
            <div className="border-2 border-black/10 overflow-hidden">
              <table className="w-full font-mono text-xs">
                <thead>
                  <tr className="bg-black/5 text-left">
                    <th className="px-3 py-2 font-semibold uppercase tracking-wider">Date</th>
                    <th className="px-3 py-2 font-semibold uppercase tracking-wider">Time</th>
                    <th className="px-3 py-2 font-semibold uppercase tracking-wider">Client</th>
                    <th className="px-3 py-2 font-semibold uppercase tracking-wider hidden sm:table-cell">Studio</th>
                    <th className="px-3 py-2 font-semibold uppercase tracking-wider hidden sm:table-cell">Engineer</th>
                    <th className="px-3 py-2 font-semibold uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allBookings.map((b) => {
                    const d = new Date(b.start_time);
                    return (
                      <tr key={b.id} className="border-t border-black/5 hover:bg-accent/5 transition-colors">
                        <td className="px-3 py-2">
                          {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}
                        </td>
                        <td className="px-3 py-2">
                          {d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })}
                          {' · '}{b.duration}hr
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-semibold">{b.customer_name}</span>
                          {b.artist_name && <span className="text-black/40 ml-1">({b.artist_name})</span>}
                        </td>
                        <td className="px-3 py-2 hidden sm:table-cell">
                          {b.room === 'studio_a' ? 'Studio A' : b.room === 'studio_b' ? 'Studio B' : b.room || '—'}
                        </td>
                        <td className="px-3 py-2 hidden sm:table-cell">{b.engineer_name || '—'}</td>
                        <td className="px-3 py-2">
                          <span className={`font-bold uppercase text-[10px] px-1.5 py-0.5 ${
                            b.status === 'confirmed' ? 'bg-accent/20 text-amber-700' :
                            b.status === 'pending_deposit' ? 'bg-blue-100 text-blue-700' :
                            'bg-black/5 text-black/50'
                          }`}>
                            {b.status === 'pending_deposit' ? 'Pending' : b.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div>
          <h3 className="font-mono text-sm font-semibold uppercase tracking-wider mb-4">
            Pending Invites ({pendingInvites.length})
          </h3>
          <div className="space-y-3">
            {pendingInvites.map((b) => (
              <PendingInviteCard key={b.id} booking={b} onUpdate={loadData} />
            ))}
          </div>
        </div>
      )}

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
              <BookingCard
                key={b.id}
                booking={b}
                onUpdate={loadData}
                unclaimed
                onClaim={() => claimSession(b.id)}
                onPass={b.requested_engineer ? () => respondToSession(b.id, 'pass') : undefined}
                claimLoading={claiming === b.id}
                userEmail={userEmail}
              />
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

function PendingInviteCard({ booking, onUpdate }: { booking: Booking; onUpdate: () => void }) {
  const [resending, setResending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const date = new Date(booking.start_time);

  // Extract invite URL from admin_notes if stored there
  const tokenMatch = booking.admin_notes?.match(/Token: ([a-f0-9-]+)/);
  const inviteToken = tokenMatch?.[1];
  const inviteUrl = inviteToken
    ? `https://sweetdreamsmusic.com/book/invite/${inviteToken}?booking=${booking.id}`
    : null;

  async function resendInvite() {
    if (!booking.customer_email) {
      alert('No email on file for this client');
      return;
    }
    setResending(true);
    try {
      const res = await fetch('/api/booking/resend-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Invite resent to ${booking.customer_email}`);
      } else {
        alert(data.error || 'Failed to resend');
      }
    } catch {
      alert('Network error');
    } finally {
      setResending(false);
    }
  }

  function copyLink() {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function cancelInvite() {
    if (!confirm(`Cancel invite for ${booking.customer_name}?`)) return;
    setCancelling(true);
    try {
      const res = await fetch('/api/booking/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, status: 'cancelled' }),
      });
      if (res.ok) onUpdate();
      else alert('Failed to cancel');
    } catch {
      alert('Network error');
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="border-2 border-amber-300/50 bg-amber-50/30 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-mono text-sm font-bold">{booking.customer_name}</p>
            {booking.artist_name && (
              <span className="font-mono text-xs text-black/40">({booking.artist_name})</span>
            )}
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5">
              Awaiting Payment
            </span>
          </div>
          {booking.customer_email && (
            <p className="font-mono text-xs text-black/50">{booking.customer_email}</p>
          )}
          <p className="font-mono text-xs text-black/40 mt-1">
            {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}
            {' · '}
            {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })}
            {' · '}
            {booking.duration}hr
            {booking.room && ` · ${booking.room === 'studio_a' ? 'Studio A' : 'Studio B'}`}
          </p>
          <p className="font-mono text-[10px] text-black/30 mt-1">
            Created {new Date(booking.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {' · '}Deposit: {formatCents(booking.deposit_amount)} of {formatCents(booking.total_amount)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm font-semibold">{formatCents(booking.total_amount)}</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-amber-200/50 flex flex-wrap gap-2">
        {booking.customer_email && (
          <button
            onClick={resendInvite}
            disabled={resending}
            className="font-mono text-xs font-bold uppercase tracking-wider bg-accent text-black px-4 py-2 hover:bg-accent/90 disabled:opacity-50 transition-colors"
          >
            {resending ? 'Sending...' : 'Resend Invite'}
          </button>
        )}
        {inviteUrl && (
          <button
            onClick={copyLink}
            className="font-mono text-xs font-bold uppercase tracking-wider border-2 border-black/20 text-black/60 px-4 py-2 hover:bg-black/5 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        )}
        <button
          onClick={cancelInvite}
          disabled={cancelling}
          className="font-mono text-xs font-bold uppercase tracking-wider border-2 border-red-300 text-red-500 px-4 py-2 hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          {cancelling ? 'Cancelling...' : 'Cancel'}
        </button>
      </div>
    </div>
  );
}

function BookingCard({ booking, onUpdate, completed, unclaimed, onClaim, onPass, claimLoading, userEmail }: {
  booking: Booking; onUpdate?: () => void; completed?: boolean;
  unclaimed?: boolean; onClaim?: () => void; onPass?: () => void;
  claimLoading?: boolean; userEmail?: string;
}) {
  const [charging, setCharging] = useState(false);
  const [chargeError, setChargeError] = useState('');
  const [showChargeEdit, setShowChargeEdit] = useState(false);
  const [chargeAmountInput, setChargeAmountInput] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newDuration, setNewDuration] = useState(booking.duration || 2);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showCashPayment, setShowCashPayment] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [cashNote, setCashNote] = useState('');
  const [notifying, setNotifying] = useState(false);
  const [showChangeEngineer, setShowChangeEngineer] = useState(false);
  const [selectedEngineer, setSelectedEngineer] = useState(booking.engineer_name || '');

  const date = new Date(booking.start_time);
  const remainder = booking.remainder_amount || 0;
  const canCharge = booking.status === 'confirmed' && remainder > 0 && booking.engineer_name;
  const canComplete = booking.status === 'confirmed' && booking.engineer_name;
  const canCancel = ['confirmed', 'pending'].includes(booking.status);

  async function chargeRemainder(customAmount?: number) {
    const amountToCharge = customAmount || remainder;
    if (!confirm(`Charge $${(amountToCharge / 100).toFixed(2)} to ${booking.customer_name}'s card on file?`)) return;
    setCharging(true);
    setChargeError('');
    try {
      const res = await fetch('/api/booking/charge-remainder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, amount: customAmount || undefined }),
      });
      const data = await res.json();
      if (!res.ok && !data.fallback) {
        setChargeError(data.error || 'Failed to charge');
        return;
      }
      if (data.fallback && data.paymentUrl) {
        alert(
          data.emailSent
            ? 'Could not charge saved card (bank requires authentication). A payment link has been automatically emailed to the client.'
            : 'Could not charge saved card. Payment link copied to clipboard — send it to the client.'
        );
        navigator.clipboard.writeText(data.paymentUrl);
        return;
      }
      alert(`Charged ${formatCents(data.amountCharged)} successfully`);
      setShowChargeEdit(false);
      setChargeAmountInput('');
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
    if (!confirm(`Reschedule to ${newDate} at ${newTime}, ${newDuration}hr?`)) return;
    updateBooking({ startTime, duration: newDuration }, 'reschedule');
    setShowReschedule(false);
  }

  async function handleFileUpload() {
    if (uploadFiles.length === 0 || !booking.customer_email) return;
    setUploading(true);

    try {
      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i];
        setUploadProgress(`Uploading ${i + 1} of ${uploadFiles.length}: ${file.name}`);

        // Step 1: Get signed upload URL
        const urlRes = await fetch('/api/admin/library/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, customerEmail: booking.customer_email }),
        });
        const urlData = await urlRes.json();
        if (!urlRes.ok) { alert(`Failed: ${urlData.error}`); continue; }

        // Step 2: Upload directly to Supabase Storage
        const uploadRes = await fetch(urlData.signedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
          body: file,
        });
        if (!uploadRes.ok) { alert(`Upload failed for ${file.name}`); continue; }

        // Step 3: Create record + send email on last file only
        const isLast = i === uploadFiles.length - 1;
        const formData = new FormData();
        formData.append('user_id', urlData.userId);
        formData.append('file_name', file.name);
        formData.append('file_path', urlData.filePath);
        formData.append('file_size', String(file.size));
        formData.append('file_type', file.type);
        formData.append('display_name', file.name);
        formData.append('description', `From session on ${date.toLocaleDateString('en-US', { timeZone: 'UTC' })}`);
        formData.append('send_email', isLast ? 'true' : 'false');
        formData.append('customer_email', booking.customer_email);
        formData.append('customer_name', booking.customer_name);
        formData.append('booking_room', booking.room || '');
        formData.append('booking_date', date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }));
        formData.append('skip_upload', 'true');
        await fetch('/api/admin/library/deliverables', { method: 'POST', body: formData });
      }

      setUploadSuccess(true);
      setUploadFiles([]);
      setUploadProgress('');
    } catch (err) {
      console.error('Upload error:', err);
      alert('Network error — please try again');
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  }

  async function recordCash() {
    const amount = parseFloat(cashAmount);
    if (isNaN(amount) || amount <= 0) return;
    setActionLoading('cash');
    try {
      const res = await fetch('/api/booking/record-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, amount, method: 'cash', note: cashNote }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Cash payment of $${amount.toFixed(2)} recorded`);
        setShowCashPayment(false);
        setCashAmount('');
        setCashNote('');
        onUpdate?.();
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch {
      alert('Error recording payment');
    } finally {
      setActionLoading(null);
    }
  }

  async function resendEmail(type: 'confirmation' | 'engineer_alert') {
    setNotifying(true);
    try {
      const res = await fetch('/api/booking/renotify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, type }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Email sent to: ${data.to}`);
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch {
      alert('Error sending email');
    } finally {
      setNotifying(false);
    }
  }

  return (
    <div className={`border-2 p-4 sm:p-5 ${unclaimed ? 'border-[#F4C430]/40 bg-[#F4C430]/5' : 'border-black/10'}`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm font-bold">
            {booking.customer_name}
            {booking.artist_name && <span className="font-normal text-black/40 ml-1">({booking.artist_name})</span>}
          </p>
          {booking.customer_email && (
            <p className="font-mono text-xs text-black/50">{booking.customer_email}</p>
          )}
          {booking.requested_engineer && (
            <div className="flex items-center gap-2 mt-0.5">
              <p className="font-mono text-[10px] text-amber-600 font-semibold">
                Requested: {booking.requested_engineer}
              </p>
              {booking.priority_expires_at && new Date(booking.priority_expires_at) > new Date() && (
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 animate-pulse">
                  Priority Window Active
                </span>
              )}
              {booking.priority_expires_at && new Date(booking.priority_expires_at) <= new Date() && (
                <span className="font-mono text-[10px] uppercase tracking-wider bg-black/5 text-black/40 px-2 py-0.5">
                  Priority Expired
                </span>
              )}
            </div>
          )}
          {booking.reschedule_requested && (
            <p className="font-mono text-[10px] text-red-500 font-semibold mt-0.5">
              ⚠ Reschedule Requested
            </p>
          )}
          <p className="font-mono text-xs text-black/40 mt-1">
            {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}
            {' · '}
            {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })}
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
          {unclaimed && onClaim && (() => {
            const isInPriority = booking.requested_engineer && booking.priority_expires_at &&
              new Date(booking.priority_expires_at) > new Date();
            const isRequestedForMe = booking.requested_engineer && userEmail && (
              booking.requested_engineer === userEmail ||
              // Also match by display names from ENGINEERS constant
              true // We'll rely on the API to enforce this
            );

            return (
              <div className="flex items-center gap-2">
                {/* Accept button — always shown */}
                <button
                  onClick={onClaim}
                  disabled={claimLoading}
                  className="font-mono text-xs font-bold uppercase tracking-wider bg-[#F4C430] text-black px-5 py-2.5 hover:bg-[#F4C430]/80 disabled:opacity-50 transition-colors"
                >
                  {claimLoading ? 'Accepting...' : (isInPriority && isRequestedForMe ? '✓ Accept Session' : 'Accept Session')}
                </button>

                {/* Pass button — only for the requested engineer during priority */}
                {isInPriority && onPass && (
                  <button
                    onClick={() => {
                      if (confirm(`Pass on ${booking.customer_name}'s session? It will immediately open to all engineers.`)) {
                        onPass();
                      }
                    }}
                    disabled={claimLoading}
                    className="font-mono text-xs font-bold uppercase tracking-wider border-2 border-black/20 text-black/60 px-5 py-2.5 hover:bg-red-50 hover:border-red-200 hover:text-red-600 disabled:opacity-50 transition-colors"
                  >
                    Pass
                  </button>
                )}

                {/* Priority info */}
                {isInPriority && booking.requested_engineer && (
                  <span className="font-mono text-[10px] text-black/40">
                    Requested: <span className="font-bold text-accent">{booking.requested_engineer}</span>
                    {booking.priority_expires_at && (
                      <> · Priority until {new Date(booking.priority_expires_at).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                      })}</>
                    )}
                  </span>
                )}

                {/* Post-priority info */}
                {!isInPriority && booking.requested_engineer && (
                  <span className="font-mono text-[10px] text-red-500/70">
                    {booking.requested_engineer} did not respond · Open to all
                  </span>
                )}
              </div>
            );
          })()}
          {canCharge && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => chargeRemainder()}
                disabled={charging}
                className="font-mono text-xs font-bold uppercase tracking-wider bg-black text-white px-4 py-2 hover:bg-black/80 disabled:opacity-50 transition-colors"
              >
                {charging ? 'Charging...' : `Charge — ${formatCents(remainder)}`}
              </button>
              <button
                onClick={() => { setShowChargeEdit(!showChargeEdit); setChargeAmountInput((remainder / 100).toFixed(2)); }}
                className="font-mono text-[10px] text-black/40 hover:text-black underline"
              >
                Edit
              </button>
            </div>
          )}
          {remainder > 0 && (
            <button
              onClick={() => { setShowCashPayment(!showCashPayment); setCashAmount((remainder / 100).toFixed(2)); setCashNote(''); }}
              className="font-mono text-xs font-bold uppercase tracking-wider border-2 border-black/20 text-black/60 px-4 py-2 hover:bg-black/5 transition-colors"
            >
              Record Cash
            </button>
          )}
          {remainder === 0 && booking.status !== 'cancelled' && (
            <span className="font-mono text-xs text-green-600 font-bold uppercase px-3 py-2">Paid in Full</span>
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
            onClick={() => { setShowChangeEngineer(!showChangeEngineer); setSelectedEngineer(booking.engineer_name || ''); }}
            className="font-mono text-xs font-bold uppercase tracking-wider border-2 border-black/20 text-black/60 px-4 py-2 hover:bg-black/5 transition-colors"
          >
            Change Engineer
          </button>
          <button
            onClick={() => resendEmail('confirmation')}
            disabled={notifying}
            className="font-mono text-xs font-bold uppercase tracking-wider border-2 border-black/20 text-black/60 px-4 py-2 hover:bg-black/5 disabled:opacity-50 transition-colors"
          >
            {notifying ? 'Sending...' : 'Resend Email'}
          </button>
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="font-mono text-xs uppercase tracking-wider text-black/30 px-3 py-2 hover:text-black/60 transition-colors"
          >
            {showDebug ? 'Hide Details' : 'Debug'}
          </button>
        </div>
      )}

      {/* Charge edit form */}
      {showChargeEdit && canCharge && (
        <div className="mt-3 p-3 bg-black/5 border border-black/10 space-y-2">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider">Adjust Charge Amount</p>
          <p className="font-mono text-[10px] text-black/50">
            Default remainder is {formatCents(remainder)}. Change the amount if the session was adjusted (e.g. switched studios).
          </p>
          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="font-mono text-[10px] text-black/40 block">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.50"
                value={chargeAmountInput}
                onChange={(e) => setChargeAmountInput(e.target.value)}
                className="font-mono text-sm border border-black/20 px-3 py-1.5 w-28"
              />
            </div>
            <button
              onClick={() => {
                const cents = Math.round(parseFloat(chargeAmountInput) * 100);
                if (isNaN(cents) || cents < 50) { alert('Minimum charge is $0.50'); return; }
                chargeRemainder(cents);
              }}
              disabled={charging}
              className="font-mono text-xs font-bold uppercase tracking-wider bg-black text-white px-4 py-2 hover:bg-black/80 disabled:opacity-50 transition-colors"
            >
              {charging ? 'Charging...' : `Charge $${chargeAmountInput || '0.00'}`}
            </button>
          </div>
        </div>
      )}

      {/* Cash payment form */}
      {showCashPayment && (
        <div className="mt-3 p-3 bg-black/5 border border-black/10 space-y-2">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider">Record Cash Payment</p>
          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="font-mono text-[10px] text-black/40 block">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                className="font-mono text-sm border border-black/20 px-3 py-1.5 w-28"
              />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="font-mono text-[10px] text-black/40 block">Note (optional)</label>
              <input
                type="text"
                value={cashNote}
                onChange={(e) => setCashNote(e.target.value)}
                className="font-mono text-xs border border-black/20 px-3 py-1.5 w-full"
                placeholder="e.g. paid at studio"
              />
            </div>
            <button
              onClick={recordCash}
              disabled={actionLoading === 'cash'}
              className="font-mono text-xs font-bold uppercase tracking-wider bg-black text-white px-4 py-2 hover:bg-black/80 disabled:opacity-50 transition-colors"
            >
              {actionLoading === 'cash' ? 'Recording...' : `Record $${cashAmount || '0.00'}`}
            </button>
          </div>
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
            <div>
              <label className="font-mono text-[10px] text-black/40 block">Duration</label>
              <select
                value={newDuration}
                onChange={(e) => setNewDuration(Number(e.target.value))}
                className="font-mono text-xs border border-black/20 px-2 py-1.5"
              >
                {[1,2,3,4,5,6,7,8].map(h => (
                  <option key={h} value={h}>{h}hr</option>
                ))}
              </select>
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

      {/* Change Engineer form */}
      {showChangeEngineer && (
        <div className="mt-3 p-3 bg-black/5 border border-black/10 space-y-2">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider">Change Engineer</p>
          <p className="font-mono text-[10px] text-black/50">
            Current: <span className="font-bold">{booking.engineer_name || 'Unassigned'}</span>
          </p>
          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="font-mono text-[10px] text-black/40 block">Engineer</label>
              <select
                value={selectedEngineer}
                onChange={(e) => setSelectedEngineer(e.target.value)}
                className="font-mono text-xs border border-black/20 px-2 py-1.5 min-w-[160px]"
              >
                <option value="">Unassigned</option>
                {ENGINEERS.map((eng) => (
                  <option key={eng.name} value={eng.name}>{eng.displayName} ({eng.name})</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                if (!confirm(`Change engineer to ${selectedEngineer || 'Unassigned'}?`)) return;
                updateBooking({ engineerName: selectedEngineer }, 'change engineer');
                setShowChangeEngineer(false);
              }}
              disabled={actionLoading === 'change engineer'}
              className="font-mono text-xs font-bold uppercase tracking-wider bg-[#F4C430] text-black px-4 py-2 hover:bg-[#F4C430]/80 disabled:opacity-50 transition-colors"
            >
              {actionLoading === 'change engineer' ? 'Saving...' : 'Confirm'}
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
                    Drag and drop files or click to select. Upload all files for {booking.customer_name} — they&apos;ll get one email with a download link.
                  </p>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const files = Array.from(e.dataTransfer.files);
                      setUploadFiles(prev => [...prev, ...files]);
                    }}
                    className={`border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                      isDragging ? 'border-accent bg-accent/10' : 'border-black/20 hover:border-accent'
                    }`}
                  >
                    <label className="cursor-pointer block">
                      <p className="font-mono text-xs font-bold uppercase tracking-wider mb-1">
                        {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                      </p>
                      <p className="font-mono text-[10px] text-black/40">or click to browse — WAV, MP3, FLAC, ZIP</p>
                      <input
                        type="file"
                        accept="audio/*,.wav,.mp3,.flac,.aiff,.m4a,.zip"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setUploadFiles(prev => [...prev, ...files]);
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {uploadFiles.length > 0 && (
                    <div className="space-y-1">
                      {uploadFiles.map((file, i) => (
                        <div key={`${file.name}-${i}`} className="flex items-center justify-between py-1.5 px-2 bg-white border border-black/10">
                          <span className="font-mono text-xs truncate">{file.name}</span>
                          <button
                            onClick={() => setUploadFiles(prev => prev.filter((_, idx) => idx !== i))}
                            className="font-mono text-[10px] text-red-500 hover:underline ml-2 flex-shrink-0"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <p className="font-mono text-[10px] text-black/40">{uploadFiles.length} file{uploadFiles.length > 1 ? 's' : ''} selected</p>
                    </div>
                  )}
                  <button
                    onClick={handleFileUpload}
                    disabled={uploadFiles.length === 0 || uploading || !booking.customer_email}
                    className="bg-[#F4C430] text-black font-mono text-xs font-bold uppercase tracking-wider px-5 py-2.5 hover:bg-[#F4C430]/80 disabled:opacity-50 transition-colors"
                  >
                    {uploading ? (uploadProgress || 'Uploading...') : `Upload ${uploadFiles.length || ''} File${uploadFiles.length !== 1 ? 's' : ''} & Send to Client`}
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
