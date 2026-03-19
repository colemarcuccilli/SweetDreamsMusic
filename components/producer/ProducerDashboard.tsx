'use client';

import { useState, useEffect } from 'react';
import { Music, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import { formatCents } from '@/lib/utils';
import { PRODUCER_COMMISSION, PLATFORM_COMMISSION } from '@/lib/constants';

interface Beat {
  id: string;
  title: string;
  genre: string | null;
  bpm: number | null;
  musical_key: string | null;
  mp3_lease_price: number | null;
  trackout_lease_price: number | null;
  exclusive_price: number | null;
  has_exclusive: boolean;
  lease_count: number;
  total_lease_revenue: number;
  status: string;
  created_at: string;
}

interface Sale {
  id: string;
  beat_id: string;
  buyer_email: string;
  license_type: string;
  amount_paid: number;
  created_at: string;
  beats: { title: string } | { title: string }[] | null;
}

interface Earnings {
  totalGross: number;
  platformFee: number;
  netEarnings: number;
  totalPaid: number;
  pendingPayout: number;
  totalBeats: number;
  totalLeases: number;
}

type Tab = 'beats' | 'sales' | 'earnings';

export default function ProducerDashboard() {
  const [tab, setTab] = useState<Tab>('beats');
  const [beats, setBeats] = useState<Beat[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/producer/beats').then((r) => r.json()),
      fetch('/api/producer/sales').then((r) => r.json()),
      fetch('/api/producer/earnings').then((r) => r.json()),
    ]).then(([beatsData, salesData, earningsData]) => {
      setBeats(beatsData.beats || []);
      setSales(salesData.sales || []);
      setEarnings(earningsData);
      setLoading(false);
    });
  }, []);

  const tabs: { key: Tab; label: string; icon: typeof Music }[] = [
    { key: 'beats', label: 'My Beats', icon: Music },
    { key: 'sales', label: 'Sales', icon: ShoppingCart },
    { key: 'earnings', label: 'Earnings', icon: DollarSign },
  ];

  return (
    <>
      {/* Sub-tabs */}
      <section className="bg-white text-black border-b-2 border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-0 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`font-mono text-sm font-semibold uppercase tracking-wider px-5 py-4 border-b-2 transition-colors inline-flex items-center gap-2 flex-shrink-0 ${
                  tab === t.key ? 'border-accent text-black' : 'border-transparent text-black/40 hover:text-black/70'
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white text-black py-8 sm:py-12 min-h-[60vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <p className="font-mono text-sm text-black/40">Loading...</p>
          ) : (
            <>
              {tab === 'beats' && <BeatsTab beats={beats} />}
              {tab === 'sales' && <SalesTab sales={sales} />}
              {tab === 'earnings' && earnings && <EarningsTab earnings={earnings} />}
            </>
          )}
        </div>
      </section>
    </>
  );
}

function BeatsTab({ beats }: { beats: Beat[] }) {
  if (beats.length === 0) {
    return (
      <div className="border-2 border-black/10 p-12 text-center">
        <Music className="w-12 h-12 text-black/10 mx-auto mb-4" />
        <p className="font-mono text-sm text-black/40">No beats yet. Beats uploaded by admins will appear here.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="border-2 border-accent p-4">
          <p className="font-mono text-[10px] text-black/40 uppercase tracking-wider">Active Beats</p>
          <p className="text-heading-sm">{beats.filter((b) => b.status === 'active').length}</p>
        </div>
        <div className="border-2 border-black/10 p-4">
          <p className="font-mono text-[10px] text-black/40 uppercase tracking-wider">Total Leases</p>
          <p className="text-heading-sm">{beats.reduce((sum, b) => sum + (b.lease_count || 0), 0)}</p>
        </div>
        <div className="border-2 border-black/10 p-4">
          <p className="font-mono text-[10px] text-black/40 uppercase tracking-wider">Revenue</p>
          <p className="text-heading-sm">{formatCents(beats.reduce((sum, b) => sum + (b.total_lease_revenue || 0), 0))}</p>
        </div>
        <div className="border-2 border-black/10 p-4">
          <p className="font-mono text-[10px] text-black/40 uppercase tracking-wider">Exclusives Sold</p>
          <p className="text-heading-sm">{beats.filter((b) => b.status === 'sold_exclusive').length}</p>
        </div>
      </div>

      {/* Beat list */}
      <div className="space-y-3">
        {beats.map((beat) => (
          <div key={beat.id} className={`border-2 p-4 ${
            beat.status === 'sold_exclusive' ? 'border-accent/30 bg-accent/5' : 'border-black/10'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm font-bold">{beat.title}</p>
                  {beat.status === 'sold_exclusive' && (
                    <span className="bg-accent/20 text-accent font-mono text-[10px] font-bold uppercase px-1.5 py-0.5">Sold Exclusive</span>
                  )}
                </div>
                <p className="font-mono text-xs text-black/50 mt-0.5">
                  {beat.genre}{beat.bpm && ` · ${beat.bpm} BPM`}{beat.musical_key && ` · ${beat.musical_key}`}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-xs text-green-600 inline-flex items-center gap-1">
                  <ShoppingCart className="w-3 h-3" /> {beat.lease_count} leases
                </p>
                <p className="font-mono text-xs text-black/40 mt-0.5">
                  {formatCents(beat.total_lease_revenue)} gross
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SalesTab({ sales }: { sales: Sale[] }) {
  if (sales.length === 0) {
    return (
      <div className="border-2 border-black/10 p-12 text-center">
        <ShoppingCart className="w-12 h-12 text-black/10 mx-auto mb-4" />
        <p className="font-mono text-sm text-black/40">No sales yet.</p>
      </div>
    );
  }

  const LICENSE_LABELS: Record<string, string> = {
    mp3_lease: 'MP3 Lease',
    trackout_lease: 'Trackout Lease',
    exclusive: 'Exclusive',
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-5 gap-4 px-4 py-2 border-b border-black/10">
        <span className="font-mono text-[10px] text-black/40 uppercase tracking-wider">Date</span>
        <span className="font-mono text-[10px] text-black/40 uppercase tracking-wider">Beat</span>
        <span className="font-mono text-[10px] text-black/40 uppercase tracking-wider">Buyer</span>
        <span className="font-mono text-[10px] text-black/40 uppercase tracking-wider">License</span>
        <span className="font-mono text-[10px] text-black/40 uppercase tracking-wider text-right">Amount</span>
      </div>
      {sales.map((sale) => {
        const beatTitle = Array.isArray(sale.beats) ? sale.beats[0]?.title : sale.beats?.title;
        return (
          <div key={sale.id} className="grid grid-cols-5 gap-4 px-4 py-3 border-b border-black/5 hover:bg-black/[0.02]">
            <span className="font-mono text-xs text-black/50">
              {new Date(sale.created_at).toLocaleDateString()}
            </span>
            <span className="font-mono text-xs font-semibold truncate">{beatTitle || 'Unknown'}</span>
            <span className="font-mono text-xs text-black/50 truncate">{sale.buyer_email}</span>
            <span className="font-mono text-xs text-black/50">{LICENSE_LABELS[sale.license_type] || sale.license_type}</span>
            <span className="font-mono text-xs font-bold text-right">{formatCents(sale.amount_paid)}</span>
          </div>
        );
      })}
    </div>
  );
}

function EarningsTab({ earnings }: { earnings: Earnings }) {
  return (
    <div>
      {/* Earnings overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="border-2 border-accent p-6">
          <p className="font-mono text-[10px] text-black/40 uppercase tracking-wider">Your Earnings ({Math.round(PRODUCER_COMMISSION * 100)}%)</p>
          <p className="text-display-sm text-accent">{formatCents(earnings.netEarnings)}</p>
        </div>
        <div className="border-2 border-black/10 p-6">
          <p className="font-mono text-[10px] text-black/40 uppercase tracking-wider">Gross Sales</p>
          <p className="text-heading-lg">{formatCents(earnings.totalGross)}</p>
        </div>
        <div className="border-2 border-black/10 p-6">
          <p className="font-mono text-[10px] text-black/40 uppercase tracking-wider">Platform Fee ({Math.round(PLATFORM_COMMISSION * 100)}%)</p>
          <p className="text-heading-lg text-black/40">{formatCents(earnings.platformFee)}</p>
        </div>
      </div>

      {/* Payout status */}
      <div className="border-2 border-black/10 p-6">
        <h3 className="font-mono text-sm font-bold uppercase mb-4">Payout Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="font-mono text-[10px] text-black/40 uppercase tracking-wider">Total Paid Out</p>
            <p className="font-mono text-lg font-bold text-green-600">{formatCents(earnings.totalPaid)}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] text-black/40 uppercase tracking-wider">Pending Payout</p>
            <p className="font-mono text-lg font-bold text-accent">{formatCents(earnings.pendingPayout)}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] text-black/40 uppercase tracking-wider">Beats / Total Leases</p>
            <p className="font-mono text-lg font-bold">{earnings.totalBeats} / {earnings.totalLeases}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
