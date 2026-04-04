'use client';

import { useState, useEffect, useMemo } from 'react';
import { DollarSign, TrendingUp, Calendar, Music, Users, Filter, ChevronDown } from 'lucide-react';
import { formatCents } from '@/lib/utils';
import { PRODUCER_COMMISSION, PLATFORM_COMMISSION, ENGINEER_SESSION_SPLIT, BUSINESS_SESSION_SPLIT, MEDIA_SELLER_COMMISSION, MEDIA_BUSINESS_CUT, MEDIA_WORKER_TOTAL } from '@/lib/constants';

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

type View = 'overview' | 'payroll' | 'sessions' | 'beats' | 'media';
type DatePreset = 'thisMonth' | 'lastMonth' | 'month' | '30d' | '90d' | 'year' | 'custom';

function getMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    options.push({ value, label });
  }
  return options;
}

function getDateRange(preset: DatePreset, selectedMonth?: string): { from: string; to: string } | null {
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
    const from = new Date(now); from.setDate(from.getDate() - 30);
    return { from: from.toISOString().split('T')[0], to: now.toISOString().split('T')[0] };
  }
  if (preset === '90d') {
    const from = new Date(now); from.setDate(from.getDate() - 90);
    return { from: from.toISOString().split('T')[0], to: now.toISOString().split('T')[0] };
  }
  if (preset === 'year') {
    const from = new Date(now); from.setFullYear(from.getFullYear() - 1);
    return { from: from.toISOString().split('T')[0], to: now.toISOString().split('T')[0] };
  }
  return null;
}

const LICENSE_LABELS: Record<string, string> = {
  mp3_lease: 'MP3 Lease',
  wav_lease: 'WAV Lease',
  trackout_lease: 'Trackout Lease',
  unlimited: 'Unlimited',
  exclusive: 'Exclusive',
};

export default function Accounting() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [beatPurchases, setBeatPurchases] = useState<BeatPurchase[]>([]);
  const [mediaSales, setMediaSales] = useState<{ id: string; description: string; amount: number; sale_type: string; sold_by: string | null; filmed_by: string | null; edited_by: string | null; client_name: string | null; notes: string | null; created_at: string }[]>([]);
  const [cancelledBookings, setCancelledBookings] = useState<{ id: string; customer_name: string; start_time: string; total_amount: number; deposit_amount: number; actual_deposit_paid: number | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('overview');
  const [datePreset, setDatePreset] = useState<DatePreset>('thisMonth');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [engineerFilter, setEngineerFilter] = useState('all');
  const [producerFilter, setProducerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Payout tracking
  const [payouts, setPayouts] = useState<{ id: string; person_name: string; amount: number; method: string; note: string | null; created_at: string }[]>([]);
  const [showPayoutForm, setShowPayoutForm] = useState<string | null>(null); // person name
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('cash');
  const [payoutNote, setPayoutNote] = useState('');
  const [recordingPayout, setRecordingPayout] = useState(false);

  const monthOptions = getMonthOptions();

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

    const [accountingRes, payoutsRes] = await Promise.all([
      fetch(`/api/admin/accounting?${params}`),
      fetch('/api/admin/payouts'),
    ]);
    const data = await accountingRes.json();
    const payoutsData = await payoutsRes.json();
    setBookings(data.bookings || []);
    setBeatPurchases(data.beatPurchases || []);
    setMediaSales(data.mediaSales || []);
    setCancelledBookings(data.cancelledBookings || []);
    setPayouts(payoutsData.payouts || []);
    setLoading(false);
  }

  // Payouts by person
  const payoutsByPerson = useMemo(() => {
    const map: Record<string, number> = {};
    payouts.forEach(p => {
      map[p.person_name] = (map[p.person_name] || 0) + p.amount;
    });
    return map;
  }, [payouts]);

  async function recordPayout(personName: string) {
    if (!payoutAmount) return;
    setRecordingPayout(true);
    const res = await fetch('/api/admin/payouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personName, amount: parseFloat(payoutAmount), method: payoutMethod, note: payoutNote || null }),
    });
    const data = await res.json();
    if (data.success) {
      setPayouts(prev => [data.payout, ...prev]);
      setShowPayoutForm(null);
      setPayoutAmount('');
      setPayoutNote('');
    } else {
      alert(`Failed: ${data.error}`);
    }
    setRecordingPayout(false);
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
    const platformCut = Math.round(totalRevenue * PLATFORM_COMMISSION);
    const producerCut = Math.round(totalRevenue * PRODUCER_COMMISSION);
    return { total: filteredPurchases.length, totalRevenue, platformCut, producerCut, byLicense };
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
    const map: Record<string, { count: number; revenue: number; producerCut: number; platformCut: number }> = {};
    filteredPurchases.forEach((p) => {
      const prod = p.beats?.producer || 'Unknown';
      if (!map[prod]) map[prod] = { count: 0, revenue: 0, producerCut: 0, platformCut: 0 };
      map[prod].count++;
      map[prod].revenue += p.amount_paid;
      map[prod].producerCut += Math.round(p.amount_paid * PRODUCER_COMMISSION);
      map[prod].platformCut += Math.round(p.amount_paid * PLATFORM_COMMISSION);
    });
    return Object.entries(map).sort((a, b) => b[1].revenue - a[1].revenue);
  }, [filteredPurchases]);

  // Media stats
  const mediaStats = useMemo(() => {
    const totalRevenue = mediaSales.reduce((s, m) => s + m.amount, 0);
    const totalSellerCommissions = mediaSales.reduce((s, m) => s + (m.sold_by ? Math.round(m.amount * MEDIA_SELLER_COMMISSION) : 0), 0);
    // Workers split 50%: if both filmed_by and edited_by exist, each gets 25%. If only one, they get 50%.
    const totalFilmerPay = mediaSales.reduce((s, m) => {
      if (!m.filmed_by) return s;
      const workerCount = (m.filmed_by ? 1 : 0) + (m.edited_by ? 1 : 0);
      return s + Math.round(m.amount * MEDIA_WORKER_TOTAL / workerCount);
    }, 0);
    const totalEditorPay = mediaSales.reduce((s, m) => {
      if (!m.edited_by) return s;
      const workerCount = (m.filmed_by ? 1 : 0) + (m.edited_by ? 1 : 0);
      return s + Math.round(m.amount * MEDIA_WORKER_TOTAL / workerCount);
    }, 0);
    const totalWorkerPay = totalFilmerPay + totalEditorPay;
    const totalPayouts = totalSellerCommissions + totalWorkerPay;
    const businessRevenue = Math.round(totalRevenue * MEDIA_BUSINESS_CUT);

    const byType: Record<string, { count: number; revenue: number }> = {};
    mediaSales.forEach(m => {
      const type = m.sale_type || 'other';
      if (!byType[type]) byType[type] = { count: 0, revenue: 0 };
      byType[type].count++;
      byType[type].revenue += m.amount;
    });

    const personPayouts: Record<string, { soldCount: number; soldRevenue: number; sellerCommission: number; filmedCount: number; filmedPay: number; editedCount: number; editedPay: number; totalPay: number }> = {};
    const initPerson = () => ({ soldCount: 0, soldRevenue: 0, sellerCommission: 0, filmedCount: 0, filmedPay: 0, editedCount: 0, editedPay: 0, totalPay: 0 });
    mediaSales.forEach(m => {
      if (m.sold_by) {
        if (!personPayouts[m.sold_by]) personPayouts[m.sold_by] = initPerson();
        personPayouts[m.sold_by].soldCount++;
        personPayouts[m.sold_by].soldRevenue += m.amount;
        const comm = Math.round(m.amount * MEDIA_SELLER_COMMISSION);
        personPayouts[m.sold_by].sellerCommission += comm;
        personPayouts[m.sold_by].totalPay += comm;
      }
      // Workers split 50%: if both exist each gets 25%, if only one they get 50%
      const workerCount = (m.filmed_by ? 1 : 0) + (m.edited_by ? 1 : 0);
      if (m.filmed_by) {
        if (!personPayouts[m.filmed_by]) personPayouts[m.filmed_by] = initPerson();
        personPayouts[m.filmed_by].filmedCount++;
        const pay = Math.round(m.amount * MEDIA_WORKER_TOTAL / workerCount);
        personPayouts[m.filmed_by].filmedPay += pay;
        personPayouts[m.filmed_by].totalPay += pay;
      }
      if (m.edited_by) {
        if (!personPayouts[m.edited_by]) personPayouts[m.edited_by] = initPerson();
        personPayouts[m.edited_by].editedCount++;
        const pay = Math.round(m.amount * MEDIA_WORKER_TOTAL / workerCount);
        personPayouts[m.edited_by].editedPay += pay;
        personPayouts[m.edited_by].totalPay += pay;
      }
    });

    return {
      total: mediaSales.length, totalRevenue, totalSellerCommissions, totalFilmerPay, totalEditorPay, totalWorkerPay, totalPayouts, businessRevenue,
      byType, personPayouts: Object.entries(personPayouts).sort((a, b) => b[1].totalPay - a[1].totalPay),
    };
  }, [mediaSales]);

  // ===== PAYROLL: Combined per-person earnings across all revenue streams =====
  const payrollData = useMemo(() => {
    const people: Record<string, {
      sessionCount: number; sessionRevenue: number; sessionPay: number; sessionHours: number;
      mediaCommission: number; mediaSoldCount: number;
      mediaWorkerPay: number; mediaFilmedCount: number; mediaEditedCount: number;
      beatSales: number; beatProducerPay: number; beatCount: number;
      totalPay: number; totalPaid: number;
    }> = {};

    const initPerson = () => ({ sessionCount: 0, sessionRevenue: 0, sessionPay: 0, sessionHours: 0, mediaCommission: 0, mediaSoldCount: 0, mediaWorkerPay: 0, mediaFilmedCount: 0, mediaEditedCount: 0, beatSales: 0, beatProducerPay: 0, beatCount: 0, totalPay: 0, totalPaid: 0 });

    // Sessions: engineer gets 60%
    bookings.forEach(b => {
      const eng = b.engineer_name;
      if (!eng || eng === 'Unassigned') return;
      if (!people[eng]) people[eng] = initPerson();
      people[eng].sessionCount++;
      people[eng].sessionRevenue += b.total_amount;
      people[eng].sessionPay += Math.round(b.total_amount * ENGINEER_SESSION_SPLIT);
      people[eng].sessionHours += b.duration;
    });

    // Media: seller gets 15%, workers split 50% (25% each if both, 50% if solo)
    mediaSales.forEach(m => {
      if (m.sold_by) {
        if (!people[m.sold_by]) people[m.sold_by] = initPerson();
        people[m.sold_by].mediaSoldCount++;
        people[m.sold_by].mediaCommission += Math.round(m.amount * MEDIA_SELLER_COMMISSION);
      }
      const wCount = (m.filmed_by ? 1 : 0) + (m.edited_by ? 1 : 0);
      if (m.filmed_by) {
        if (!people[m.filmed_by]) people[m.filmed_by] = initPerson();
        people[m.filmed_by].mediaFilmedCount++;
        people[m.filmed_by].mediaWorkerPay += Math.round(m.amount * MEDIA_WORKER_TOTAL / wCount);
      }
      if (m.edited_by) {
        if (!people[m.edited_by]) people[m.edited_by] = initPerson();
        people[m.edited_by].mediaEditedCount++;
        people[m.edited_by].mediaWorkerPay += Math.round(m.amount * MEDIA_WORKER_TOTAL / wCount);
      }
    });

    // Beat sales: producer gets 60%
    beatPurchases.forEach(p => {
      const prod = p.beats?.producer;
      if (!prod) return;
      if (!people[prod]) people[prod] = initPerson();
      people[prod].beatCount++;
      people[prod].beatSales += p.amount_paid;
      people[prod].beatProducerPay += Math.round(p.amount_paid * PRODUCER_COMMISSION);
    });

    // Calculate totals
    Object.values(people).forEach(p => {
      p.totalPay = p.sessionPay + p.mediaCommission + p.mediaWorkerPay + p.beatProducerPay;
    });

    const entries = Object.entries(people).sort((a, b) => b[1].totalPay - a[1].totalPay);
    const totalPayroll = entries.reduce((s, [, d]) => s + d.totalPay, 0);

    // Business keeps
    const totalGrossRevenue = sessionStats.totalBooked + mediaStats.totalRevenue + beatStats.totalRevenue;
    const businessKeeps = totalGrossRevenue - totalPayroll;
    const keptDeposits = cancelledBookings.reduce((s, b) => s + Math.max(b.actual_deposit_paid || 0, b.deposit_amount || 0), 0);

    return { people: entries, totalPayroll, totalGrossRevenue, businessKeeps, keptDeposits };
  }, [bookings, mediaSales, beatPurchases, sessionStats, mediaStats, beatStats, cancelledBookings]);

  const SALE_TYPE_LABELS: Record<string, string> = {
    video: 'Music Video',
    photo: 'Photo Shoot',
    content: 'Content Creation',
    other: 'Other',
  };

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
    { key: 'payroll', label: 'Payroll' },
    { key: 'sessions', label: 'Sessions' },
    { key: 'beats', label: 'Beat Sales' },
    { key: 'media', label: 'Media Sales' },
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
                view === v.key ? 'bg-black text-white' : 'bg-black/5 text-black/70 hover:bg-black/10'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="w-4 h-4 text-black/30" />
          {([
            { key: 'thisMonth' as DatePreset, label: 'This Month' },
            { key: 'lastMonth' as DatePreset, label: 'Last Month' },
            { key: 'month' as DatePreset, label: 'Pick Month' },
            { key: '30d' as DatePreset, label: '30 Days' },
            { key: '90d' as DatePreset, label: '90 Days' },
            { key: 'year' as DatePreset, label: '1 Year' },
            { key: 'custom' as DatePreset, label: 'Custom' },
          ]).map((p) => (
            <button
              key={p.key}
              onClick={() => setDatePreset(p.key)}
              className={`font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 transition-colors ${
                datePreset === p.key ? 'bg-accent text-black' : 'bg-black/5 text-black/70 hover:bg-black/10'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {datePreset === 'month' && (
        <div className="mb-6">
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
        </div>
      )}

      {datePreset === 'custom' && (
        <div className="flex gap-3 mb-6 items-center">
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
            className="border border-black/20 px-3 py-2 font-mono text-xs focus:border-accent focus:outline-none" />
          <span className="font-mono text-xs text-black/60">to</span>
          <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
            className="border border-black/20 px-3 py-2 font-mono text-xs focus:border-accent focus:outline-none" />
        </div>
      )}

      {loading ? (
        <p className="font-mono text-sm text-black/70">Loading accounting data...</p>
      ) : (
        <>
          {/* ========= OVERVIEW ========= */}
          {view === 'overview' && (
            <div className="space-y-8">
              {/* Gross Revenue */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={DollarSign} label="Gross Revenue (All)" value={formatCents(payrollData.totalGrossRevenue)} accent />
                <StatCard icon={Calendar} label="Session Revenue" value={formatCents(sessionStats.totalBooked)} />
                <StatCard icon={Music} label="Beat Sales" value={formatCents(beatStats.totalRevenue)} />
                <StatCard icon={TrendingUp} label="Media Sales" value={formatCents(mediaStats.totalRevenue)} />
              </div>

              {/* Business Profit */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={DollarSign} label="Business Keeps" value={formatCents(payrollData.businessKeeps + payrollData.keptDeposits)} accent />
                <StatCard icon={Users} label="Total Payroll Owed" value={formatCents(payrollData.totalPayroll)} />
                <StatCard icon={DollarSign} label="Remainder Due" value={formatCents(sessionStats.remainderOutstanding)} />
                {payrollData.keptDeposits > 0 && (
                  <StatCard icon={DollarSign} label="Kept Deposits" value={formatCents(payrollData.keptDeposits)} />
                )}
              </div>

              {/* Business Profit Breakdown */}
              <div className="border border-black/10 p-4">
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider mb-3">Business Profit Breakdown</h3>
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex justify-between py-1 border-b border-black/5">
                    <span className="text-black/60">Sessions — Business {Math.round(BUSINESS_SESSION_SPLIT * 100)}%</span>
                    <span className="font-bold">{formatCents(Math.round(sessionStats.totalBooked * BUSINESS_SESSION_SPLIT))}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-black/5">
                    <span className="text-black/60">Beat Sales — Platform {Math.round(PLATFORM_COMMISSION * 100)}%</span>
                    <span className="font-bold">{formatCents(beatStats.platformCut)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-black/5">
                    <span className="text-black/60">Media Sales — Business {Math.round(MEDIA_BUSINESS_CUT * 100)}%</span>
                    <span className="font-bold">{formatCents(mediaStats.businessRevenue)}</span>
                  </div>
                  {payrollData.keptDeposits > 0 && (
                    <div className="flex justify-between py-1 border-b border-black/5">
                      <span className="text-black/60">Kept Deposits (Cancelled Sessions)</span>
                      <span className="font-bold">{formatCents(payrollData.keptDeposits)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-t-2 border-black/20">
                    <span className="font-bold text-accent">Total Business Profit</span>
                    <span className="font-bold text-accent text-lg">{formatCents(payrollData.businessKeeps + payrollData.keptDeposits)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard icon={Calendar} label="Total Sessions" value={String(sessionStats.total)} />
                <StatCard icon={Calendar} label="Completed" value={`${sessionStats.completed} · ${formatCents(sessionStats.completedRevenue)}`} />
                <StatCard icon={Calendar} label="Upcoming" value={`${sessionStats.total - sessionStats.completed} · ${formatCents(sessionStats.totalBooked - sessionStats.completedRevenue)}`} />
                <StatCard icon={Calendar} label="Total Hours" value={`${sessionStats.totalHours}hr`} />
                <StatCard icon={DollarSign} label="Deposits Collected" value={formatCents(sessionStats.depositsCollected)} />
              </div>

              {cancelledBookings.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <StatCard icon={Calendar} label="Cancelled Sessions" value={String(cancelledBookings.length)} />
                  <StatCard icon={DollarSign} label="Deposits Kept (Card)" value={formatCents(cancelledBookings.reduce((s, b) => s + (b.actual_deposit_paid || 0), 0))} />
                  <StatCard icon={DollarSign} label="Total Kept from Cancelled" value={formatCents(cancelledBookings.reduce((s, b) => s + Math.max(b.actual_deposit_paid || 0, b.deposit_amount || 0), 0))} accent />
                </div>
              )}

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
                        <th className="text-left font-mono text-[10px] text-black/60 uppercase tracking-wider py-2">Month</th>
                        <th className="text-right font-mono text-[10px] text-black/60 uppercase tracking-wider py-2">Sessions</th>
                        <th className="text-right font-mono text-[10px] text-black/60 uppercase tracking-wider py-2">Hours</th>
                        <th className="text-right font-mono text-[10px] text-black/60 uppercase tracking-wider py-2">Revenue</th>
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
                        <th className="text-left font-mono text-[10px] text-black/60 uppercase tracking-wider py-2">Engineer</th>
                        <th className="text-right font-mono text-[10px] text-black/60 uppercase tracking-wider py-2">Sessions</th>
                        <th className="text-right font-mono text-[10px] text-black/60 uppercase tracking-wider py-2">Hours</th>
                        <th className="text-right font-mono text-[10px] text-black/60 uppercase tracking-wider py-2">Deposits</th>
                        <th className="text-right font-mono text-[10px] text-black/60 uppercase tracking-wider py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionsByEngineer.map(([name, data]) => (
                        <tr key={name} className="border-b border-black/5">
                          <td className="font-mono text-sm font-semibold py-2">{name}</td>
                          <td className="font-mono text-sm text-right">{data.count}</td>
                          <td className="font-mono text-sm text-right">{data.hours}hr</td>
                          <td className="font-mono text-sm text-right text-black/70">{formatCents(data.deposits)}</td>
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
                        <span className="text-black/70">{data.count} sessions</span>
                        <span className="text-black/70">{data.hours}hr</span>
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
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-black/10">
                        <th className="text-left font-mono text-[10px] text-black/60 uppercase tracking-wider py-2">Producer</th>
                        <th className="text-right font-mono text-[10px] text-black/60 uppercase tracking-wider py-2">Sales</th>
                        <th className="text-right font-mono text-[10px] text-black/60 uppercase tracking-wider py-2">Gross</th>
                        <th className="text-right font-mono text-[10px] text-black/60 uppercase tracking-wider py-2">Producer ({Math.round(PRODUCER_COMMISSION * 100)}%)</th>
                        <th className="text-right font-mono text-[10px] text-black/60 uppercase tracking-wider py-2">Platform ({Math.round(PLATFORM_COMMISSION * 100)}%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {beatsByProducer.map(([name, data]) => (
                        <tr key={name} className="border-b border-black/5">
                          <td className="font-mono text-sm font-semibold py-2">{name}</td>
                          <td className="font-mono text-sm text-right">{data.count}</td>
                          <td className="font-mono text-sm text-right">{formatCents(data.revenue)}</td>
                          <td className="font-mono text-sm text-right text-black/70">{formatCents(data.producerCut)}</td>
                          <td className="font-mono text-sm font-bold text-right text-accent">{formatCents(data.platformCut)}</td>
                        </tr>
                      ))}
                      {beatsByProducer.length > 1 && (
                        <tr className="border-t-2 border-black/20">
                          <td className="font-mono text-sm font-bold py-2">TOTAL</td>
                          <td className="font-mono text-sm text-right font-bold">{beatStats.total}</td>
                          <td className="font-mono text-sm text-right font-bold">{formatCents(beatStats.totalRevenue)}</td>
                          <td className="font-mono text-sm text-right font-bold text-black/70">{formatCents(beatStats.producerCut)}</td>
                          <td className="font-mono text-sm text-right font-bold text-accent">{formatCents(beatStats.platformCut)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </BreakdownSection>
              )}
            </div>
          )}

          {/* ========= PAYROLL ========= */}
          {view === 'payroll' && (
            <div className="space-y-6">
              {/* Top summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MiniStat label="Gross Revenue" value={formatCents(payrollData.totalGrossRevenue)} />
                <MiniStat label="Total Payroll Owed" value={formatCents(payrollData.totalPayroll)} />
                <MiniStat label="Business Keeps" value={formatCents(payrollData.businessKeeps)} />
                <MiniStat label="People on Payroll" value={String(payrollData.people.length)} />
              </div>

              {/* Per-Person Earnings Table */}
              <div className="border border-black/10 p-4">
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider mb-4">Earnings by Person</h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b-2 border-black/20">
                        <th className="text-left font-mono text-[10px] text-black/60 uppercase tracking-wider py-2">Person</th>
                        <th className="text-right font-mono text-[10px] text-black/60 uppercase tracking-wider py-2">Sessions</th>
                        <th className="text-right font-mono text-[10px] text-black/60 uppercase tracking-wider py-2">Session Pay (60%)</th>
                        <th className="text-right font-mono text-[10px] text-black/60 uppercase tracking-wider py-2">Media Pay</th>
                        <th className="text-right font-mono text-[10px] text-black/60 uppercase tracking-wider py-2">Beat Payouts</th>
                        <th className="text-right font-mono text-[10px] text-black/60 uppercase tracking-wider py-2 border-l-2 border-black/10">Total Owed</th>
                        <th className="text-right font-mono text-[10px] text-black/60 uppercase tracking-wider py-2">Paid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payrollData.people.map(([name, data]) => (
                        <tr key={name} className="border-b border-black/5 hover:bg-black/[0.02]">
                          <td className="font-mono text-sm font-semibold py-3">{name}</td>
                          <td className="font-mono text-xs text-right text-black/70">
                            {data.sessionCount > 0 ? `${data.sessionCount} · ${data.sessionHours}hr` : '—'}
                          </td>
                          <td className="font-mono text-sm text-right">
                            {data.sessionPay > 0 ? formatCents(data.sessionPay) : '—'}
                          </td>
                          <td className="font-mono text-sm text-right">
                            {(data.mediaCommission + data.mediaWorkerPay) > 0 ? (
                              <span>{formatCents(data.mediaCommission + data.mediaWorkerPay)}</span>
                            ) : '—'}
                          </td>
                          <td className="font-mono text-sm text-right">
                            {data.beatProducerPay > 0 ? formatCents(data.beatProducerPay) : '—'}
                          </td>
                          <td className="font-mono text-sm text-right font-bold text-accent border-l-2 border-black/10">
                            {formatCents(data.totalPay)}
                          </td>
                          <td className="font-mono text-sm text-right">
                            {(payoutsByPerson[name] || 0) > 0 ? (
                              <span className="text-green-600">{formatCents(payoutsByPerson[name])}</span>
                            ) : '—'}
                          </td>
                        </tr>
                      ))}
                      {payrollData.people.length === 0 && (
                        <tr>
                          <td colSpan={7} className="font-mono text-sm text-black/60 text-center py-12">No payroll data for this period</td>
                        </tr>
                      )}
                    </tbody>
                    {payrollData.people.length > 1 && (
                      <tfoot>
                        <tr className="border-t-2 border-black/20">
                          <td className="font-mono text-sm font-bold py-3">TOTAL</td>
                          <td className="font-mono text-xs text-right text-black/70">
                            {payrollData.people.reduce((s, [, d]) => s + d.sessionCount, 0)} sessions
                          </td>
                          <td className="font-mono text-sm text-right font-bold">
                            {formatCents(payrollData.people.reduce((s, [, d]) => s + d.sessionPay, 0))}
                          </td>
                          <td className="font-mono text-sm text-right font-bold">
                            {formatCents(payrollData.people.reduce((s, [, d]) => s + d.mediaCommission, 0))}
                          </td>
                          <td className="font-mono text-sm text-right font-bold">
                            {formatCents(payrollData.people.reduce((s, [, d]) => s + d.beatProducerPay, 0))}
                          </td>
                          <td className="font-mono text-sm text-right font-bold text-accent border-l-2 border-black/10">
                            {formatCents(payrollData.totalPayroll)}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              {/* Per-Person Detail Cards with Payout */}
              {payrollData.people.map(([name, data]) => {
                const paid = payoutsByPerson[name] || 0;
                const remaining = Math.max(0, data.totalPay - paid);
                return (
                  <BreakdownSection
                    key={name}
                    title={`${name} — ${formatCents(data.totalPay)} earned${paid > 0 ? ` · ${formatCents(paid)} paid · ${formatCents(remaining)} remaining` : ''}`}
                    expanded={expandedSection === `payroll-${name}`}
                    onToggle={() => toggleSection(`payroll-${name}`)}
                  >
                    <div className="space-y-3">
                      {data.sessionPay > 0 && (
                        <div className="flex justify-between items-center py-2 border-b border-black/5">
                          <div>
                            <p className="font-mono text-sm font-semibold">Session Earnings</p>
                            <p className="font-mono text-[10px] text-black/60">{data.sessionCount} sessions · {data.sessionHours}hr · {formatCents(data.sessionRevenue)} gross</p>
                          </div>
                          <p className="font-mono text-sm font-bold">{formatCents(data.sessionPay)}</p>
                        </div>
                      )}
                      {data.mediaCommission > 0 && (
                        <div className="flex justify-between items-center py-2 border-b border-black/5">
                          <div>
                            <p className="font-mono text-sm font-semibold">Media Sales Commission</p>
                            <p className="font-mono text-[10px] text-black/60">{data.mediaSoldCount} sale{data.mediaSoldCount !== 1 ? 's' : ''} brought in · 15% commission</p>
                          </div>
                          <p className="font-mono text-sm font-bold">{formatCents(data.mediaCommission)}</p>
                        </div>
                      )}
                      {data.mediaWorkerPay > 0 && (
                        <div className="flex justify-between items-center py-2 border-b border-black/5">
                          <div>
                            <p className="font-mono text-sm font-semibold">Media Work Pay</p>
                            <p className="font-mono text-[10px] text-black/60">
                              {data.mediaFilmedCount > 0 ? `${data.mediaFilmedCount} filmed` : ''}
                              {data.mediaFilmedCount > 0 && data.mediaEditedCount > 0 ? ' · ' : ''}
                              {data.mediaEditedCount > 0 ? `${data.mediaEditedCount} edited` : ''}
                              {' · 50% worker split'}
                            </p>
                          </div>
                          <p className="font-mono text-sm font-bold">{formatCents(data.mediaWorkerPay)}</p>
                        </div>
                      )}
                      {data.beatProducerPay > 0 && (
                        <div className="flex justify-between items-center py-2 border-b border-black/5">
                          <div>
                            <p className="font-mono text-sm font-semibold">Beat Sales</p>
                            <p className="font-mono text-[10px] text-black/60">{data.beatCount} sale{data.beatCount !== 1 ? 's' : ''} · {formatCents(data.beatSales)} gross · 60% producer cut</p>
                          </div>
                          <p className="font-mono text-sm font-bold">{formatCents(data.beatProducerPay)}</p>
                        </div>
                      )}

                      {/* Payout status */}
                      <div className="flex justify-between items-center py-2 border-t-2 border-black/20">
                        <div>
                          <p className="font-mono text-sm font-bold">Total Earned</p>
                          {paid > 0 && <p className="font-mono text-[10px] text-green-600">Paid: {formatCents(paid)}</p>}
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-lg font-bold text-accent">{formatCents(data.totalPay)}</p>
                          {paid > 0 && remaining > 0 && (
                            <p className="font-mono text-xs text-red-600">Still owed: {formatCents(remaining)}</p>
                          )}
                          {paid > 0 && remaining === 0 && (
                            <p className="font-mono text-xs text-green-600 font-bold">PAID IN FULL</p>
                          )}
                        </div>
                      </div>

                      {/* Record Payout button */}
                      {remaining > 0 && (
                        <>
                          {showPayoutForm === name ? (
                            <div className="border border-accent p-3 space-y-2">
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <label className="font-mono text-[10px] text-black/60">Amount ($)</label>
                                  <input type="number" step="0.01" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)}
                                    placeholder={`${(remaining / 100).toFixed(2)}`}
                                    className="w-full border border-black/20 px-2 py-1.5 font-mono text-sm" />
                                </div>
                                <div>
                                  <label className="font-mono text-[10px] text-black/60">Method</label>
                                  <select value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value)}
                                    className="w-full border border-black/20 px-2 py-1.5 font-mono text-sm bg-white">
                                    <option value="cash">Cash</option>
                                    <option value="zelle">Zelle</option>
                                    <option value="venmo">Venmo</option>
                                    <option value="cashapp">Cash App</option>
                                    <option value="check">Check</option>
                                    <option value="direct_deposit">Direct Deposit</option>
                                  </select>
                                </div>
                              </div>
                              <input type="text" value={payoutNote} onChange={(e) => setPayoutNote(e.target.value)}
                                placeholder="Note (optional)" className="w-full border border-black/20 px-2 py-1.5 font-mono text-xs" />
                              <div className="flex gap-2">
                                <button onClick={() => recordPayout(name)} disabled={!payoutAmount || recordingPayout}
                                  className="bg-green-600 text-white font-mono text-xs font-bold px-4 py-2 hover:bg-green-700 disabled:opacity-50">
                                  {recordingPayout ? 'Recording...' : 'Record Payout'}
                                </button>
                                <button onClick={() => setShowPayoutForm(null)}
                                  className="font-mono text-xs text-black/60 hover:text-black px-3 py-2">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => { setShowPayoutForm(name); setPayoutAmount((remaining / 100).toFixed(2)); }}
                              className="w-full border-2 border-green-600 text-green-700 font-mono text-xs font-bold uppercase py-2 hover:bg-green-50">
                              Record Payout — {formatCents(remaining)} owed
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </BreakdownSection>
                );
              })}

              {/* Business Summary at bottom of payroll */}
              <div className="border-2 border-accent p-4 space-y-2">
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider">Business Summary</h3>
                <div className="space-y-1 font-mono text-sm">
                  <div className="flex justify-between"><span className="text-black/60">Gross Revenue</span><span>{formatCents(payrollData.totalGrossRevenue)}</span></div>
                  <div className="flex justify-between"><span className="text-black/60">− Total Payroll</span><span className="text-red-600">−{formatCents(payrollData.totalPayroll)}</span></div>
                  {payrollData.keptDeposits > 0 && (
                    <div className="flex justify-between"><span className="text-black/60">+ Kept Deposits</span><span className="text-green-600">+{formatCents(payrollData.keptDeposits)}</span></div>
                  )}
                  <div className="flex justify-between pt-2 border-t-2 border-black/20">
                    <span className="font-bold text-accent">Business Profit</span>
                    <span className="font-bold text-accent text-lg">{formatCents(payrollData.businessKeeps + payrollData.keptDeposits)}</span>
                  </div>
                </div>
              </div>
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
                <span className="font-mono text-xs text-black/60 self-center">
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
                <div className="hidden md:grid grid-cols-12 gap-2 font-mono text-[10px] text-black/60 uppercase tracking-wider py-2 px-3 border-b border-black/10">
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
                      {new Date(b.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit', timeZone: 'UTC' })}
                    </div>
                    <div className="col-span-2 font-semibold truncate">{b.customer_name}</div>
                    <div className="col-span-2 text-black/60 truncate">{b.engineer_name || '—'}</div>
                    <div className="col-span-1 text-black/60">{ROOM_LABELS[b.room || ''] || b.room || '—'}</div>
                    <div className="col-span-1">{b.duration}hr</div>
                    <div className="col-span-1 text-right font-semibold">{formatCents(b.total_amount)}</div>
                    <div className="col-span-1 text-right text-black/70">{formatCents(b.actual_deposit_paid || 0)}</div>
                    <div className="col-span-1 text-right text-black/70">{formatCents(b.remainder_amount)}</div>
                    <div className="col-span-1 text-right">
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 ${STATUS_COLORS[b.status] || 'bg-black/5 text-black/50'}`}>
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))}
                {filteredBookings.length === 0 && (
                  <p className="font-mono text-sm text-black/60 text-center py-12">No sessions found</p>
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
                <span className="font-mono text-xs text-black/60 self-center">
                  {filteredPurchases.length} sales · {formatCents(beatStats.totalRevenue)} total
                </span>
              </div>

              {/* Commission summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MiniStat label="Gross Revenue" value={formatCents(beatStats.totalRevenue)} />
                <MiniStat label={`Platform (${Math.round(PLATFORM_COMMISSION * 100)}%)`} value={formatCents(beatStats.platformCut)} />
                <MiniStat label={`Producer Payouts (${Math.round(PRODUCER_COMMISSION * 100)}%)`} value={formatCents(beatStats.producerCut)} />
                <MiniStat label="Total Sales" value={String(beatStats.total)} />
              </div>

              {/* License breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(beatStats.byLicense).map(([type, data]) => (
                  <MiniStat key={type} label={LICENSE_LABELS[type] || type} value={`${data.count} · ${formatCents(data.revenue)}`} />
                ))}
                {Object.keys(beatStats.byLicense).length === 0 && (
                  <MiniStat label="No Sales" value="—" />
                )}
              </div>

              {/* Purchase list */}
              <div className="space-y-1">
                <div className="hidden md:grid grid-cols-12 gap-2 font-mono text-[10px] text-black/60 uppercase tracking-wider py-2 px-3 border-b border-black/10">
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
                  <p className="font-mono text-sm text-black/60 text-center py-12">No beat sales found</p>
                )}
              </div>
            </div>
          )}

          {/* ========= MEDIA SALES DETAIL ========= */}
          {view === 'media' && (
            <div className="space-y-6">
              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MiniStat label="Total Media Revenue" value={formatCents(mediaStats.totalRevenue)} />
                <MiniStat label="Business Keeps" value={formatCents(mediaStats.businessRevenue)} />
                <MiniStat label="Total Payouts Owed" value={formatCents(mediaStats.totalPayouts)} />
                <MiniStat label="Total Sales" value={String(mediaStats.total)} />
              </div>

              {/* Revenue Split Breakdown */}
              <div className="border border-black/10 p-4">
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider mb-3">Revenue Split</h3>
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex justify-between py-1 border-b border-black/5">
                    <span className="text-black/60">Seller Commission ({Math.round(MEDIA_SELLER_COMMISSION * 100)}%)</span>
                    <span className="font-bold">{formatCents(mediaStats.totalSellerCommissions)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-black/5">
                    <span className="text-black/60">Worker Pay — {Math.round(MEDIA_WORKER_TOTAL * 100)}% total (split if both filmed + edited)</span>
                    <span className="font-bold">{formatCents(mediaStats.totalWorkerPay)}</span>
                  </div>
                  {mediaStats.totalFilmerPay > 0 && (
                    <div className="flex justify-between py-1 border-b border-black/5 pl-4">
                      <span className="text-black/60">Filmed By</span>
                      <span className="text-black/60">{formatCents(mediaStats.totalFilmerPay)}</span>
                    </div>
                  )}
                  {mediaStats.totalEditorPay > 0 && (
                    <div className="flex justify-between py-1 border-b border-black/5 pl-4">
                      <span className="text-black/60">Edited By</span>
                      <span className="text-black/60">{formatCents(mediaStats.totalEditorPay)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-t-2 border-black/20">
                    <span className="font-bold text-accent">Business Keeps ({Math.round(MEDIA_BUSINESS_CUT * 100)}%)</span>
                    <span className="font-bold text-accent">{formatCents(mediaStats.businessRevenue)}</span>
                  </div>
                </div>
              </div>

              {/* By Type */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(mediaStats.byType).map(([type, data]) => (
                  <MiniStat key={type} label={SALE_TYPE_LABELS[type] || type} value={`${data.count} · ${formatCents(data.revenue)}`} />
                ))}
                {Object.keys(mediaStats.byType).length === 0 && (
                  <MiniStat label="No Sales" value="—" />
                )}
              </div>

              {/* Per-Person Payouts */}
              {mediaStats.personPayouts.length > 0 && (
                <div className="border border-black/10 p-4">
                  <h3 className="font-mono text-sm font-bold uppercase tracking-wider mb-3">Team Payouts</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead>
                        <tr className="border-b border-black/10">
                          <th className="text-left font-mono text-[10px] text-black/60 uppercase tracking-wider py-2">Person</th>
                          <th className="text-right font-mono text-[10px] text-black/60 uppercase tracking-wider py-2">Sales (15%)</th>
                          <th className="text-right font-mono text-[10px] text-black/60 uppercase tracking-wider py-2">Filmed (10%)</th>
                          <th className="text-right font-mono text-[10px] text-black/60 uppercase tracking-wider py-2">Edited (10%)</th>
                          <th className="text-right font-mono text-[10px] text-black/60 uppercase tracking-wider py-2 border-l-2 border-black/10">Total Owed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mediaStats.personPayouts.map(([name, data]) => (
                          <tr key={name} className="border-b border-black/5">
                            <td className="font-mono text-sm font-semibold py-2">{name}</td>
                            <td className="font-mono text-sm text-right">
                              {data.sellerCommission > 0 ? <>{formatCents(data.sellerCommission)} <span className="text-[10px] text-black/60">({data.soldCount})</span></> : '—'}
                            </td>
                            <td className="font-mono text-sm text-right">
                              {data.filmedPay > 0 ? <>{formatCents(data.filmedPay)} <span className="text-[10px] text-black/60">({data.filmedCount})</span></> : '—'}
                            </td>
                            <td className="font-mono text-sm text-right">
                              {data.editedPay > 0 ? <>{formatCents(data.editedPay)} <span className="text-[10px] text-black/60">({data.editedCount})</span></> : '—'}
                            </td>
                            <td className="font-mono text-sm text-right font-bold text-accent border-l-2 border-black/10">
                              {formatCents(data.totalPay)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sales List */}
              <div className="space-y-1">
                <div className="hidden md:grid grid-cols-12 gap-2 font-mono text-[10px] text-black/60 uppercase tracking-wider py-2 px-3 border-b border-black/10">
                  <div className="col-span-2">Date</div>
                  <div className="col-span-3">Description</div>
                  <div className="col-span-1">Type</div>
                  <div className="col-span-2">Client</div>
                  <div className="col-span-2">Crew</div>
                  <div className="col-span-1 text-right">Amount</div>
                  <div className="col-span-1 text-right">Commission</div>
                </div>
                {mediaSales.map((m) => (
                  <div key={m.id} className="grid grid-cols-2 md:grid-cols-12 gap-2 font-mono text-xs py-3 px-3 border-b border-black/5 hover:bg-black/[0.02]">
                    <div className="col-span-2">
                      {new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                    </div>
                    <div className="col-span-3 font-semibold truncate">{m.description}</div>
                    <div className="col-span-1">
                      <span className="text-[10px] font-bold uppercase bg-black/5 px-1.5 py-0.5">{SALE_TYPE_LABELS[m.sale_type] || m.sale_type}</span>
                    </div>
                    <div className="col-span-2 text-black/60 truncate">{m.client_name || '—'}</div>
                    <div className="col-span-2 text-black/70 truncate">
                      {[m.sold_by && `S: ${m.sold_by}`, m.filmed_by && `F: ${m.filmed_by}`, m.edited_by && `E: ${m.edited_by}`].filter(Boolean).join(' · ') || '—'}
                    </div>
                    <div className="col-span-1 text-right font-bold">{formatCents(m.amount)}</div>
                    <div className="col-span-1 text-right text-accent font-bold">
                      {m.sold_by ? formatCents(Math.round(m.amount * MEDIA_SELLER_COMMISSION)) : '—'}
                    </div>
                  </div>
                ))}
                {mediaSales.length === 0 && (
                  <p className="font-mono text-sm text-black/60 text-center py-12">No media sales found</p>
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
      <p className="font-mono text-[10px] text-black/60 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-black/10 px-3 py-2">
      <p className="font-mono text-sm font-bold">{value}</p>
      <p className="font-mono text-[10px] text-black/60 uppercase tracking-wider">{label}</p>
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
