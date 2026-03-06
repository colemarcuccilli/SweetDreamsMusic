'use client';

import { useState } from 'react';
import { Copy, Check, Link as LinkIcon } from 'lucide-react';
import { ROOMS, ROOM_LABELS, ROOM_RATES, PRICING, STUDIO_HOURS, type Room } from '@/lib/constants';
import { formatCents, formatTime, calculateSessionTotal } from '@/lib/utils';

export default function CreateInvite() {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('11');
  const [duration, setDuration] = useState(2);
  const [room, setRoom] = useState<Room>('studio_a');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const pricing = calculateSessionTotal(room, duration, parseInt(startTime), false);

  async function handleCreate() {
    if (!date || !startTime) return;
    setCreating(true);

    try {
      const res = await fetch('/api/booking/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          startTime: `${startTime}:00`,
          duration,
          room,
          totalAmount: pricing.total,
          clientEmail,
          notes,
        }),
      });

      const data = await res.json();
      if (data.inviteUrl) {
        setInviteUrl(data.inviteUrl);
      }
    } catch (err) {
      console.error('Failed to create invite:', err);
    } finally {
      setCreating(false);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (inviteUrl) {
    return (
      <div className="max-w-lg">
        <div className="border-2 border-accent p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <LinkIcon className="w-6 h-6 text-accent" />
            <h3 className="text-heading-sm">INVITE CREATED</h3>
          </div>
          <p className="font-mono text-xs text-black/60 mb-4">
            Send this link to the client. They&apos;ll sign in (or create an account) and pay the deposit.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteUrl}
              readOnly
              className="flex-1 border border-black/20 px-3 py-2 font-mono text-xs bg-black/5 truncate"
            />
            <button
              onClick={copyLink}
              className="bg-black text-white px-4 py-2 font-mono text-xs font-bold inline-flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <button
            onClick={() => { setInviteUrl(''); setDate(''); setClientEmail(''); setNotes(''); }}
            className="font-mono text-xs text-accent hover:underline mt-4"
          >
            Create another invite
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <p className="font-mono text-sm text-black/60">
        Create a session and generate a link. The client clicks the link, signs in, and pays the deposit.
      </p>

      <div>
        <label className="block font-mono text-xs font-semibold uppercase tracking-wider mb-1">Date *</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="w-full border-2 border-black px-4 py-3 font-mono text-sm focus:border-accent focus:outline-none" />
      </div>

      <div>
        <label className="block font-mono text-xs font-semibold uppercase tracking-wider mb-1">Start Time *</label>
        <select value={startTime} onChange={(e) => setStartTime(e.target.value)}
          className="w-full border-2 border-black px-4 py-3 font-mono text-sm focus:border-accent focus:outline-none">
          {Array.from({ length: STUDIO_HOURS.regular.end - STUDIO_HOURS.regular.start }, (_, i) => STUDIO_HOURS.regular.start + i)
            .concat(Array.from({ length: 24 - STUDIO_HOURS.afterHours.start + STUDIO_HOURS.afterHours.end }, (_, i) => (STUDIO_HOURS.afterHours.start + i) % 24))
            .map((h) => (
              <option key={h} value={h}>{formatTime(`${h}:00`)}</option>
            ))}
        </select>
      </div>

      <div>
        <label className="block font-mono text-xs font-semibold uppercase tracking-wider mb-1">Duration: {duration} hours</label>
        <div className="flex gap-2">
          {Array.from({ length: PRICING.maxHours }, (_, i) => i + 1).map((h) => (
            <button key={h} onClick={() => setDuration(h)}
              className={`w-12 h-12 font-mono text-sm font-bold border transition-colors ${
                duration === h ? 'bg-black text-white border-black' : 'border-black/20 hover:border-black'
              }`}>
              {h}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block font-mono text-xs font-semibold uppercase tracking-wider mb-1">Studio</label>
        <div className="flex gap-3">
          {ROOMS.map((r) => (
            <button key={r} onClick={() => setRoom(r)}
              className={`flex-1 p-3 border-2 font-mono text-xs font-bold uppercase transition-colors ${
                room === r ? 'bg-black text-white border-black' : 'border-black/20 hover:border-black'
              }`}>
              {ROOM_LABELS[r]} — {formatCents(ROOM_RATES[r])}/hr
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block font-mono text-xs font-semibold uppercase tracking-wider mb-1">Client Email (optional)</label>
        <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)}
          className="w-full border-2 border-black/20 px-4 py-3 font-mono text-sm focus:border-accent focus:outline-none"
          placeholder="client@email.com" />
      </div>

      <div>
        <label className="block font-mono text-xs font-semibold uppercase tracking-wider mb-1">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
          className="w-full border-2 border-black/20 px-4 py-3 font-mono text-sm focus:border-accent focus:outline-none resize-vertical"
          placeholder="Session details..." />
      </div>

      {/* Price Summary */}
      <div className="border-2 border-black p-4 font-mono text-sm">
        <div className="flex justify-between"><span className="text-black/60">Session Total</span><span>{formatCents(pricing.total)}</span></div>
        <div className="flex justify-between font-bold mt-1"><span>Client Deposit (50%)</span><span className="text-accent">{formatCents(pricing.deposit)}</span></div>
      </div>

      <button
        onClick={handleCreate}
        disabled={!date || creating}
        className="w-full bg-accent text-black font-mono text-base font-bold uppercase tracking-wider py-4 hover:bg-accent/90 transition-colors disabled:opacity-50"
      >
        {creating ? 'CREATING...' : 'CREATE INVITE LINK'}
      </button>
    </div>
  );
}
