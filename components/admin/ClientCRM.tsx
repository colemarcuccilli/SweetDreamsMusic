'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Copy, Check, ChevronDown, ChevronUp, ArrowUpDown, ExternalLink, Phone, Mail, User, FileText } from 'lucide-react';
import { formatCents } from '@/lib/utils';

interface Client {
  id: string;
  user_id: string;
  display_name: string;
  profile_picture_url: string | null;
  public_profile_slug: string | null;
  role: string;
  email: string | null;
  is_producer: boolean;
  producer_name: string | null;
  files_count: number;
  notes_count: number;
  session_count: number;
  total_revenue: number;
  last_session: string | null;
  phone: string | null;
  engineers: string[];
  outstanding_balance: number;
}

interface ClientBooking {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  artist_name: string | null;
  start_time: string;
  end_time: string;
  duration: number;
  room: string | null;
  total_amount: number;
  deposit_amount: number;
  remainder_amount: number;
  actual_deposit_paid: number | null;
  status: string;
  engineer_name: string | null;
  created_at: string;
  admin_notes: string | null;
}

type SortKey = 'display_name' | 'session_count' | 'total_revenue' | 'last_session' | 'outstanding_balance';
type SortDir = 'asc' | 'desc';

export default function ClientCRM() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('display_name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/library/clients?detailed=true')
      .then(r => r.json())
      .then(data => setClients(data.clients || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = clients;
    if (q) {
      list = clients.filter(c =>
        (c.display_name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.producer_name || '').toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      let av: string | number = 0;
      let bv: string | number = 0;
      if (sortKey === 'display_name') {
        av = (a.display_name || '').toLowerCase();
        bv = (b.display_name || '').toLowerCase();
      } else if (sortKey === 'session_count') {
        av = a.session_count; bv = b.session_count;
      } else if (sortKey === 'total_revenue') {
        av = a.total_revenue; bv = b.total_revenue;
      } else if (sortKey === 'last_session') {
        av = a.last_session || ''; bv = b.last_session || '';
      } else if (sortKey === 'outstanding_balance') {
        av = a.outstanding_balance; bv = b.outstanding_balance;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [clients, search, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'display_name' ? 'asc' : 'desc');
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 text-black/30" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  }

  if (loading) {
    return <p className="font-mono text-sm text-black/70">Loading clients...</p>;
  }

  const totalRevenue = clients.reduce((s, c) => s + c.total_revenue, 0);
  const totalSessions = clients.reduce((s, c) => s + c.session_count, 0);
  const totalOutstanding = clients.reduce((s, c) => s + c.outstanding_balance, 0);
  const activeClients = clients.filter(c => c.session_count > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-mono text-lg font-bold uppercase tracking-wider">Client CRM</h2>
          <p className="font-mono text-xs text-black/60 mt-1">{clients.length} clients total</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Active Clients" value={String(activeClients)} />
        <StatCard label="Total Sessions" value={String(totalSessions)} />
        <StatCard label="Total Revenue" value={formatCents(totalRevenue)} />
        <StatCard label="Outstanding" value={formatCents(totalOutstanding)} accent={totalOutstanding > 0} />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 font-mono text-sm border-2 border-black/10 focus:border-black/30 outline-none transition-colors"
        />
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block border-2 border-black/10 overflow-hidden">
        <table className="w-full font-mono text-xs">
          <thead>
            <tr className="bg-black/5 text-left">
              <SortHeader label="Name" col="display_name" onClick={toggleSort} icon={<SortIcon col="display_name" />} />
              <th className="px-3 py-2.5 font-semibold uppercase tracking-wider">Email</th>
              <th className="px-3 py-2.5 font-semibold uppercase tracking-wider">Phone</th>
              <SortHeader label="Sessions" col="session_count" onClick={toggleSort} icon={<SortIcon col="session_count" />} />
              <SortHeader label="Revenue" col="total_revenue" onClick={toggleSort} icon={<SortIcon col="total_revenue" />} />
              <SortHeader label="Last Visit" col="last_session" onClick={toggleSort} icon={<SortIcon col="last_session" />} />
              <th className="px-3 py-2.5 font-semibold uppercase tracking-wider">Engineers</th>
              <SortHeader label="Balance" col="outstanding_balance" onClick={toggleSort} icon={<SortIcon col="outstanding_balance" />} />
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <>
                <tr
                  key={c.id}
                  onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                  className={`border-t border-black/5 cursor-pointer transition-colors ${expandedId === c.id ? 'bg-accent/5' : 'hover:bg-black/[0.02]'}`}
                >
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      {c.profile_picture_url ? (
                        <img src={c.profile_picture_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center">
                          <User className="w-3 h-3 text-black/40" />
                        </div>
                      )}
                      <span className="font-semibold">{c.display_name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <CopyCell value={c.email} />
                  </td>
                  <td className="px-3 py-2.5">
                    <CopyCell value={c.phone} />
                  </td>
                  <td className="px-3 py-2.5 text-center">{c.session_count || '—'}</td>
                  <td className="px-3 py-2.5">{c.total_revenue ? formatCents(c.total_revenue) : '—'}</td>
                  <td className="px-3 py-2.5">
                    {c.last_session
                      ? new Date(c.last_session).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit', timeZone: 'UTC' })
                      : '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    {c.engineers.length > 0 ? c.engineers.join(', ') : '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    {c.outstanding_balance > 0 ? (
                      <span className="text-red-600 font-semibold">{formatCents(c.outstanding_balance)}</span>
                    ) : '—'}
                  </td>
                </tr>
                {expandedId === c.id && (
                  <tr key={`${c.id}-detail`}>
                    <td colSpan={8} className="p-0">
                      <ClientDetail client={c} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="font-mono text-xs text-black/60 p-6 text-center">No clients found</p>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filtered.map((c) => (
          <div key={c.id} className={`border-2 ${expandedId === c.id ? 'border-accent/40' : 'border-black/10'}`}>
            <button
              onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
              className="w-full text-left p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  {c.profile_picture_url ? (
                    <img src={c.profile_picture_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-black/40" />
                    </div>
                  )}
                  <div>
                    <p className="font-mono text-sm font-bold">{c.display_name || '—'}</p>
                    {c.email && <p className="font-mono text-[10px] text-black/60">{c.email}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold">{c.total_revenue ? formatCents(c.total_revenue) : '—'}</p>
                  <p className="font-mono text-[10px] text-black/60">{c.session_count} sessions</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mt-2 font-mono text-[10px] text-black/50">
                {c.phone && <span>Phone: {c.phone}</span>}
                {c.last_session && (
                  <span>Last: {new Date(c.last_session).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}</span>
                )}
                {c.outstanding_balance > 0 && (
                  <span className="text-red-600 font-semibold">Owes: {formatCents(c.outstanding_balance)}</span>
                )}
              </div>
            </button>
            {expandedId === c.id && (
              <div className="border-t border-black/10">
                <ClientDetail client={c} />
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="font-mono text-xs text-black/60 border border-black/10 p-6 text-center">No clients found</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="border-2 border-black/10 p-3">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-black/50">{label}</p>
      <p className={`font-mono text-lg font-bold mt-0.5 ${accent ? 'text-red-600' : ''}`}>{value}</p>
    </div>
  );
}

function SortHeader({ label, col, onClick, icon }: { label: string; col: SortKey; onClick: (col: SortKey) => void; icon: React.ReactNode }) {
  return (
    <th
      className="px-3 py-2.5 font-semibold uppercase tracking-wider cursor-pointer hover:bg-black/5 transition-colors select-none"
      onClick={() => onClick(col)}
    >
      <div className="flex items-center gap-1">
        {label}
        {icon}
      </div>
    </th>
  );
}

function CopyCell({ value }: { value: string | null }) {
  const [copied, setCopied] = useState(false);

  if (!value) return <span className="text-black/30">—</span>;

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(value!);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={handleCopy}
      className="group flex items-center gap-1 hover:text-black transition-colors text-left"
      title="Click to copy"
    >
      <span className="truncate max-w-[160px]">{value}</span>
      {copied ? (
        <Check className="w-3 h-3 text-green-600 shrink-0" />
      ) : (
        <Copy className="w-3 h-3 text-black/20 group-hover:text-black/50 shrink-0" />
      )}
    </button>
  );
}

function ClientDetail({ client }: { client: Client }) {
  const [bookings, setBookings] = useState<ClientBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [note, setNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [noteSuccess, setNoteSuccess] = useState(false);

  useEffect(() => {
    if (!client.email) {
      setLoadingBookings(false);
      return;
    }
    fetch(`/api/admin/client-bookings?email=${encodeURIComponent(client.email)}`)
      .then(r => r.json())
      .then(data => setBookings(data.bookings || []))
      .catch(() => {})
      .finally(() => setLoadingBookings(false));
  }, [client.email]);

  const totalPaid = bookings.reduce((s, b) => {
    if (['confirmed', 'completed', 'approved'].includes(b.status)) {
      return s + (b.total_amount || 0);
    }
    return s;
  }, 0);
  const depositsCollected = bookings.reduce((s, b) => s + (b.actual_deposit_paid || b.deposit_amount || 0), 0);
  const outstanding = bookings.reduce((s, b) => s + ((b.remainder_amount || 0) > 0 ? b.remainder_amount : 0), 0);

  async function addNote() {
    if (!note.trim() || !client.user_id) return;
    setAddingNote(true);
    try {
      const res = await fetch('/api/admin/library/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: client.user_id, content: note.trim() }),
      });
      if (res.ok) {
        setNote('');
        setNoteSuccess(true);
        setTimeout(() => setNoteSuccess(false), 2000);
      }
    } catch {
      // silent
    } finally {
      setAddingNote(false);
    }
  }

  return (
    <div className="bg-black/[0.02] p-4 sm:p-5 space-y-5">
      {/* Contact Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-black/50">Contact</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-black/40" />
              <span className="font-mono text-xs font-semibold">{client.display_name}</span>
              {client.is_producer && client.producer_name && (
                <span className="font-mono text-[10px] bg-accent/20 text-amber-700 px-1.5 py-0.5 font-bold uppercase">Producer</span>
              )}
            </div>
            {client.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-black/40" />
                <CopyCell value={client.email} />
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-black/40" />
                <CopyCell value={client.phone} />
              </div>
            )}
            {client.public_profile_slug && (
              <div className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5 text-black/40" />
                <a
                  href={`/u/${client.public_profile_slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-accent hover:underline"
                >
                  Profile
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-black/50">Financial</p>
          <div className="grid grid-cols-3 gap-2 font-mono text-xs">
            <div>
              <p className="text-[10px] text-black/50">Paid</p>
              <p className="font-semibold">{formatCents(totalPaid)}</p>
            </div>
            <div>
              <p className="text-[10px] text-black/50">Deposits</p>
              <p className="font-semibold">{formatCents(depositsCollected)}</p>
            </div>
            <div>
              <p className="text-[10px] text-black/50">Outstanding</p>
              <p className={`font-semibold ${outstanding > 0 ? 'text-red-600' : ''}`}>
                {formatCents(outstanding)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px] text-black/50 mt-1">
            <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {client.files_count} files</span>
            <span>{client.notes_count} notes</span>
          </div>
        </div>
      </div>

      {/* Session History */}
      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-black/50 mb-2">
          Session History ({bookings.length})
        </p>
        {loadingBookings ? (
          <p className="font-mono text-xs text-black/40">Loading sessions...</p>
        ) : bookings.length === 0 ? (
          <p className="font-mono text-xs text-black/40">No sessions found</p>
        ) : (
          <div className="border border-black/10 overflow-x-auto">
            <table className="w-full font-mono text-[11px]">
              <thead>
                <tr className="bg-black/5 text-left">
                  <th className="px-2 py-1.5 font-semibold uppercase tracking-wider">Date</th>
                  <th className="px-2 py-1.5 font-semibold uppercase tracking-wider">Room</th>
                  <th className="px-2 py-1.5 font-semibold uppercase tracking-wider">Duration</th>
                  <th className="px-2 py-1.5 font-semibold uppercase tracking-wider">Engineer</th>
                  <th className="px-2 py-1.5 font-semibold uppercase tracking-wider">Status</th>
                  <th className="px-2 py-1.5 font-semibold uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const d = new Date(b.start_time);
                  return (
                    <tr key={b.id} className="border-t border-black/5">
                      <td className="px-2 py-1.5">
                        {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit', timeZone: 'UTC' })}
                        <span className="text-black/40 ml-1">
                          {d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })}
                        </span>
                      </td>
                      <td className="px-2 py-1.5">
                        {b.room === 'studio_a' ? 'Studio A' : b.room === 'studio_b' ? 'Studio B' : b.room || '—'}
                      </td>
                      <td className="px-2 py-1.5">{b.duration}hr</td>
                      <td className="px-2 py-1.5">{b.engineer_name || '—'}</td>
                      <td className="px-2 py-1.5">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="px-2 py-1.5 text-right font-semibold">{formatCents(b.total_amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Note */}
      <div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-black/50 mb-2">
          Quick Note
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a note about this client..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addNote()}
            className="flex-1 font-mono text-xs px-3 py-2 border border-black/10 focus:border-black/30 outline-none transition-colors"
          />
          <button
            onClick={addNote}
            disabled={!note.trim() || addingNote}
            className="font-mono text-xs font-bold uppercase tracking-wider bg-black text-white px-4 py-2 hover:bg-black/80 disabled:opacity-50 transition-colors"
          >
            {noteSuccess ? 'Saved!' : addingNote ? '...' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    confirmed: 'bg-accent/20 text-amber-700',
    completed: 'bg-green-100 text-green-700',
    pending: 'bg-blue-100 text-blue-700',
    pending_deposit: 'bg-blue-100 text-blue-700',
    approved: 'bg-accent/20 text-amber-700',
    cancelled: 'bg-red-100 text-red-500',
  };
  const label = status === 'pending_deposit' ? 'Pending' : status;
  return (
    <span className={`font-bold uppercase text-[10px] px-1.5 py-0.5 ${styles[status] || 'bg-black/5 text-black/70'}`}>
      {label}
    </span>
  );
}
