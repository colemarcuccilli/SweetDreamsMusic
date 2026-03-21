'use client';

import { useState, useEffect, useMemo } from 'react';
import { DollarSign, TrendingUp, Calendar, Filter } from 'lucide-react';
import { formatCents } from '@/lib/utils';
import { ENGINEER_SESSION_SPLIT, MEDIA_SELLER_COMMISSION } from '@/lib/constants';

const ENGINEER_SPLIT = ENGINEER_SESSION_SPLIT;
const MEDIA_COMMISSION = MEDIA_SELLER_COMMISSION;

interface Booking {
  id: string;
  customer_name: string;
  start_time: string;
  duration: number;
  total_amount: number;
  deposit_amount: number;
  remainder_amount: number;
  actual_deposit_paid: number | null;
  status: string;
  room: string | null;
  requested_engineer: string | null;
  engineer_name: string | null;
  claimed_at: string | null;
  created_at: string;
}

interface MediaSale {
  id: string;
  description: string;
  amount: number;
  created_at: string;
}

const ROOM_LABELS: Record<string, string> = {
  studio_a: 'Studio A',
  studio_b: 'Studio B',
};

type DatePreset = 'thisMonth' | 'lastMonth' | 'month' | '30d' | '90d' | 'custom';

function getMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  // Show last 12 months
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    options.push({ value, label });
  }
  return options;
}

function getDateRange(preset: DatePreset, selectedMonth: string): { from: string; to: string } | null {
  const now = new Date();
  if (preset === 'thisMonth') {
    const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const to = now.toISOString().split('T')[0];
    return { from, to };
  }
  if (preset === 'lastMonth') {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const to = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
    return { from, to };
  }
  if (preset === 'month' && selectedMonth) {
    const [y, m] = selectedMonth.split('-').map(Number);
    const from = `${y}-${String(m).padStart(2, '0')}-01`;
    const last = new Date(y, m, 0);
    const to = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
    return { from, to };
  }
  if (preset === '30d') {
    const from = new Date(now);
    from.setDate(from.getDate() - 30);
    return { from: from.toISOString().split('T')[0], to: now.toISOString().split('T')[0] };
  }
  if (preset === '90d') {
    const from = new Date(now);
    from.setDate(from.getDate() - 90);
    return { from: from.toISOString().split('T')[0], to: now.toISOString().split('T')[0] };
  }
  return null;
}

export default function EngineerAccounting() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [mediaSales, setMediaSales] = useState<MediaSale[]>([]);
  const [engineerName, setEngineerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [datePreset, setDatePreset] = useState<DatePreset>('thisMonth');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const monthOptions = useMemo(() => getMonthOptions(), []);

  useEffect(() => {
    fetchData();
  }, [datePreset, selectedMonth, customFrom, customTo]);

  async function fetchData() {
    setLoading(true);
    const range = datePreset === 'custom'
      ? (customFrom ? { from: customFrom, to: customTo || new Date().toISOString().split('T')[0] } : null)
      : getDateRange(datePreset, selectedMonth);

    const params = new URLSearchParams();
    if (range?.from) params.set('from', range.from);
    if (range?.to) params.set('to', range.to);

    const res = await fetch(`/api/engineer/accounting?${params}`);
    const data = await res.json();
    setBookings(data.bookings || []);
    setMediaSales(data.mediaSales || []);
    setEngineerName(data.engineerName || '');
    setLoading(false);
  }

  const invited = useMemo(() =>
    bookings.filter((b) => b.requested_engineer === engineerName),
  [bookings, engineerName]);

  const claimed = useMemo(() =>
    bookings.filter((b) => b.requested_engineer !== engineerName),
  [bookings, engineerName]);

  const completed = useMemo(() =>
    bookings.filter((b) => b.status === 'completed'),
  [bookings]);

  const sessionRevenue = useMemo(() =>
    completed.reduce((s, b) => s + b.total_amount, 0),
  [completed]);

  const engineerSessionPay = Math.round(sessionRevenue * ENGINEER_SPLIT);

  const totalDeposits = useMemo(() =>
    bookings.reduce((s, b) => s + (b.actual_deposit_paid || 0), 0),
  [bookings]);

  const mediaTotal = useMemo(() =>
    mediaSales.reduce((s, m) => s + m.amount, 0),
  [mediaSales]);
  const mediaCommission = Math.round(mediaTotal * MEDIA_COMMISSION);

  const totalHours = useMemo(() =>
    bookings.reduce((s, b) => s + b.duration, 0),
  [bookings]);

  const presets: { key: DatePreset; label: string }[] = [
    { key: 'thisMonth', label: 'This Month' },
    { key: 'lastMonth', label: 'Last Month' },
    { key: 'month', label: 'Pick Month' },
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '90 Days' },
    { key: 'custom', label: 'Custom' },
  ];

  return (
    <div className="space-y-8">
      {/* Date Filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="w-4 h-4 text-black/30" />
        {presets.map((p) => (
          <button
            key={p.key}
            onClick={() => setDatePreset(p.key)}
            className={`font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 transition-colors ${
              datePreset === p.key ? 'bg-accent text-black' : 'bg-black/5 text-black/40 hover:bg-black/10'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {datePreset === 'month' && (
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border border-black/20 px-3 py-2 font-mono text-xs focus:border-accent focus:outline-none"
        >
          <option value="">Select a month...</option>
          {monthOptions.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      )}

      {datePreset === 'custom' && (
        <div className="flex gap-3 items-center">
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
            className="border border-black/20 px-3 py-2 font-mono text-xs focus:border-accent focus:outline-none" />
          <span className="font-mono text-xs text-black/40">to</span>
          <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
            className="border border-black/20 px-3 py-2 font-mono text-xs focus:border-accent focus:outline-none" />
        </div>
      )}

      {loading ? (
        <p className="font-mono text-sm text-black/40">Loading accounting...</p>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={DollarSign} label="Your Earnings (60%)" value={formatCents(engineerSessionPay)} accent />
            <StatCard icon={TrendingUp} label="Total Session Revenue" value={formatCents(sessionRevenue)} />
            <StatCard icon={Calendar} label="Total Sessions" value={String(bookings.length)} />
            <StatCard icon={Calendar} label="Total Hours" value={`${totalHours}hr`} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={DollarSign} label="Deposits Collected" value={formatCents(totalDeposits)} />
            <StatCard icon={DollarSign} label="Completed Sessions" value={String(completed.length)} />
            <StatCard icon={TrendingUp} label="Media Commission (15%)" value={formatCents(mediaCommission)} />
            <StatCard icon={DollarSign} label="Total Payout" value={formatCents(engineerSessionPay + mediaCommission)} accent />
          </div>

          {/* Split Explanation */}
          <div className="border border-black/10 p-4">
            <p className="font-mono text-xs text-black/50">
              <strong className="text-black">Revenue Split:</strong> You earn 60% of session revenue. Business retains 40%.
              Media sales you bring in earn a 15% commission.
            </p>
          </div>

          {/* Sessions I Was Requested For (Invited) */}
          <div>
            <h3 className="font-mono text-sm font-semibold uppercase tracking-wider mb-4">
              Sessions Invited ({invited.length})
            </h3>
            {invited.length === 0 ? (
              <p className="font-mono text-xs text-black/30 border border-black/10 p-6 text-center">
                No invited sessions yet
              </p>
            ) : (
              <SessionTable sessions={invited} />
            )}
          </div>

          {/* Sessions I Claimed */}
          <div>
            <h3 className="font-mono text-sm font-semibold uppercase tracking-wider mb-4">
              Sessions Claimed ({claimed.length})
            </h3>
            {claimed.length === 0 ? (
              <p className="font-mono text-xs text-black/30 border border-black/10 p-6 text-center">
                No claimed sessions yet
              </p>
            ) : (
              <SessionTable sessions={claimed} />
            )}
          </div>

          {/* Media Sales */}
          {mediaSales.length > 0 && (
            <div>
              <h3 className="font-mono text-sm font-semibold uppercase tracking-wider mb-4">
                Media Sales ({mediaSales.length})
              </h3>
              <div className="space-y-1">
                {mediaSales.map((sale) => (
                  <div key={sale.id} className="flex justify-between items-center py-3 px-3 border-b border-black/5 font-mono text-xs">
                    <div>
                      <span className="font-semibold">{sale.description}</span>
                      <span className="text-black/40 ml-3">
                        {new Date(sale.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-black/50">{formatCents(sale.amount)}</span>
                      <span className="font-bold ml-3 text-accent">{formatCents(Math.round(sale.amount * MEDIA_COMMISSION))}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SessionTable({ sessions }: { sessions: Booking[] }) {
  const STATUS_COLORS: Record<string, string> = {
    confirmed: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-600',
    pending: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="space-y-1">
      <div className="hidden md:grid grid-cols-12 gap-2 font-mono text-[10px] text-black/40 uppercase tracking-wider py-2 px-3 border-b border-black/10">
        <div className="col-span-2">Date</div>
        <div className="col-span-2">Client</div>
        <div className="col-span-1">Room</div>
        <div className="col-span-1">Hours</div>
        <div className="col-span-2 text-right">Total</div>
        <div className="col-span-2 text-right">Your 60%</div>
        <div className="col-span-2 text-right">Status</div>
      </div>
      {sessions.map((b) => (
        <div key={b.id} className="grid grid-cols-2 md:grid-cols-12 gap-2 font-mono text-xs py-3 px-3 border-b border-black/5 hover:bg-black/[0.02]">
          <div className="col-span-2">
            {new Date(b.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit', timeZone: 'UTC' })}
          </div>
          <div className="col-span-2 font-semibold truncate">{b.customer_name}</div>
          <div className="col-span-1 text-black/60">{ROOM_LABELS[b.room || ''] || '—'}</div>
          <div className="col-span-1">{b.duration}hr</div>
          <div className="col-span-2 text-right">{formatCents(b.total_amount)}</div>
          <div className="col-span-2 text-right font-bold text-accent">{formatCents(Math.round(b.total_amount * 0.6))}</div>
          <div className="col-span-2 text-right">
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 ${STATUS_COLORS[b.status] || 'bg-black/5 text-black/50'}`}>
              {b.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: typeof DollarSign; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`border-2 p-4 ${accent ? 'border-accent' : 'border-black/10'}`}>
      <Icon className={`w-4 h-4 mb-2 ${accent ? 'text-accent' : 'text-black/30'}`} />
      <p className={`font-heading text-xl ${accent ? 'text-accent' : ''}`}>{value}</p>
      <p className="font-mono text-[10px] text-black/40 uppercase tracking-wider">{label}</p>
    </div>
  );
}
