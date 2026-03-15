'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, ChevronDown, DollarSign, X, Check, Clock, Pencil, Mail, Banknote } from 'lucide-react';
import { formatCents } from '@/lib/utils';
import { ENGINEERS, ROOM_LABELS } from '@/lib/constants';

interface Booking {
  id: string;
  first_name: string;
  last_name: string;
  artist_name: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  start_time: string;
  end_time: string;
  duration: number;
  room: string | null;
  engineer_name: string | null;
  requested_engineer: string | null;
  deposit_amount: number;
  total_amount: number;
  remainder_amount: number;
  actual_deposit_paid: number | null;
  status: string;
  stripe_customer_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  same_day_fee: boolean;
  night_fees_amount: number;
  same_day_fee_amount: number;
  admin_notes: string | null;
  created_at: string;
  claimed_at: string | null;
}

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  pending_approval: 'bg-orange-100 text-orange-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
  rejected: 'bg-red-100 text-red-600',
  deleted: 'bg-gray-100 text-gray-500',
};

export default function BookingManager() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingRemainder, setEditingRemainder] = useState<string | null>(null);
  const [remainderInput, setRemainderInput] = useState('');
  const [editingCharge, setEditingCharge] = useState<string | null>(null);
  const [chargeInput, setChargeInput] = useState('');
  const [editingTime, setEditingTime] = useState<string | null>(null);
  const [timeInput, setTimeInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [durationInput, setDurationInput] = useState(2);
  const [showDebug, setShowDebug] = useState<string | null>(null);
  const [showCashPayment, setShowCashPayment] = useState<string | null>(null);
  const [cashAmount, setCashAmount] = useState('');
  const [cashNote, setCashNote] = useState('');

  async function fetchBookings() {
    setLoading(true);
    const res = await fetch(`/api/admin/bookings?status=${filter}&limit=100`);
    const data = await res.json();
    setBookings(data.bookings || []);
    setLoading(false);
  }

  useEffect(() => { fetchBookings(); }, [filter]);

  async function updateStatus(bookingId: string, status: string) {
    setUpdatingId(bookingId);
    await fetch('/api/admin/bookings/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId,
        updates: {
          status,
          ...(status === 'completed' ? { approved_at: new Date().toISOString() } : {}),
          ...(status === 'cancelled' ? { deleted_at: new Date().toISOString() } : {}),
        },
      }),
    });
    setUpdatingId(null);
    fetchBookings();
  }

  async function updateBooking(bookingId: string, updates: Record<string, unknown>) {
    setUpdatingId(bookingId);
    await fetch('/api/admin/bookings/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, updates }),
    });
    setUpdatingId(null);
    fetchBookings();
  }

  async function chargeRemainder(bookingId: string, amount: number) {
    if (!confirm(`Charge ${formatCents(amount)} to the customer's saved card?`)) return;
    setUpdatingId(bookingId);
    try {
      const res = await fetch('/api/booking/charge-remainder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, amount }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Successfully charged ${formatCents(data.amountCharged)}`);
        fetchBookings();
      } else if (data.fallback && data.paymentUrl) {
        alert(
          data.emailSent
            ? 'Could not charge saved card (bank requires authentication). A payment link has been automatically emailed to the client.'
            : 'Could not charge saved card. Payment link copied to clipboard — send it to the client.'
        );
        navigator.clipboard.writeText(data.paymentUrl);
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch {
      alert('Error charging remainder');
    }
    setUpdatingId(null);
  }

  async function updateNotes(bookingId: string, notes: string) {
    await fetch('/api/admin/bookings/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, updates: { admin_notes: notes } }),
    });
  }

  async function transferEngineer(bookingId: string, engineerName: string | null) {
    setUpdatingId(bookingId);
    await fetch('/api/admin/bookings/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId,
        updates: {
          engineer_name: engineerName,
          ...(engineerName ? { claimed_at: new Date().toISOString() } : { claimed_at: null }),
        },
      }),
    });
    setUpdatingId(null);
    fetchBookings();
  }

  async function renotify(bookingId: string, type: 'confirmation' | 'engineer_alert') {
    setUpdatingId(bookingId);
    try {
      const res = await fetch('/api/booking/renotify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, type }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Email sent to: ${data.to}`);
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch {
      alert('Error sending email');
    }
    setUpdatingId(null);
  }

  async function recordCashPayment(bookingId: string) {
    const amount = parseFloat(cashAmount);
    if (isNaN(amount) || amount <= 0) return;
    setUpdatingId(bookingId);
    try {
      const res = await fetch('/api/booking/record-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, amount, method: 'cash', note: cashNote }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Cash payment of $${amount.toFixed(2)} recorded`);
        setShowCashPayment(null);
        setCashAmount('');
        setCashNote('');
        fetchBookings();
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch {
      alert('Error recording payment');
    }
    setUpdatingId(null);
  }

  function saveRemainder(bookingId: string) {
    const cents = Math.round(parseFloat(remainderInput) * 100);
    if (isNaN(cents) || cents < 0) return;
    updateBooking(bookingId, { remainder_amount: cents });
    setEditingRemainder(null);
  }

  function saveTimeChange(bookingId: string) {
    if (!dateInput || !timeInput) return;
    const [h, m] = timeInput.split(':').map(Number);
    const endDec = (h + (m || 0) / 60 + durationInput) % 24;
    const endH = Math.floor(endDec);
    const endM = endDec % 1 >= 0.5 ? '30' : '00';
    const startDateTime = `${dateInput}T${timeInput}:00`;
    const endDateTime = `${dateInput}T${endH}:${endM}:00`;
    updateBooking(bookingId, { start_time: startDateTime, end_time: endDateTime, duration: durationInput });
    setEditingTime(null);
  }

  // Stats
  const stats = {
    total: bookings.length,
    active: bookings.filter((b) => ['confirmed', 'pending', 'pending_approval'].includes(b.status)).length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    revenue: bookings.filter((b) => b.status === 'completed').reduce((sum, b) => sum + (b.actual_deposit_paid || b.total_amount), 0),
  };

  return (
    <div>
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Bookings', value: stats.total, icon: CalendarIcon },
          { label: 'Active', value: stats.active, icon: Clock },
          { label: 'Completed', value: stats.completed, icon: Check },
          { label: 'Revenue', value: formatCents(stats.revenue), icon: DollarSign },
        ].map((s) => (
          <div key={s.label} className="border border-black/10 p-4">
            <s.icon className="w-4 h-4 text-accent mb-2" />
            <p className="font-heading text-xl">{s.value}</p>
            <p className="font-mono text-[10px] text-black/40 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter & Refresh */}
      <div className="flex items-center gap-3 mb-6">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as StatusFilter)}
          className="border-2 border-black px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="rejected">Rejected</option>
        </select>
        <button onClick={fetchBookings} className="p-2 border border-black/20 hover:border-black transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <span className="font-mono text-xs text-black/40">{bookings.length} bookings</span>
      </div>

      {/* Bookings List */}
      {loading ? (
        <p className="font-mono text-sm text-black/40">Loading...</p>
      ) : (
        <div className="space-y-2">
          {bookings.map((b) => {
            const isExpanded = expandedId === b.id;
            const date = new Date(b.start_time);
            const roomLabel = ROOM_LABELS[b.room as keyof typeof ROOM_LABELS] || b.room || '—';

            return (
              <div key={b.id} className="border-2 border-black/10 hover:border-black/20 transition-colors">
                {/* Summary Row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : b.id)}
                  className="w-full p-4 text-left flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-bold">{b.customer_name}</span>
                      <span className={`font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${STATUS_COLORS[b.status] || 'bg-black/5 text-black/50'}`}>
                        {b.status}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-black/50 mt-1">
                      {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })} · {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })} · {b.duration}hr · {roomLabel}
                      {b.engineer_name && <span className="text-accent"> · {b.engineer_name}</span>}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-mono text-sm font-bold">{formatCents(b.total_amount)}</p>
                    {b.actual_deposit_paid != null && b.actual_deposit_paid > 0 && (
                      <p className="font-mono text-[10px] text-green-600">Paid: {formatCents(b.actual_deposit_paid)}</p>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-black/30 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-black/10 p-4 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
                      <div>
                        <p className="text-black/40 uppercase tracking-wider">Email</p>
                        <p className="font-semibold">{b.customer_email}</p>
                      </div>
                      <div>
                        <p className="text-black/40 uppercase tracking-wider">Phone</p>
                        <p className="font-semibold">{b.customer_phone || '—'}</p>
                      </div>
                      <div>
                        <p className="text-black/40 uppercase tracking-wider">Room</p>
                        <p className="font-semibold">{roomLabel}</p>
                      </div>
                      <div>
                        <p className="text-black/40 uppercase tracking-wider">Duration</p>
                        <p className="font-semibold">{b.duration}hr</p>
                      </div>
                    </div>

                    {/* Financial Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
                      <div>
                        <p className="text-black/40 uppercase tracking-wider">Total</p>
                        <p className="font-semibold">{formatCents(b.total_amount)}</p>
                      </div>
                      <div>
                        <p className="text-black/40 uppercase tracking-wider">Deposit Paid</p>
                        <p className="font-semibold">{formatCents(b.actual_deposit_paid || b.deposit_amount)}</p>
                      </div>
                      <div>
                        <p className="text-black/40 uppercase tracking-wider">Remainder</p>
                        {editingRemainder === b.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-black/60">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={remainderInput}
                              onChange={(e) => setRemainderInput(e.target.value)}
                              className="w-20 border border-black/20 px-1 py-0.5 text-xs font-mono"
                              autoFocus
                            />
                            <button onClick={() => saveRemainder(b.id)} className="text-green-600 font-bold">✓</button>
                            <button onClick={() => setEditingRemainder(null)} className="text-red-500 font-bold">✕</button>
                          </div>
                        ) : (
                          <p className="font-semibold">
                            {formatCents(b.remainder_amount)}
                            <button
                              onClick={() => { setEditingRemainder(b.id); setRemainderInput((b.remainder_amount / 100).toFixed(2)); }}
                              className="ml-1 text-accent hover:underline text-[10px]"
                            >Edit</button>
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-black/40 uppercase tracking-wider">Surcharges</p>
                        <p className="font-semibold">
                          {b.night_fees_amount > 0 && <span>Night: {formatCents(b.night_fees_amount)}</span>}
                          {b.same_day_fee && <span className="block">Same-day: {formatCents(b.same_day_fee_amount)}</span>}
                          {!b.night_fees_amount && !b.same_day_fee && '—'}
                        </p>
                      </div>
                    </div>

                    {/* Engineer Assignment */}
                    <div className="font-mono text-xs">
                      <p className="text-black/40 uppercase tracking-wider mb-1">Engineer</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <select
                          value={b.engineer_name || ''}
                          onChange={(e) => transferEngineer(b.id, e.target.value || null)}
                          disabled={updatingId === b.id}
                          className="border border-black/20 px-2 py-1.5 font-mono text-xs focus:border-accent focus:outline-none"
                        >
                          <option value="">Unclaimed</option>
                          {ENGINEERS.map((eng) => (
                            <option key={eng.name} value={eng.name}>{eng.displayName} ({eng.studios.map(s => ROOM_LABELS[s as keyof typeof ROOM_LABELS]).join(', ')})</option>
                          ))}
                          {b.engineer_name && !ENGINEERS.some(e => e.name === b.engineer_name) && (
                            <option value={b.engineer_name}>{b.engineer_name} (profile name)</option>
                          )}
                        </select>
                        {b.requested_engineer && (
                          <span className="text-black/40">Requested: {b.requested_engineer}</span>
                        )}
                      </div>
                    </div>

                    {/* Reschedule / Edit Time */}
                    <div className="font-mono text-xs">
                      <p className="text-black/40 uppercase tracking-wider mb-1">Session Time</p>
                      {editingTime === b.id ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <input
                            type="date"
                            value={dateInput}
                            onChange={(e) => setDateInput(e.target.value)}
                            className="border border-black/20 px-2 py-1.5 font-mono text-xs"
                          />
                          <input
                            type="time"
                            value={timeInput}
                            onChange={(e) => setTimeInput(e.target.value)}
                            className="border border-black/20 px-2 py-1.5 font-mono text-xs"
                          />
                          <select
                            value={durationInput}
                            onChange={(e) => setDurationInput(Number(e.target.value))}
                            className="border border-black/20 px-2 py-1.5 font-mono text-xs"
                          >
                            {[1,2,3,4,5,6,7,8].map(h => (
                              <option key={h} value={h}>{h}hr</option>
                            ))}
                          </select>
                          <button
                            onClick={() => saveTimeChange(b.id)}
                            className="bg-accent text-black font-bold text-[10px] uppercase px-2 py-1.5"
                          >Save</button>
                          <button
                            onClick={() => setEditingTime(null)}
                            className="border border-black/20 text-black/60 font-bold text-[10px] uppercase px-2 py-1.5"
                          >Cancel</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })} · {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })}
                          </span>
                          <button
                            onClick={() => {
                              setEditingTime(b.id);
                              // Pre-fill with current values
                              const d = new Date(b.start_time);
                              setDateInput(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`);
                              setTimeInput(`${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`);
                              setDurationInput(b.duration || 2);
                            }}
                            className="text-accent hover:underline inline-flex items-center gap-0.5"
                          >
                            <Pencil className="w-3 h-3" /> Edit
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Admin Notes */}
                    <div>
                      <label className="font-mono text-[10px] text-black/40 uppercase tracking-wider block mb-1">Admin Notes</label>
                      <textarea
                        defaultValue={b.admin_notes || ''}
                        onBlur={(e) => updateNotes(b.id, e.target.value)}
                        rows={2}
                        className="w-full border border-black/10 px-3 py-2 font-mono text-xs focus:border-accent focus:outline-none resize-vertical"
                        placeholder="Internal notes..."
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {b.status === 'pending' && (
                        <button onClick={() => updateStatus(b.id, 'confirmed')} disabled={updatingId === b.id}
                          className="bg-green-600 text-white font-mono text-xs font-bold uppercase px-3 py-2 hover:bg-green-700 disabled:opacity-50 inline-flex items-center gap-1">
                          <Check className="w-3 h-3" /> Confirm
                        </button>
                      )}
                      {b.status === 'confirmed' && (
                        <button onClick={() => updateStatus(b.id, 'completed')} disabled={updatingId === b.id}
                          className="bg-accent text-black font-mono text-xs font-bold uppercase px-3 py-2 hover:bg-accent/80 disabled:opacity-50 inline-flex items-center gap-1">
                          <Check className="w-3 h-3" /> Complete
                        </button>
                      )}
                      {!['cancelled', 'completed', 'rejected'].includes(b.status) && (
                        <button onClick={() => updateStatus(b.id, 'cancelled')} disabled={updatingId === b.id}
                          className="border border-red-300 text-red-600 font-mono text-xs font-bold uppercase px-3 py-2 hover:bg-red-50 disabled:opacity-50 inline-flex items-center gap-1">
                          <X className="w-3 h-3" /> Cancel
                        </button>
                      )}
                      {b.remainder_amount > 0 && b.stripe_customer_id && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => chargeRemainder(b.id, editingCharge === b.id ? Math.round(parseFloat(chargeInput) * 100) : b.remainder_amount)}
                            disabled={updatingId === b.id}
                            className="border border-green-600 text-green-700 font-mono text-xs font-bold uppercase px-3 py-2 hover:bg-green-50 disabled:opacity-50 inline-flex items-center gap-1">
                            <DollarSign className="w-3 h-3" /> Charge {editingCharge === b.id ? `$${chargeInput}` : formatCents(b.remainder_amount)}
                          </button>
                          {editingCharge === b.id ? (
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-xs">$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={chargeInput}
                                onChange={(e) => setChargeInput(e.target.value)}
                                className="w-20 border border-black/20 px-1 py-0.5 text-xs font-mono"
                                autoFocus
                              />
                              <button onClick={() => setEditingCharge(null)} className="text-black/40 font-mono text-[10px]">Done</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setEditingCharge(b.id); setChargeInput((b.remainder_amount / 100).toFixed(2)); }}
                              className="font-mono text-[10px] text-accent hover:underline"
                            >Edit</button>
                          )}
                        </div>
                      )}
                      {b.remainder_amount > 0 && (
                        <button
                          onClick={() => { setShowCashPayment(showCashPayment === b.id ? null : b.id); setCashAmount((b.remainder_amount / 100).toFixed(2)); setCashNote(''); }}
                          disabled={updatingId === b.id}
                          className="border border-black/30 text-black/70 font-mono text-xs font-bold uppercase px-3 py-2 hover:bg-black/5 disabled:opacity-50 inline-flex items-center gap-1">
                          <Banknote className="w-3 h-3" /> Record Cash
                        </button>
                      )}
                      {b.remainder_amount === 0 && (
                        <span className="font-mono text-xs text-green-600 font-bold uppercase px-3 py-2 inline-flex items-center gap-1">
                          <Check className="w-3 h-3" /> Paid in Full
                        </span>
                      )}
                    </div>

                    {/* Cancelled — Record Kept Deposit */}
                    {b.status === 'cancelled' && (
                      <div className="border border-red-200 bg-red-50/50 p-3 space-y-2">
                        <p className="font-mono text-[10px] text-red-600 uppercase tracking-wider font-bold">Cancelled Session — Deposit Tracking</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 font-mono text-xs">
                          <div>
                            <p className="text-black/40">Original Total</p>
                            <p className="font-semibold">{formatCents(b.total_amount)}</p>
                          </div>
                          <div>
                            <p className="text-black/40">Deposit on Card</p>
                            <p className="font-semibold">{b.actual_deposit_paid ? formatCents(b.actual_deposit_paid) : '$0.00'}</p>
                          </div>
                          <div>
                            <p className="text-black/40">Deposit Kept</p>
                            <p className="font-semibold text-red-600">{formatCents(b.deposit_amount)}</p>
                            <button
                              onClick={() => { setEditingRemainder(b.id); setRemainderInput((b.deposit_amount / 100).toFixed(2)); }}
                              className="text-[10px] text-accent hover:underline"
                            >Edit kept amount</button>
                          </div>
                        </div>
                        {!b.actual_deposit_paid && b.deposit_amount === 0 && (
                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            <p className="font-mono text-[10px] text-black/40">Record cash deposit kept:</p>
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-xs">$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={cashAmount}
                                onChange={(e) => setCashAmount(e.target.value)}
                                className="w-24 border border-black/20 px-2 py-1.5 font-mono text-xs"
                                placeholder="Amount"
                              />
                            </div>
                            <button
                              onClick={async () => {
                                const amt = Math.round(parseFloat(cashAmount) * 100);
                                if (!amt || amt <= 0) return;
                                await fetch('/api/booking/record-payment', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ bookingId: b.id, amount: parseFloat(cashAmount), method: 'cash', note: 'Kept deposit from cancelled session' }),
                                });
                                updateBooking(b.id, { deposit_amount: amt, actual_deposit_paid: amt });
                                setCashAmount('');
                              }}
                              className="bg-black text-white font-mono text-[10px] font-bold uppercase px-3 py-1.5"
                            >Save</button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Cash Payment Form */}
                    {showCashPayment === b.id && (
                      <div className="border border-black/10 p-3 space-y-2">
                        <p className="font-mono text-[10px] text-black/40 uppercase tracking-wider">Record Cash/External Payment</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-sm">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={cashAmount}
                              onChange={(e) => setCashAmount(e.target.value)}
                              className="w-24 border border-black/20 px-2 py-1.5 font-mono text-xs"
                              placeholder="Amount"
                            />
                          </div>
                          <input
                            type="text"
                            value={cashNote}
                            onChange={(e) => setCashNote(e.target.value)}
                            className="flex-1 min-w-[120px] border border-black/20 px-2 py-1.5 font-mono text-xs"
                            placeholder="Note (optional)"
                          />
                          <button
                            onClick={() => recordCashPayment(b.id)}
                            disabled={updatingId === b.id}
                            className="bg-black text-white font-mono text-[10px] font-bold uppercase px-3 py-1.5 disabled:opacity-50"
                          >Record</button>
                          <button
                            onClick={() => setShowCashPayment(null)}
                            className="border border-black/20 font-mono text-[10px] text-black/60 uppercase px-3 py-1.5"
                          >Cancel</button>
                        </div>
                      </div>
                    )}

                    {/* Email Actions */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => renotify(b.id, 'confirmation')}
                        disabled={updatingId === b.id}
                        className="border border-black/20 text-black/60 font-mono text-[10px] font-bold uppercase px-3 py-2 hover:bg-black/5 disabled:opacity-50 inline-flex items-center gap-1">
                        <Mail className="w-3 h-3" /> Resend Confirmation
                      </button>
                      {!b.engineer_name && (
                        <button
                          onClick={() => renotify(b.id, 'engineer_alert')}
                          disabled={updatingId === b.id}
                          className="border border-black/20 text-black/60 font-mono text-[10px] font-bold uppercase px-3 py-2 hover:bg-black/5 disabled:opacity-50 inline-flex items-center gap-1">
                          <Mail className="w-3 h-3" /> Re-alert Engineers
                        </button>
                      )}
                    </div>

                    {/* Debug Toggle */}
                    <div>
                      <button
                        onClick={() => setShowDebug(showDebug === b.id ? null : b.id)}
                        className="font-mono text-[10px] text-black/30 hover:text-black/60 uppercase tracking-wider"
                      >
                        {showDebug === b.id ? 'Hide' : 'Show'} Debug Info
                      </button>
                      {showDebug === b.id && (
                        <div className="mt-2 bg-black/[0.02] border border-black/5 p-3 font-mono text-[10px] text-black/50 space-y-1">
                          <p>ID: {b.id}</p>
                          <p>Status: {b.status}</p>
                          <p>Created: {new Date(b.created_at).toLocaleString('en-US', { timeZone: 'UTC' })}</p>
                          <p>Start: {b.start_time}</p>
                          <p>End: {b.end_time}</p>
                          <p>Room: {b.room || '—'}</p>
                          <p>Engineer: {b.engineer_name || '—'}</p>
                          <p>Requested: {b.requested_engineer || '—'}</p>
                          {b.claimed_at && <p>Claimed: {new Date(b.claimed_at).toLocaleString('en-US', { timeZone: 'UTC' })}</p>}
                          <p>Total: {formatCents(b.total_amount)} · Deposit: {formatCents(b.deposit_amount)} · Remainder: {formatCents(b.remainder_amount)}</p>
                          <p>Deposit Paid: {formatCents(b.actual_deposit_paid || 0)}</p>
                          <p>Stripe Customer: {b.stripe_customer_id || '—'}</p>
                          <p>Stripe PI: {b.stripe_payment_intent_id || '—'}</p>
                          {b.stripe_checkout_session_id && <p>Stripe Session: {b.stripe_checkout_session_id}</p>}
                          <p>Night Fees: {formatCents(b.night_fees_amount || 0)}</p>
                          <p>Same Day: {b.same_day_fee ? `Yes (${formatCents(b.same_day_fee_amount || 0)})` : 'No'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CalendarIcon(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>
    </svg>
  );
}
