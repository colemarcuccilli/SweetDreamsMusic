'use client';

import { useState, useEffect } from 'react';
import { Music, DollarSign, ShoppingCart, TrendingUp, Plus, X, Upload, Trash2 } from 'lucide-react';
import { formatCents } from '@/lib/utils';
import { PRODUCER_COMMISSION, PLATFORM_COMMISSION, BEAT_LICENSES } from '@/lib/constants';

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
  preview_url: string | null;
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
              {tab === 'beats' && <BeatsTab beats={beats} onBeatsChange={setBeats} />}
              {tab === 'sales' && <SalesTab sales={sales} />}
              {tab === 'earnings' && earnings && <EarningsTab earnings={earnings} />}
            </>
          )}
        </div>
      </section>
    </>
  );
}

function BeatsTab({ beats, onBeatsChange }: { beats: Beat[]; onBeatsChange: (beats: Beat[]) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [bpm, setBpm] = useState('');
  const [musicalKey, setMusicalKey] = useState('');
  const [tags, setTags] = useState('');
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [mp3File, setMp3File] = useState<File | null>(null);
  const [trackoutFile, setTrackoutFile] = useState<File | null>(null);
  const [mp3Price, setMp3Price] = useState('2999');
  const [trackoutPrice, setTrackoutPrice] = useState('7499');
  const [exclusivePrice, setExclusivePrice] = useState('40000');
  const [hasExclusive, setHasExclusive] = useState(true);
  const [containsSamples, setContainsSamples] = useState(false);
  const [sampleDetails, setSampleDetails] = useState('');
  const [uploadError, setUploadError] = useState('');

  function resetForm() {
    setTitle(''); setGenre(''); setBpm(''); setMusicalKey('');
    setTags(''); setPreviewFile(null); setMp3File(null); setTrackoutFile(null);
    setMp3Price('2999'); setTrackoutPrice('7499'); setExclusivePrice('40000');
    setHasExclusive(true); setContainsSamples(false); setSampleDetails('');
    setUploadError('');
  }

  async function handleUpload() {
    if (!previewFile || !title) return;
    setUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('preview_file', previewFile);
    formData.append('title', title);
    formData.append('genre', genre);
    formData.append('bpm', bpm);
    formData.append('key', musicalKey);
    formData.append('tags', tags);
    formData.append('mp3_lease_price', mp3Price);
    formData.append('trackout_lease_price', trackoutPrice);
    formData.append('exclusive_price', exclusivePrice);
    formData.append('has_exclusive', String(hasExclusive));
    formData.append('contains_samples', String(containsSamples));
    if (containsSamples && sampleDetails) formData.append('sample_details', sampleDetails);
    if (mp3File) formData.append('mp3_file', mp3File);
    if (trackoutFile) formData.append('trackout_file', trackoutFile);

    try {
      const res = await fetch('/api/producer/beats', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.beat) {
        onBeatsChange([data.beat, ...beats]);
        resetForm();
        setShowForm(false);
      } else {
        setUploadError(data.error || 'Upload failed');
      }
    } catch {
      setUploadError('Upload failed. Please try again.');
    }
    setUploading(false);
  }

  async function deleteBeat(id: string) {
    if (!confirm('Delete this beat? This cannot be undone.')) return;
    const res = await fetch('/api/producer/beats', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      onBeatsChange(beats.filter((b) => b.id !== id));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-heading-md">MY BEATS</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-accent text-black font-mono text-xs font-bold uppercase tracking-wider px-4 py-2 hover:bg-accent/90 inline-flex items-center gap-1"
        >
          {showForm ? <><X className="w-3 h-3" /> Cancel</> : <><Plus className="w-3 h-3" /> Upload Beat</>}
        </button>
      </div>

      {/* Upload Form */}
      {showForm && (
        <div className="border-2 border-accent p-6 mb-8 space-y-4">
          <h3 className="font-mono text-sm font-bold uppercase">Upload New Beat</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-xs text-black/60 uppercase tracking-wider mb-1">Title *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-black/20 px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none" placeholder="Beat title" />
            </div>
            <div>
              <label className="block font-mono text-xs text-black/60 uppercase tracking-wider mb-1">Genre</label>
              <input type="text" value={genre} onChange={(e) => setGenre(e.target.value)}
                className="w-full border border-black/20 px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none" placeholder="Hip-Hop, R&B, etc." />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block font-mono text-xs text-black/60 uppercase tracking-wider mb-1">BPM</label>
                <input type="number" value={bpm} onChange={(e) => setBpm(e.target.value)}
                  className="w-full border border-black/20 px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none" placeholder="140" />
              </div>
              <div className="flex-1">
                <label className="block font-mono text-xs text-black/60 uppercase tracking-wider mb-1">Key</label>
                <input type="text" value={musicalKey} onChange={(e) => setMusicalKey(e.target.value)}
                  className="w-full border border-black/20 px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none" placeholder="C minor" />
              </div>
            </div>
            <div>
              <label className="block font-mono text-xs text-black/60 uppercase tracking-wider mb-1">Tags (comma separated)</label>
              <input type="text" value={tags} onChange={(e) => setTags(e.target.value)}
                className="w-full border border-black/20 px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none" placeholder="dark, trap, melodic" />
            </div>
          </div>

          {/* File Uploads */}
          <div className="space-y-3">
            <p className="font-mono text-xs text-black/60 uppercase tracking-wider">Files</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-mono text-[10px] text-black/40 uppercase mb-1">Preview Audio (tagged/watermarked) *</label>
                <label className="border border-dashed border-black/20 p-3 flex items-center gap-2 cursor-pointer hover:border-accent transition-colors">
                  <Upload className="w-4 h-4 text-black/30 flex-shrink-0" />
                  <span className="font-mono text-[10px] text-black/50 truncate">
                    {previewFile ? previewFile.name : 'Select file...'}
                  </span>
                  <input type="file" accept="audio/*" onChange={(e) => setPreviewFile(e.target.files?.[0] || null)} className="hidden" />
                </label>
              </div>
              <div>
                <label className="block font-mono text-[10px] text-black/40 uppercase mb-1">MP3 Master (for MP3 lease delivery)</label>
                <label className="border border-dashed border-black/20 p-3 flex items-center gap-2 cursor-pointer hover:border-accent transition-colors">
                  <Upload className="w-4 h-4 text-black/30 flex-shrink-0" />
                  <span className="font-mono text-[10px] text-black/50 truncate">
                    {mp3File ? mp3File.name : 'Select file...'}
                  </span>
                  <input type="file" accept=".mp3,audio/mpeg" onChange={(e) => setMp3File(e.target.files?.[0] || null)} className="hidden" />
                </label>
              </div>
              <div>
                <label className="block font-mono text-[10px] text-black/40 uppercase mb-1">Trackout / Stems (ZIP)</label>
                <label className="border border-dashed border-black/20 p-3 flex items-center gap-2 cursor-pointer hover:border-accent transition-colors">
                  <Upload className="w-4 h-4 text-black/30 flex-shrink-0" />
                  <span className="font-mono text-[10px] text-black/50 truncate">
                    {trackoutFile ? trackoutFile.name : 'Select file...'}
                  </span>
                  <input type="file" accept=".zip,.rar" onChange={(e) => setTrackoutFile(e.target.files?.[0] || null)} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <label className="block font-mono text-xs text-black/60 uppercase tracking-wider mb-2">License Prices (in cents)</label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-mono text-[10px] text-black/40">{BEAT_LICENSES.mp3_lease.name}</label>
                <input type="number" value={mp3Price} onChange={(e) => setMp3Price(e.target.value)}
                  className="w-full border border-black/20 px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none" />
              </div>
              <div>
                <label className="font-mono text-[10px] text-black/40">{BEAT_LICENSES.trackout_lease.name}</label>
                <input type="number" value={trackoutPrice} onChange={(e) => setTrackoutPrice(e.target.value)}
                  className="w-full border border-black/20 px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none" />
              </div>
              <div>
                <label className="font-mono text-[10px] text-black/40">{BEAT_LICENSES.exclusive.name}</label>
                <input type="number" value={exclusivePrice} onChange={(e) => setExclusivePrice(e.target.value)}
                  disabled={!hasExclusive}
                  className="w-full border border-black/20 px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none disabled:opacity-30" />
              </div>
            </div>
            <p className="font-mono text-[10px] text-black/30 mt-1">
              Preview: MP3 {formatCents(parseInt(mp3Price) || 0)} · Trackout {formatCents(parseInt(trackoutPrice) || 0)}
              {hasExclusive && ` · Exclusive ${formatCents(parseInt(exclusivePrice) || 0)}`}
            </p>
          </div>

          {/* Options */}
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={hasExclusive} onChange={(e) => setHasExclusive(e.target.checked)}
                className="w-4 h-4 accent-accent" />
              <span className="font-mono text-xs text-black/60">Exclusive available</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={containsSamples} onChange={(e) => setContainsSamples(e.target.checked)}
                className="w-4 h-4 accent-accent" />
              <span className="font-mono text-xs text-black/60">Contains samples</span>
            </label>
          </div>

          {containsSamples && (
            <div>
              <label className="block font-mono text-xs text-black/60 uppercase tracking-wider mb-1">Sample Details</label>
              <input type="text" value={sampleDetails} onChange={(e) => setSampleDetails(e.target.value)}
                className="w-full border border-black/20 px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none"
                placeholder="Source, clearance status, royalty-free library used, etc." />
            </div>
          )}

          {uploadError && (
            <p className="font-mono text-sm text-red-600">{uploadError}</p>
          )}

          <button
            onClick={handleUpload}
            disabled={!previewFile || !title || uploading}
            className="bg-black text-white font-mono text-sm font-bold uppercase tracking-wider px-6 py-3 hover:bg-black/80 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload Beat'}
          </button>
        </div>
      )}

      {/* Stats */}
      {beats.length > 0 && (
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
      )}

      {/* Beat list */}
      {beats.length === 0 && !showForm ? (
        <div className="border-2 border-black/10 p-12 text-center">
          <Music className="w-12 h-12 text-black/10 mx-auto mb-4" />
          <p className="font-mono text-sm text-black/40 mb-4">No beats yet. Upload your first beat!</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-accent text-black font-mono text-xs font-bold uppercase tracking-wider px-5 py-2.5 hover:bg-accent/90 inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Upload Beat
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {beats.map((beat) => (
            <div key={beat.id} className={`border-2 p-4 ${
              beat.status === 'sold_exclusive' ? 'border-accent/30 bg-accent/5' : 'border-black/10'
            }`}>
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm font-bold">{beat.title}</p>
                    {beat.status === 'sold_exclusive' && (
                      <span className="bg-accent/20 text-accent font-mono text-[10px] font-bold uppercase px-1.5 py-0.5">Sold Exclusive</span>
                    )}
                  </div>
                  <p className="font-mono text-xs text-black/50 mt-0.5">
                    {beat.genre}{beat.bpm && ` · ${beat.bpm} BPM`}{beat.musical_key && ` · ${beat.musical_key}`}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {beat.mp3_lease_price && <span className="font-mono text-[10px] text-black/40">MP3: {formatCents(beat.mp3_lease_price)}</span>}
                    {beat.trackout_lease_price && <span className="font-mono text-[10px] text-black/40">Trackout: {formatCents(beat.trackout_lease_price)}</span>}
                    {beat.exclusive_price && beat.has_exclusive && <span className="font-mono text-[10px] text-accent font-bold">EXCL: {formatCents(beat.exclusive_price)}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-mono text-xs text-green-600 inline-flex items-center gap-1">
                    <ShoppingCart className="w-3 h-3" /> {beat.lease_count} leases
                  </p>
                  <p className="font-mono text-xs text-black/40 mt-0.5">
                    {formatCents(beat.total_lease_revenue)} gross
                  </p>
                </div>
                {beat.preview_url && (
                  <audio controls preload="none" className="hidden sm:block max-w-[160px] flex-shrink-0">
                    <source src={beat.preview_url} type="audio/mpeg" />
                  </audio>
                )}
                <button onClick={() => deleteBeat(beat.id)} className="text-red-400 hover:text-red-600 p-2 flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
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
