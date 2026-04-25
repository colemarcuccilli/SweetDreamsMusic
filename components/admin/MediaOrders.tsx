'use client';

// components/admin/MediaOrders.tsx
//
// Admin operations on the Media Hub. Three things on one screen:
//   1. List of media_bookings with status + buyer + offering + sessions count
//   2. Inline "edit" panel for each booking — change status, paste
//      deliverables JSON, see all sessions
//   3. Per-session "mark complete + payout" action (admin sets dollar
//      amount; the system snapshots split_breakdown if provided)
//
// Why one consolidated panel instead of separate routes per booking: most
// admin work on a media order is "look at the order, mark a session done,
// paste a deliverable URL, move on." A nested-route flow would force
// 3 page loads per touch. Inline edits keep the operator moving.
//
// We refetch the whole list after any mutation. With 200-row cap and one
// admin doing ops, this is fine — no need for optimistic updates yet.

import { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Save,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Link as LinkIcon,
  AlertCircle,
} from 'lucide-react';
import { formatCents } from '@/lib/utils';
import {
  type MediaSessionBooking,
  type MediaSessionKind,
  SESSION_KIND_LABELS,
} from '@/lib/media-scheduling';

interface BookingRow {
  id: string;
  offering_id: string;
  user_id: string;
  band_id: string | null;
  status: string;
  configured_components: unknown | null;
  final_price_cents: number;
  deliverables: { items?: DeliverableItem[] } | null;
  notes_to_us: string | null;
  created_at: string;
}

interface OfferingRow {
  id: string;
  title: string;
  slug: string;
}

interface ProfileRow {
  user_id: string;
  display_name: string | null;
  full_name: string | null;
  email: string | null;
}

interface BandRow {
  id: string;
  display_name: string;
}

interface DeliverableItem {
  label: string;
  url: string;
  kind?: 'video' | 'image' | 'audio' | 'file' | 'link';
  added_at?: string;
}

const STATUS_OPTIONS = [
  'inquiry',
  'deposited',
  'scheduled',
  'in_production',
  'delivered',
  'cancelled',
];

export default function MediaOrders() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [offerings, setOfferings] = useState<OfferingRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [bands, setBands] = useState<BandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/media/bookings', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setBookings(data.bookings || []);
        setOfferings(data.offerings || []);
        setProfiles(data.profiles || []);
        setBands(data.bands || []);
      }
    } catch (e) {
      console.error('[admin-media-orders] fetch error:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const offeringMap = new Map(offerings.map((o) => [o.id, o]));
  const profileMap = new Map(profiles.map((p) => [p.user_id, p]));
  const bandMap = new Map(bands.map((b) => [b.id, b]));

  const filtered =
    filterStatus === 'all'
      ? bookings
      : bookings.filter((b) => b.status === filterStatus);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold mb-1">Media Orders</h2>
          <p className="font-mono text-xs text-black/50">
            Sessions, deliverables, and order-level admin. Edits land instantly.
          </p>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="font-mono text-xs uppercase tracking-wider px-3 py-2 border border-black/15 bg-white"
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="font-mono text-sm text-black/50">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="font-mono text-sm text-black/50">
          No media orders match this filter.
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((b) => {
            const offering = offeringMap.get(b.offering_id);
            const buyer = profileMap.get(b.user_id);
            const buyerName =
              buyer?.full_name || buyer?.display_name || buyer?.email || 'Unknown buyer';
            const bandName = b.band_id ? bandMap.get(b.band_id)?.display_name : null;
            const isExpanded = expandedId === b.id;

            return (
              <li key={b.id} className="border-2 border-black/10">
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : b.id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-black/[0.02] text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-black/40 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-black/40 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-bold truncate">
                        {offering?.title || 'Unknown offering'}{' '}
                        <span className="font-mono text-xs text-black/50">
                          · {buyerName}
                          {bandName && <> for {bandName}</>}
                        </span>
                      </p>
                      <p className="font-mono text-[11px] text-black/50">
                        {new Date(b.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                        {' · '}
                        {b.final_price_cents > 0
                          ? formatCents(b.final_price_cents)
                          : 'Inquiry'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 shrink-0 ${
                      statusBadgeCls(b.status)
                    }`}
                  >
                    {b.status}
                  </span>
                </button>

                {isExpanded && (
                  <BookingPanel
                    booking={b}
                    onChange={refresh}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function statusBadgeCls(status: string): string {
  switch (status) {
    case 'delivered':
      return 'bg-green-100 text-green-900';
    case 'in_production':
      return 'bg-purple-100 text-purple-900';
    case 'scheduled':
      return 'bg-blue-100 text-blue-900';
    case 'deposited':
      return 'bg-accent/20 text-black';
    case 'inquiry':
      return 'bg-black/10 text-black/70';
    case 'cancelled':
      return 'bg-red-100 text-red-900';
    default:
      return 'bg-black/10 text-black/70';
  }
}

// ============================================================
// Per-booking panel — sessions list + deliverables editor + status switch
// ============================================================

function BookingPanel({
  booking,
  onChange,
}: {
  booking: BookingRow;
  onChange: () => void;
}) {
  const [sessions, setSessions] = useState<MediaSessionBooking[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [status, setStatus] = useState(booking.status);
  const [savingStatus, setSavingStatus] = useState(false);
  const [deliverables, setDeliverables] = useState<DeliverableItem[]>(
    booking.deliverables?.items ?? [],
  );
  const [savingDeliverables, setSavingDeliverables] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New deliverable form state
  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newKind, setNewKind] = useState<DeliverableItem['kind']>('video');

  async function loadSessions() {
    setLoadingSessions(true);
    try {
      const res = await fetch(
        `/api/media/sessions?parent_booking_id=${booking.id}`,
        { cache: 'no-store' },
      );
      const data = await res.json();
      if (res.ok) setSessions(data.sessions || []);
    } catch (e) {
      console.error('[admin-media-orders] sessions fetch error:', e);
    } finally {
      setLoadingSessions(false);
    }
  }

  useEffect(() => {
    // Inline the fetch so the effect's only dependency is booking.id —
    // loadSessions captured via closure would invalidate the dep array
    // unnecessarily. We re-sync local state if the parent refresh swapped
    // in a different booking row (status / deliverables) at the same id.
    let cancelled = false;
    (async () => {
      setLoadingSessions(true);
      try {
        const res = await fetch(
          `/api/media/sessions?parent_booking_id=${booking.id}`,
          { cache: 'no-store' },
        );
        const data = await res.json();
        if (!cancelled && res.ok) setSessions(data.sessions || []);
      } catch (e) {
        console.error('[admin-media-orders] sessions fetch error:', e);
      } finally {
        if (!cancelled) setLoadingSessions(false);
      }
    })();
    setStatus(booking.status);
    setDeliverables(booking.deliverables?.items ?? []);
    return () => {
      cancelled = true;
    };
  }, [booking.id, booking.status, booking.deliverables]);

  async function saveStatus() {
    if (status === booking.status) return;
    setSavingStatus(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/media/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Could not save status');
      } else {
        onChange();
      }
    } catch (e) {
      console.error('[admin-media-orders] save status error:', e);
      setError('Network error');
    } finally {
      setSavingStatus(false);
    }
  }

  async function saveDeliverables(next: DeliverableItem[]) {
    setSavingDeliverables(true);
    setError(null);
    try {
      const payload = next.length === 0 ? null : { items: next };
      const res = await fetch(`/api/admin/media/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliverables: payload }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Could not save deliverables');
        return;
      }
      setDeliverables(next);
      onChange();
    } catch (e) {
      console.error('[admin-media-orders] deliverables save error:', e);
      setError('Network error');
    } finally {
      setSavingDeliverables(false);
    }
  }

  function addDeliverable() {
    if (!newLabel.trim() || !newUrl.trim()) {
      setError('Deliverable needs a label and URL.');
      return;
    }
    const next = [
      ...deliverables,
      {
        label: newLabel.trim(),
        url: newUrl.trim(),
        kind: newKind,
        added_at: new Date().toISOString(),
      },
    ];
    setNewLabel('');
    setNewUrl('');
    saveDeliverables(next);
  }

  function removeDeliverable(idx: number) {
    const next = deliverables.filter((_, i) => i !== idx);
    saveDeliverables(next);
  }

  return (
    <div className="border-t border-black/10 p-5 bg-black/[0.02] space-y-5">
      {/* Status switcher */}
      <div className="flex items-center gap-3">
        <p className="font-mono text-[11px] uppercase tracking-wider font-bold text-black/60">
          Status
        </p>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="font-mono text-xs px-2 py-1 border border-black/15 bg-white"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={saveStatus}
          disabled={savingStatus || status === booking.status}
          className="font-mono text-xs px-3 py-1 bg-black text-white hover:bg-accent hover:text-black disabled:opacity-30 inline-flex items-center gap-1"
        >
          <Save className="w-3 h-3" />
          {savingStatus ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* Sessions */}
      <div>
        <p className="font-mono text-[11px] uppercase tracking-wider font-bold text-black/60 mb-2">
          Sessions
        </p>
        {loadingSessions ? (
          <p className="font-mono text-xs text-black/50">Loading…</p>
        ) : sessions.length === 0 ? (
          <p className="font-mono text-xs text-black/50">
            No sessions scheduled yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {sessions.map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                onChange={() => {
                  loadSessions();
                  onChange();
                }}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Deliverables */}
      <div>
        <p className="font-mono text-[11px] uppercase tracking-wider font-bold text-black/60 mb-2">
          Deliverables ({deliverables.length})
        </p>
        {deliverables.length > 0 && (
          <ul className="space-y-1.5 mb-3">
            {deliverables.map((d, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-2 px-3 py-2 bg-white border border-black/10"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <LinkIcon className="w-3 h-3 text-black/40 shrink-0" />
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-bold truncate hover:text-accent"
                  >
                    {d.label}
                  </a>
                  {d.kind && (
                    <span className="font-mono text-[10px] uppercase tracking-wider text-black/40 shrink-0">
                      {d.kind}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeDeliverable(i)}
                  disabled={savingDeliverables}
                  className="text-black/40 hover:text-red-700 disabled:opacity-30"
                  aria-label="Remove deliverable"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Label (e.g. Final cut)"
            className="flex-1 px-3 py-1.5 border border-black/15 bg-white text-sm"
          />
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://…"
            className="flex-1 px-3 py-1.5 border border-black/15 bg-white text-sm"
          />
          <select
            value={newKind}
            onChange={(e) => setNewKind(e.target.value as DeliverableItem['kind'])}
            className="px-2 py-1.5 border border-black/15 bg-white text-xs font-mono"
          >
            <option value="video">video</option>
            <option value="image">image</option>
            <option value="audio">audio</option>
            <option value="file">file</option>
            <option value="link">link</option>
          </select>
          <button
            type="button"
            onClick={addDeliverable}
            disabled={savingDeliverables}
            className="font-mono text-xs px-3 py-1.5 bg-black text-white hover:bg-accent hover:text-black disabled:opacity-30 inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-800 font-mono text-xs">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Session row — mark complete + payout entry
// ============================================================

function SessionRow({
  session,
  onChange,
}: {
  session: MediaSessionBooking;
  onChange: () => void;
}) {
  // Two distinct edit modes:
  //   - 'payout'  → mark a scheduled session complete + record payout dollars
  //   - 'details' → edit time/location/notes on a scheduled session (Phase E)
  const [editMode, setEditMode] = useState<null | 'payout' | 'details'>(null);
  const [payoutDollars, setPayoutDollars] = useState(
    session.engineer_payout_cents != null
      ? String(session.engineer_payout_cents / 100)
      : '',
  );

  // Detail-edit form state. Convert ISO timestamps to the browser's local
  // datetime-local format for the picker. Local-tz quirks: the input value
  // must be `YYYY-MM-DDTHH:MM` with NO seconds/timezone suffix.
  const toLocalInput = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const [editStarts, setEditStarts] = useState(toLocalInput(session.starts_at));
  const [editEnds, setEditEnds] = useState(toLocalInput(session.ends_at));
  const [editLocation, setEditLocation] = useState<'studio' | 'external'>(session.location);
  const [editExternalText, setEditExternalText] = useState(session.external_location_text ?? '');
  const [editNotes, setEditNotes] = useState(session.notes ?? '');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function cancelEdit() {
    setEditMode(null);
    setError(null);
    // Reset detail form to current row state in case user toggled back open
    setEditStarts(toLocalInput(session.starts_at));
    setEditEnds(toLocalInput(session.ends_at));
    setEditLocation(session.location);
    setEditExternalText(session.external_location_text ?? '');
    setEditNotes(session.notes ?? '');
  }

  async function complete() {
    const cents = Math.round((Number(payoutDollars) || 0) * 100);
    if (cents < 0) {
      setError('Payout must be ≥ 0');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/media/sessions/${session.id}/complete`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ engineer_payout_cents: cents }),
        },
      );
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Could not mark complete');
        setSubmitting(false);
        return;
      }
      setEditMode(null);
      onChange();
    } catch (e) {
      console.error('[admin-media-orders] complete error:', e);
      setError('Network error');
      setSubmitting(false);
    }
  }

  async function saveDetails() {
    if (editLocation === 'external' && editExternalText.trim().length < 3) {
      setError('External shoots need a location description');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // datetime-local inputs return browser-local strings without TZ.
      // Construct Dates and ship ISO so the server stores UTC consistently.
      const startsIso = new Date(editStarts).toISOString();
      const endsIso = new Date(editEnds).toISOString();
      const res = await fetch(`/api/admin/media/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          starts_at: startsIso,
          ends_at: endsIso,
          location: editLocation,
          external_location_text:
            editLocation === 'external' ? editExternalText.trim() : null,
          notes: editNotes.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Could not save changes');
        setSubmitting(false);
        return;
      }
      setEditMode(null);
      onChange();
    } catch (e) {
      console.error('[admin-media-orders] save details error:', e);
      setError('Network error');
      setSubmitting(false);
    }
  }

  const start = new Date(session.starts_at);
  const end = new Date(session.ends_at);

  return (
    <li className="flex items-start justify-between gap-3 px-3 py-2 bg-white border border-black/10">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-bold text-sm">
            {SESSION_KIND_LABELS[session.session_kind as MediaSessionKind]}
          </span>
          <span
            className={`font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 ${
              session.status === 'completed'
                ? 'bg-green-100 text-green-900'
                : session.status === 'cancelled'
                ? 'bg-red-100 text-red-900'
                : 'bg-blue-100 text-blue-900'
            }`}
          >
            {session.status}
          </span>
          {session.engineer_payout_cents != null && (
            <span className="font-mono text-[10px] text-black/50">
              · payout {formatCents(session.engineer_payout_cents)}
            </span>
          )}
        </div>
        <p className="font-mono text-[11px] text-black/50">
          <Clock className="w-3 h-3 inline mr-1" />
          {start.toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
          })}
          {' – '}
          {end.toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit',
          })}
          {' · '}
          {session.location === 'studio'
            ? 'Studio'
            : session.external_location_text || 'External'}
        </p>
        {editMode === 'payout' && (
          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono text-[11px] text-black/60">Payout $</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={payoutDollars}
              onChange={(e) => setPayoutDollars(e.target.value)}
              className="w-24 px-2 py-1 border border-black/15 bg-white text-sm"
            />
            <button
              type="button"
              onClick={complete}
              disabled={submitting}
              className="font-mono text-xs px-3 py-1 bg-black text-white hover:bg-accent hover:text-black disabled:opacity-30 inline-flex items-center gap-1"
            >
              <CheckCircle2 className="w-3 h-3" />
              {submitting ? 'Saving…' : 'Mark complete'}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="font-mono text-xs text-black/50 hover:text-black"
            >
              Cancel
            </button>
          </div>
        )}
        {editMode === 'details' && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 p-3 bg-black/[0.03] border border-black/10">
            <label className="text-xs">
              <span className="block font-mono text-[10px] uppercase text-black/50 mb-0.5">Starts</span>
              <input
                type="datetime-local"
                value={editStarts}
                onChange={(e) => setEditStarts(e.target.value)}
                className="w-full px-2 py-1 border border-black/15 bg-white text-sm"
              />
            </label>
            <label className="text-xs">
              <span className="block font-mono text-[10px] uppercase text-black/50 mb-0.5">Ends</span>
              <input
                type="datetime-local"
                value={editEnds}
                onChange={(e) => setEditEnds(e.target.value)}
                className="w-full px-2 py-1 border border-black/15 bg-white text-sm"
              />
            </label>
            <label className="text-xs">
              <span className="block font-mono text-[10px] uppercase text-black/50 mb-0.5">Location</span>
              <select
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value as 'studio' | 'external')}
                className="w-full px-2 py-1 border border-black/15 bg-white text-sm"
              >
                <option value="studio">studio</option>
                <option value="external">external</option>
              </select>
            </label>
            {editLocation === 'external' && (
              <label className="text-xs">
                <span className="block font-mono text-[10px] uppercase text-black/50 mb-0.5">Where</span>
                <input
                  type="text"
                  value={editExternalText}
                  onChange={(e) => setEditExternalText(e.target.value)}
                  className="w-full px-2 py-1 border border-black/15 bg-white text-sm"
                />
              </label>
            )}
            <label className="text-xs md:col-span-2">
              <span className="block font-mono text-[10px] uppercase text-black/50 mb-0.5">Notes</span>
              <textarea
                rows={2}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full px-2 py-1 border border-black/15 bg-white text-sm resize-y"
              />
            </label>
            <div className="md:col-span-2 flex items-center gap-2">
              <button
                type="button"
                onClick={saveDetails}
                disabled={submitting}
                className="font-mono text-xs px-3 py-1 bg-black text-white hover:bg-accent hover:text-black disabled:opacity-30 inline-flex items-center gap-1"
              >
                <Save className="w-3 h-3" />
                {submitting ? 'Saving…' : 'Save details'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="font-mono text-xs text-black/50 hover:text-black"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {error && (
          <p className="font-mono text-[11px] text-red-700 mt-1">{error}</p>
        )}
      </div>
      {editMode === null && session.status === 'scheduled' && (
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setEditMode('details')}
            className="font-mono text-[11px] text-black/60 hover:text-black inline-flex items-center gap-1"
            title="Edit time/location/notes"
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setEditMode('payout')}
            className="font-mono text-[11px] text-black/60 hover:text-black inline-flex items-center gap-1"
          >
            <CheckCircle2 className="w-3 h-3" />
            Complete
          </button>
        </div>
      )}
      {editMode === null && session.status === 'completed' && (
        <button
          type="button"
          onClick={() => setEditMode('payout')}
          className="font-mono text-[11px] text-black/40 hover:text-black inline-flex items-center gap-1 shrink-0"
          title="Edit payout"
        >
          <Pencil className="w-3 h-3" />
          Edit payout
        </button>
      )}
    </li>
  );
}

