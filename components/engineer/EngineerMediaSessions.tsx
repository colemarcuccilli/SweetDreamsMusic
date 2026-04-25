'use client';

// components/engineer/EngineerMediaSessions.tsx
//
// Engineer-side view of their assigned media sessions. Read-only — the
// engineer doesn't reschedule or cancel from here (admin owns those
// transitions). Sessions are split into upcoming + past with status
// + payout visibility on completed rows.
//
// Why a dedicated tab vs. cramming into "My Sessions": studio bookings
// (via /book) and media sessions (via /dashboard/media) live in different
// tables with different lifecycles. Mixing them in one calendar would
// require a unified abstraction we don't have yet. Two tabs keeps each
// surface's mental model intact.

import { useEffect, useState } from 'react';
import { Clock, MapPin, FileText, DollarSign, Inbox } from 'lucide-react';
import { formatCents } from '@/lib/utils';
import { SESSION_KIND_LABELS, type MediaSessionKind } from '@/lib/media-scheduling';

interface SessionRow {
  id: string;
  parent_booking_id: string;
  starts_at: string;
  ends_at: string;
  location: string;
  external_location_text: string | null;
  session_kind: string;
  status: string;
  notes: string | null;
  engineer_payout_cents: number | null;
  engineer_payout_paid_at: string | null;
}

interface ParentRow {
  id: string;
  offering_id: string;
  user_id: string;
  band_id: string | null;
}

interface OfferingRow {
  id: string;
  title: string;
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

export default function EngineerMediaSessions() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [parents, setParents] = useState<ParentRow[]>([]);
  const [offerings, setOfferings] = useState<OfferingRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [bands, setBands] = useState<BandRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/engineer/media-sessions', { cache: 'no-store' });
        const data = await res.json();
        if (!cancelled && res.ok) {
          setSessions(data.sessions || []);
          setParents(data.parents || []);
          setOfferings(data.offerings || []);
          setProfiles(data.profiles || []);
          setBands(data.bands || []);
        }
      } catch (e) {
        console.error('[engineer-media-sessions] fetch error:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const parentMap = new Map(parents.map((p) => [p.id, p]));
  const offeringMap = new Map(offerings.map((o) => [o.id, o]));
  const profileMap = new Map(profiles.map((p) => [p.user_id, p]));
  const bandMap = new Map(bands.map((b) => [b.id, b]));

  const now = Date.now();
  const upcoming = sessions.filter(
    (s) => new Date(s.starts_at).getTime() >= now && s.status !== 'cancelled' && s.status !== 'completed',
  );
  const past = sessions.filter(
    (s) => new Date(s.starts_at).getTime() < now || s.status === 'completed' || s.status === 'cancelled',
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-1">Media Sessions</h2>
        <p className="font-mono text-xs text-black/50">
          Shoots and media work assigned to you. Reschedules + cancels go through admin.
        </p>
      </div>

      {loading ? (
        <p className="font-mono text-sm text-black/50">Loading…</p>
      ) : sessions.length === 0 ? (
        <div className="border-2 border-dashed border-black/10 p-8 text-center">
          <Inbox className="w-8 h-8 text-black/30 mx-auto mb-3" />
          <p className="font-mono text-sm text-black/60">
            No media sessions assigned yet.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <Section title="Upcoming">
              {upcoming.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  parent={parentMap.get(s.parent_booking_id)}
                  offeringMap={offeringMap}
                  profileMap={profileMap}
                  bandMap={bandMap}
                />
              ))}
            </Section>
          )}

          {past.length > 0 && (
            <Section title={`Past (${past.length})`}>
              {past.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  parent={parentMap.get(s.parent_booking_id)}
                  offeringMap={offeringMap}
                  profileMap={profileMap}
                  bandMap={bandMap}
                />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-wider font-bold text-black/60 mb-2">
        {title}
      </p>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

function SessionCard({
  session,
  parent,
  offeringMap,
  profileMap,
  bandMap,
}: {
  session: SessionRow;
  parent: ParentRow | undefined;
  offeringMap: Map<string, OfferingRow>;
  profileMap: Map<string, ProfileRow>;
  bandMap: Map<string, BandRow>;
}) {
  const offering = parent ? offeringMap.get(parent.offering_id) : undefined;
  const buyer = parent ? profileMap.get(parent.user_id) : undefined;
  const buyerLabel =
    buyer?.full_name || buyer?.display_name || buyer?.email || 'Buyer';
  const bandLabel = parent?.band_id ? bandMap.get(parent.band_id)?.display_name : null;

  const start = new Date(session.starts_at);
  const end = new Date(session.ends_at);

  return (
    <li className="border-2 border-black/10 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-bold">
          {SESSION_KIND_LABELS[session.session_kind as MediaSessionKind] || session.session_kind}
        </span>
        <span
          className={`font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 ${
            session.status === 'completed'
              ? 'bg-green-100 text-green-900'
              : session.status === 'cancelled'
              ? 'bg-red-100 text-red-900'
              : session.status === 'in_progress'
              ? 'bg-yellow-100 text-yellow-900'
              : 'bg-blue-100 text-blue-900'
          }`}
        >
          {session.status}
        </span>
      </div>
      <p className="font-mono text-sm text-black/70 mb-2">
        {offering?.title || 'Media order'} · for {bandLabel || buyerLabel}
      </p>
      <div className="font-mono text-[11px] text-black/50 space-y-0.5">
        <p className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {start.toLocaleString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit',
          })}
          {' – '}
          {end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </p>
        <p className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {session.location === 'studio'
            ? 'Sweet Dreams Studio'
            : session.external_location_text || 'External (TBD)'}
        </p>
        {session.notes && (
          <p className="flex items-start gap-1 mt-1.5 text-black/60">
            <FileText className="w-3 h-3 mt-0.5 shrink-0" />
            <span className="italic">&ldquo;{session.notes}&rdquo;</span>
          </p>
        )}
        {session.status === 'completed' && session.engineer_payout_cents != null && (
          <p className="flex items-center gap-1 mt-2 text-black/70 font-bold">
            <DollarSign className="w-3 h-3" />
            Payout: {formatCents(session.engineer_payout_cents)}
            {session.engineer_payout_paid_at && (
              <span className="font-normal text-black/50 ml-1">
                · recorded {new Date(session.engineer_payout_paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </p>
        )}
      </div>
    </li>
  );
}
