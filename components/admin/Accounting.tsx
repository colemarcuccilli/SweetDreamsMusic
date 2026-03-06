'use client';

import { useState, useEffect, useMemo } from 'react';
import { DollarSign, TrendingUp, Calendar, Music, Filter, ChevronDown } from 'lucide-react';
import { formatCents } from '@/lib/utils';

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string;
  start_time: string;
  duration: number;
  total_amount: number;
  deposit_amount: number;
  remainder_amount: number;
  actual_deposit_paid: number | null;
  status: string;
  engineer_name: string | null;
  room: string | null;
  created_at: string;
}

interface BeatPurchase {
  id: string;
  beat_id: string;
  buyer_email: string;
  license_type: string;
  amount_paid: number;
  created_at: string;
  beats: { title: string; producer: string } | null;
}

type View = 'overview' | 'sessions' | 'beats';
type DatePreset = 'all' | '7d' | '30d' | '90d' | 'year' | 'custom';

function getDateRange(preset: DatePreset): { from: string; to: string } | null {
  if (preset === 'all') return null;
  const to = new Date();
  const from = new Date();
  if (preset === '7d') from.setDate(from.getDate() - 7);
  else if (preset === '30d') from.setDate(from.getDate() - 30);
  else if (preset === '90d') from.setDate(from.getDate() - 90);
  else if (preset === 'year') from.setFullYear(from.getFullYear() - 1);
  else return null;
  return { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] };
}

const LICENSE_LABELS: Record<string, string> = {
  mp3_lease: 'MP3 Lease',
  wav_lease: 'WAV Lease',
  unlimited: 'Unlimited',
  exclusive: 'Exclusive',
};

export default function Accounting() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [beatPurchases, setBeatPurchases] = useState<BeatPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('overview');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [engineerFilter, setEngineerFilter] = useState('all');
  const [producerFilter, setProducerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [datePreset, customFrom, customTo]);

  async function fetchData() {
    setLoading(true);
    const range = datePreset === 'custom'
      ? (customFrom ? { from: customFrom, to: customTo || new Date().toISOString().split('T')[0] } : null)
      : getDateRange(datePreset);

    const params = new URLSearchParams();
    if (range?.from) params.set('from', range.from);
    if (range?.to) params.set('to', range.to);

    const res = await fetch(`/api/admin/accounting?${params}`);
    const data = await res.json();
    setBookings(data.bookings || []);
    setBeatPurchases(data.beatPurchases || []);
    setLoading(false);
  }

  // Derived data
  const filteredBookings = useMemo(() => {
    let result = bookings;
    if (engineerFilter !== 'all') {
      result = result.filter((b) => (b.engineer_name || 'Unassigned') === engineerFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter((b) => b.status === statusFilter);
    }
    return result;
  }, [bookings, engineerFilter, statusFilter]);

  const filteredPurchases = useMemo(() => {
    if (producerFilter === 'all') return beatPurchases;
    return beatPurchases.filter((p) => (p.beats?.producer || 'Unknown') === producerFilter);
  }, [beatPurchases, producerFilter]);

  // Engineers list
  const engineers = useMemo(() => {
    const set = new Set(bookings.map((b) => b.engineer_name || 'Unassigned'));
    return Array.from(set).sort();
  }, [bookings]);

  // Producers list
  const producers = useMemo(() => {
    const set = new Set(beatPurchases.map((p) => p.beats?.producer || 'Unknown'));
    return Array.from(set).sort();
  }, [beatPurchases]);

  // Session stats
  const sessionStats = useMemo(() => {
    const completed = filteredBookings.filter((b) => b.status === 'completed');
    const confirmed = filteredBookings.filter((b) => ['confirmed', 'pending', 'pending_approval'].includes(b.status));
    const totalBooked = filteredBookings.reduce((s, b) => s + b.total_amount, 0);
    const depositsCollected = filteredBookings.reduce((s, b) => s + (b.actual_deposit_paid || 0), 0);
    const completedRevenue = completed.reduce((s, b) => s + b.total_amount, 0);
    const remainderOutstanding = confirmed.reduce((s, b) => s + b.remainder_amount, 0);
    const totalHours = filteredBookings.reduce((s, b) => s + b.duration, 0);
    return { total: filteredBookings.length, completed: completed.length, totalBooked, depositsCollected, completedRevenue, remainderOutstanding, totalHours };
  }, [filteredBookings]);

  // Beat stats
  const beatStats = useMemo(() => {
    const totalRevenue = filteredPurchases.reduce((s, p) => s + p.amount_paid, 0);
    const byLicense: Record<string, { count: number; revenue: number }> = {};
    filteredPurchases.forEach((p) => {
      if (!byLicense[p.license_type]) byLicense[p.license_type] = { count: 0, revenue: 0 };
      byLicense[p.license_type].count++;
      byLicense[p.license_type].revenue += p.amount_paid;
    });
    return { total: filteredPurchases.length, totalRevenue, byLicense };
  }, [filteredPurchases]);

  // Breakdowns
  const sessionsByEngineer = useMemo(() => {
    const map: Record<string, { count: number; revenue: number; hours: number; deposits: number }> = {};
    filteredBookings.forEach((b) => {
      const eng = b.engineer_name || 'Unassigned';
      if (!map[eng]) map[eng] = { count: 0, revenue: 0, hours: 0, deposits: 0 };
      map[eng].count++;
      map[eng].revenue += b.total_amount;
      map[eng].hours += b.duration;
      map[eng].deposits += (b.actual_deposit_paid || 0);
    });
    return Object.entries(map).sort((a, b) => b[1].revenue - a[1].revenue);
  }, [filteredBookings]);

  const sessionsByRoom = useMemo(() => {
    const map: Record<string, { count: number; revenue: number; hours: number }> = {};
    filteredBookings.forEach((b) => {
      const room = b.room || 'Unknown';
      if (!map[room]) map[room] = { count: 0, revenue: 0, hours: 0 };
      map[room].count++;
      map[room].revenue += b.total_amount;
      map[room].hours += b.duration;
    });
    return Object.entries(map).sort((a, b) => b[1].revenue - a[1].revenue);
  }, [filteredBookings]);

  const sessionsByStatus = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {};
    filteredBookings.forEach((b) => {
      if (!map[b.status]) map[b.status] = { count: 0, revenue: 0 };
      map[b.status].count++;
      map[b.status].revenue += b.total_amount;
    });
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count);
  }, [filteredBookings]);

  const sessionsByMonth = useMemo(() => {
    const map: Record<string, { count: number; revenue: number; hours: number }> = {};
    filteredBookings.forEach((b) => {
      const d = new Date(b.start_time);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { count: 0, revenue: 0, hours: 0 };
      map[key].count++;
      map[key].revenue += b.total_amount;
      map[key].hours += b.duration;
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredBookings]);

  const beatsByProducer = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {};
    filteredPurchases.forEach((p) => {
      const prod = p.beats?.producer || 'Unknown';
      if (!map[prod]) map[prod] = { count: 0, revenue: 0 };
      map[prod].count++;
      map[prod].revenue += p.amount_paid;
    });
    return Object.entries(map).sort((a, b) => b[1].revenue - a[1].revenue);
  }, [filteredPurchases]);

  const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    pending_approval: 'bg-orange-100 text-orange-800',
    confirmed: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-600',
  };

  const ROOM_LABELS: Record<string, string> = {
    studio_a: 'Studio A',
    studio_b: 'Studio B',
  };

  const views: { key: View; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'sessions', label: 'Sessions' },
    { key: 'beats', label: 'Beat Sales' },
  ];

  function toggleSection(key: string) {
    setExpandedSection(expandedSection === key ? null : key);
  }

  return (
    <div>
      {/* View Tabs + Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex gap-1">
          {views.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`font-mono text-xs font-bold uppercase tracking-wider px-4 py-2 transition-colors ${
                view === v.key ? 'bg-black text-white' : 'bg-black/5 text-black/50 hover:bg-black/10'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="w-4 h-4 text-black/30" />
          {(['all', '7d', '30d', '90d', 'year', 'custom'] as DatePreset[]).map((p) => (
            <button
              key={p}
              onClick={() => setDatePreset(p)}
              className={`font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 transition-colors ${
                datePreset === p ? 'bg-accent text-black' : 'bg-black/5 text-black/40 hover:bg-black/10'
              }`}
            >
              {p === 'all' ? 'All Time' : p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : p === 'year' ? '1 Year' : 'Custom'}
            </button>
          ))}
        </div>
      </div>

      {datePreset === 'custom' && (
        <div className="flex gap-3 mb-6 items-center">
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
            className="border border-black/20 px-3 py-2 font-mono text-xs focus:border-accent focus:outline-none" />
          <span className="font-mono text-xs text-black/40">to</span>
          <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
            className="border border-black/20 px-3 py-2 font-mono text-xs focus:border-accent focus:outline-none" />
        </div>
      )}

      {loading ? (
        <p className="font-mono text-sm text-black/40">Loading accounting data...</p>
      ) : (
        <>
          {/* ========= OVERVIEW ========= */}
          {view === 'overview' && (
            <div className="space-y-8">
              {/* Top-level stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={DollarSign} label="Total Revenue" value={formatCents(sessionStats.completedRevenue + beatStats.totalRevenue)} accent />
                <StatCard icon={Calendar} label="Session Revenue" value={formatCents(sessionStats.completedRevenue)} />
                <StatCard icon={Music} label="Beat Sales" value={formatCents(beatStats.totalRevenue)} />
                <StatCard icon={TrendingUp} label="Deposits Collected" value={formatCents(sessionStats.depositsCollected)} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Calendar} label="Total Sessions" value={String(sessionStats.total)} />
                <StatCard icon={Calendar} label="Completed" value={String(sessionStats.completed)} />
                <StatCard icon={Calendar} label="Total Hours" value={`${sessionStats.totalHours}hr`} />
                <StatCard icon={DollarSign} label="Remainder Due" value={formatCents(sessionStats.remainderOutstanding)} />
              </div>

              {/* Monthly breakdown */}
              {sessionsByMonth.length > 0 && (
                <BreakdownSection
                  title="Revenue by Month"
                  expanded={expandedSection === 'monthly'}
                  onToggle={() => toggleSection('monthly')}
                >
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-black/10">
                        <th className="text-left font-mono text-[10px] text-black/40 uppercase tracking-wider py-2">Month</th>
                        <th className="text-right font-mono text-[10px] text-black/40 uppercase tracking-wider py-2">Sessions</th>
                        <th className="text-right font-mono text-[10px] text-black/40 uppercase tracking-wider py-2">Hours</th>
                        <th className="text-right font-mono text-[10px] text-black/40 uppercase tracking-wider py-2">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionsByMonth.map(([month, data]) => (
                        <tr key={month} className="border-b border-black/5">
                          <td className="font-mono text-sm py-2">{formatMonth(month)}</td>
                          <td className="font-mono text-sm text-right">{data.count}</td>
                          <td className="font-mono text-sm text-right">{data.hours}hr</td>
                          <td className="font-mono text-sm font-bold text-right">{formatCents(data.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </BreakdownSection>
              )}

              {/* By engineer */}
              {sessionsByEngineer.length > 0 && (
                <BreakdownSection
                  title="Sessions by Engineer"
                  expanded={expandedSection === 'engineer'}
                  onToggle={() => toggleSection('engineer')}
                >
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-black/10">
                        <th className="text-left font-mono text-[10px] text-black/40 uppercase tracking-wider py-2">Engineer</th>
                        <th className="text-right font-mono text-[10px] text-black/40 uppercase tracking-wider py-2">Sessions</th>
                        <th className="text-right font-mono text-[10px] text-black/40 uppercase tracking-wider py-2">Hours</th>
                        <th className="text-right font-mono text-[10px] text-black/40 uppercase tracking-wider py-2">Deposits</th>
                        <th className="text-right font-mono text-[10px] text-black/40 uppercase tracking-wider py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionsByEngineer.map(([name, data]) => (
                        <tr key={name} className="border-b border-black/5">
                          <td className="font-mono text-sm font-semibold py-2">{name}</td>
                          <td className="font-mono text-sm text-right">{data.count}</td>
                          <td className="font-mono text-sm text-right">{data.hours}hr</td>
                          <td className="font-mono text-sm text-right text-black/50">{formatCents(data.deposits)}</td>
                          <td className="font-mono text-sm font-bold text-right">{formatCents(data.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </BreakdownSection>
              )}

              {/* By room */}
              {sessionsByRoom.length > 0 && (
                <BreakdownSection
                  title="Sessions by Studio"
                  expanded={expandedSection === 'room'}
                  onToggle={() => toggleSection('room')}
                >
                  {sessionsByRoom.map(([room, data]) => (
                    <div key={room} className="flex justify-between items-center py-2 border-b border-black/5">
                      <span className="font-mono text-sm font-semibold">{ROOM_LABELS[room] || room}</span>
                      <div className="flex gap-6 font-mono text-sm">
                        <span className="text-black/50">{data.count} sessions</span>
                        <span className="text-black/50">{data.hours}hr</span>
                        <span className="font-bold">{formatCents(data.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </BreakdownSection>
              )}

              {/* Beat sales by producer */}
              {beatsByProducer.length > 0 && (
                <BreakdownSection
                  title="Beat Sales by Producer"
                  expanded={expandedSection === 'producer'}
                  onToggle={() => toggleSection('producer')}
                >
                  {beatsByProducer.map(([name, data]) => (
                    <div key={name} className="flex justify-between items-center py-2 border-b border-black/5">
                      <span className="font-mono text-sm font-semibold">{name}</span>
                      <div className="flex gap-6 font-mono text-sm">
                        <span className="text-black/50">{data.count} sales</span>
                        <span className="font-bold">{formatCents(data.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </BreakdownSection>
              )}
            </div>
          )}

          {/* ========= SESSIONS DETAIL ========= */}
          {view === 'sessions' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <select value={engineerFilter} onChange={(e) => setEngineerFilter(e.target.value)}
                  className="border border-black/20 px-3 py-2 font-mono text-xs focus:border-accent focus:outline-none">
                  <option value="all">All Engineers</option>
                  {engineers.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-black/20 px-3 py-2 font-mono text-xs focus:border-accent focus:outline-none">
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <span className="font-mono text-xs text-black/40 self-center">
                  {filteredBookings.length} sessions · {formatCents(filteredBookings.reduce((s, b) => s + b.total_amount, 0))} total
                </span>
              </div>

              {/* Summary row */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <MiniStat label="Sessions" value={String(sessionStats.total)} />
                <MiniStat label="Completed" value={String(sessionStats.completed)} />
                <MiniStat label="Hours" value={`${sessionStats.totalHours}`} />
                <MiniStat label="Deposits" value={formatCents(sessionStats.depositsCollected)} />
                <MiniStat label="Remainder Due" value={formatCents(sessionStats.remainderOutstanding)} />
              </div>

              {/* Session list */}
              <div className="space-y-1">
                <div className="hidden md:grid grid-cols-12 gap-2 font-mono text-[10px] text-black/40 uppercase tracking-wider py-2 px-3 border-b border-black/10">
                  <div className="col-span-2">Date</div>
                  <div className="col-span-2">Client</div>
                  <div className="col-span-2">Engineer</div>
                  <div className="col-span-1">Room</div>
                  <div className="col-span-1">Hours</div>
                  <div className="col-span-1 text-right">Total</div>
                  <div className="col-span-1 text-right">Deposit</div>
                  <div className="col-span-1 text-right">Remainder</div>
                  <div className="col-span-1 text-right">Status</div>
                </div>
                {filteredBookings.map((b) => (
                  <div key={b.id} className="grid grid-cols-2 md:grid-cols-12 gap-2 font-mono text-xs py-3 px-3 border-b border-black/5 hover:bg-black/[0.02]">
                    <div className="col-span-2">
                      {new Date(b.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                    </div>
                    <div className="col-span-2 font-semibold truncate">{b.customer_name}</div>
                    <div className="col-span-2 text-black/60 truncate">{b.engineer_name || '—'}</div>
                    <div className="col-span-1 text-black/60">{ROOM_LABELS[b.room || ''] || b.room || '—'}</div>
                    <div className="col-span-1">{b.duration}hr</div>
                    <div className="col-span-1 text-right font-semibold">{formatCents(b.total_amount)}</div>
                    <div className="col-span-1 text-right text-black/50">{formatCents(b.actual_deposit_paid || 0)}</div>
                    <div className="col-span-1 text-right text-black/50">{formatCents(b.remainder_amount)}</div>
                    <div className="col-span-1 text-right">
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 ${STATUS_COLORS[b.status] || 'bg-black/5 text-black/50'}`}>
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))}
                {filteredBookings.length === 0 && (
                  <p className="font-mono text-sm text-black/30 text-center py-12">No sessions found</p>
                )}
              </div>
            </div>
          )}

          {/* ========= BEAT SALES DETAIL ========= */}
          {view === 'beats' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <select value={producerFilter} onChange={(e) => setProducerFilter(e.target.value)}
                  className="border border-black/20 px-3 py-2 font-mono text-xs focus:border-accent focus:outline-none">
                  <option value="all">All Producers</option>
                  {producers.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <span className="font-mono text-xs text-black/40 self-center">
                  {filteredPurchases.length} sales · {formatCents(beatStats.totalRevenue)} total
                </span>
              </div>

              {/* License breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(beatStats.byLicense).map(([type, data]) => (
                  <MiniStat key={type} label={LICENSE_LABELS[type] || type} value={`${data.count} · ${formatCents(data.revenue)}`} />
                ))}
                {Object.keys(beatStats.byLicense).length === 0 && (
                  <MiniStat label="Total Sales" value="0" />
                )}
              </div>

              {/* Purchase list */}
              <div className="space-y-1">
                <div className="hidden md:grid grid-cols-12 gap-2 font-mono text-[10px] text-black/40 uppercase tracking-wider py-2 px-3 border-b border-black/10">
                  <div className="col-span-2">Date</div>
                  <div className="col-span-3">Beat</div>
                  <div className="col-span-2">Producer</div>
                  <div className="col-span-2">Buyer</div>
                  <div className="col-span-1">License</div>
                  <div className="col-span-2 text-right">Amount</div>
                </div>
                {filteredPurchases.map((p) => (
                  <div key={p.id} className="grid grid-cols-2 md:grid-cols-12 gap-2 font-mono text-xs py-3 px-3 border-b border-black/5 hover:bg-black/[0.02]">
                    <div className="col-span-2">
                      {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                    </div>
                    <div className="col-span-3 font-semibold truncate">{p.beats?.title || '—'}</div>
                    <div className="col-span-2 text-black/60 truncate">{p.beats?.producer || '—'}</div>
                    <div className="col-span-2 text-black/60 truncate">{p.buyer_email}</div>
                    <div className="col-span-1">
                      <span className="text-[10px] font-bold uppercase bg-black/5 px-1.5 py-0.5">{LICENSE_LABELS[p.license_type] || p.license_type}</span>
                    </div>
                    <div className="col-span-2 text-right font-bold">{formatCents(p.amount_paid)}</div>
                  </div>
                ))}
                {filteredPurchases.length === 0 && (
                  <p className="font-mono text-sm text-black/30 text-center py-12">No beat sales found</p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Helper components

function StatCard({ icon: Icon, label, value, accent }: { icon: typeof DollarSign; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`border-2 p-4 ${accent ? 'border-accent' : 'border-black/10'}`}>
      <Icon className={`w-4 h-4 mb-2 ${accent ? 'text-accent' : 'text-black/30'}`} />
      <p className={`font-heading text-xl ${accent ? 'text-accent' : ''}`}>{value}</p>
      <p className="font-mono text-[10px] text-black/40 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-black/10 px-3 py-2">
      <p className="font-mono text-sm font-bold">{value}</p>
      <p className="font-mono text-[10px] text-black/40 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function BreakdownSection({ title, expanded, onToggle, children }: { title: string; expanded: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="border border-black/10">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 hover:bg-black/[0.02] transition-colors">
        <h3 className="font-mono text-sm font-bold uppercase tracking-wider">{title}</h3>
        <ChevronDown className={`w-4 h-4 text-black/30 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function formatMonth(key: string): string {
  const [year, month] = key.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
