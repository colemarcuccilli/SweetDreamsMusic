'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Music, X, Upload, TrendingUp, ShoppingCart } from 'lucide-react';
import { formatCents } from '@/lib/utils';
import { BEAT_LICENSES } from '@/lib/constants';

interface Producer {
  id: string;
  display_name: string;
  producer_name: string | null;
  profile_picture_url: string | null;
}

interface Beat {
  id: string;
  title: string;
  producer: string;
  producer_id: string | null;
  producer_profile?: { display_name: string; producer_name: string | null } | null;
  genre: string | null;
  bpm: number | null;
  musical_key: string | null;
  tags: string[];
  preview_url: string | null;
  mp3_lease_price: number | null;
  trackout_lease_price: number | null;
  exclusive_price: number | null;
  has_exclusive: boolean;
  contains_samples: boolean;
  sample_details: string | null;
  lease_count: number;
  total_lease_revenue: number;
  status: string;
  created_at: string;
}

export default function BeatManager() {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [producerId, setProducerId] = useState('');
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

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/beats').then((r) => r.json()),
      fetch('/api/admin/producers/list').then((r) => r.json()),
    ]).then(([beatsData, producersData]) => {
      setBeats(beatsData.beats || []);
      setProducers(producersData.producers || []);
      setLoading(false);
    });
  }, []);

  async function handleUpload() {
    if (!previewFile || !title || !producerId) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('preview_file', previewFile);
    formData.append('title', title);
    formData.append('producer_id', producerId);
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

    const res = await fetch('/api/admin/beats', { method: 'POST', body: formData });
    const data = await res.json();

    if (data.beat) {
      setBeats((prev) => [data.beat, ...prev]);
      resetForm();
      setShowForm(false);
    }
    setUploading(false);
  }

  async function deleteBeat(id: string) {
    if (!confirm('Delete this beat? This cannot be undone.')) return;
    await fetch('/api/admin/beats', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setBeats((prev) => prev.filter((b) => b.id !== id));
  }

  function resetForm() {
    setTitle(''); setProducerId(''); setGenre(''); setBpm(''); setMusicalKey('');
    setTags(''); setPreviewFile(null); setMp3File(null); setTrackoutFile(null);
    setMp3Price('2999'); setTrackoutPrice('7499'); setExclusivePrice('40000');
    setHasExclusive(true); setContainsSamples(false); setSampleDetails('');
  }

  function getProducerName(beat: Beat): string {
    if (beat.producer_profile?.producer_name) return beat.producer_profile.producer_name;
    if (beat.producer_profile?.display_name) return beat.producer_profile.display_name;
    return beat.producer || 'Unknown';
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-heading-md">BEAT STORE</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-accent text-black font-mono text-xs font-bold uppercase tracking-wider px-4 py-2 hover:bg-accent/90 inline-flex items-center gap-1"
        >
          {showForm ? <><X className="w-3 h-3" /> Cancel</> : <><Plus className="w-3 h-3" /> Add Beat</>}
        </button>
      </div>

      {/* Stats */}
      {beats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="border-2 border-black/10 p-4">
            <p className="font-mono text-[10px] text-black/40 uppercase tracking-wider">Total Beats</p>
            <p className="text-heading-sm">{beats.filter((b) => b.status === 'active').length}</p>
          </div>
          <div className="border-2 border-black/10 p-4">
            <p className="font-mono text-[10px] text-black/40 uppercase tracking-wider">Total Leases</p>
            <p className="text-heading-sm">{beats.reduce((sum, b) => sum + (b.lease_count || 0), 0)}</p>
          </div>
          <div className="border-2 border-black/10 p-4">
            <p className="font-mono text-[10px] text-black/40 uppercase tracking-wider">Lease Revenue</p>
            <p className="text-heading-sm">{formatCents(beats.reduce((sum, b) => sum + (b.total_lease_revenue || 0), 0))}</p>
          </div>
          <div className="border-2 border-black/10 p-4">
            <p className="font-mono text-[10px] text-black/40 uppercase tracking-wider">Exclusives Sold</p>
            <p className="text-heading-sm">{beats.filter((b) => b.status === 'sold_exclusive').length}</p>
          </div>
        </div>
      )}

      {/* Upload Form */}
      {showForm && (
        <div className="border-2 border-accent p-6 mb-8 space-y-4">
          <h3 className="font-mono text-sm font-bold uppercase">New Beat</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-xs text-black/60 uppercase tracking-wider mb-1">Title *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-black/20 px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none" placeholder="Beat title" />
            </div>
            <div>
              <label className="block font-mono text-xs text-black/60 uppercase tracking-wider mb-1">Producer *</label>
              <select
                value={producerId}
                onChange={(e) => setProducerId(e.target.value)}
                className="w-full border border-black/20 px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none bg-white"
              >
                <option value="">Select producer...</option>
                {producers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.producer_name || p.display_name}
                  </option>
                ))}
              </select>
              {producers.length === 0 && (
                <p className="font-mono text-[10px] text-red-500 mt-1">No approved producers yet. Approve one in the Producers tab first.</p>
              )}
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
          </div>

          <div>
            <label className="block font-mono text-xs text-black/60 uppercase tracking-wider mb-1">Tags (comma separated)</label>
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)}
              className="w-full border border-black/20 px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none" placeholder="dark, trap, melodic" />
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

          <button
            onClick={handleUpload}
            disabled={!previewFile || !title || !producerId || uploading}
            className="bg-black text-white font-mono text-sm font-bold uppercase tracking-wider px-6 py-3 hover:bg-black/80 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Add Beat'}
          </button>
        </div>
      )}

      {/* Beats List */}
      {loading ? (
        <p className="font-mono text-sm text-black/40">Loading beats...</p>
      ) : beats.length === 0 ? (
        <div className="border-2 border-black/10 p-12 text-center">
          <Music className="w-12 h-12 text-black/10 mx-auto mb-4" />
          <p className="font-mono text-sm text-black/40">No beats yet. Add your first beat above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {beats.map((beat) => (
            <div key={beat.id} className={`border-2 p-4 flex items-center gap-4 ${
              beat.status === 'sold_exclusive' ? 'border-accent/30 bg-accent/5' :
              beat.status === 'inactive' ? 'border-black/5 opacity-50' :
              'border-black/10'
            }`}>
              <div className="w-12 h-12 bg-black/5 flex items-center justify-center flex-shrink-0">
                <Music className="w-5 h-5 text-black/20" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm font-bold truncate">{beat.title}</p>
                  {beat.status === 'sold_exclusive' && (
                    <span className="bg-accent/20 text-accent font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 flex-shrink-0">Sold</span>
                  )}
                  {beat.status === 'pending_review' && (
                    <span className="bg-amber-100 text-amber-700 font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 flex-shrink-0">Pending Review</span>
                  )}
                  {beat.status === 'active' && (
                    <span className="bg-green-100 text-green-700 font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 flex-shrink-0">Live</span>
                  )}
                  {beat.contains_samples && (
                    <span className="bg-amber-100 text-amber-700 font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 flex-shrink-0">Samples</span>
                  )}
                </div>
                <p className="font-mono text-xs text-black/50">
                  {getProducerName(beat)}
                  {beat.bpm && ` · ${beat.bpm} BPM`}
                  {beat.musical_key && ` · ${beat.musical_key}`}
                  {beat.genre && ` · ${beat.genre}`}
                </p>
                <div className="flex flex-wrap gap-3 mt-1">
                  <div className="flex flex-wrap gap-2">
                    {beat.mp3_lease_price && <span className="font-mono text-[10px] text-black/40">MP3: {formatCents(beat.mp3_lease_price)}</span>}
                    {beat.trackout_lease_price && <span className="font-mono text-[10px] text-black/40">Trackout: {formatCents(beat.trackout_lease_price)}</span>}
                    {beat.exclusive_price && beat.has_exclusive && <span className="font-mono text-[10px] text-accent font-bold">EXCL: {formatCents(beat.exclusive_price)}</span>}
                  </div>
                  {(beat.lease_count > 0 || beat.total_lease_revenue > 0) && (
                    <div className="flex gap-2">
                      <span className="font-mono text-[10px] text-green-600 inline-flex items-center gap-0.5">
                        <ShoppingCart className="w-3 h-3" /> {beat.lease_count} leases
                      </span>
                      <span className="font-mono text-[10px] text-green-600 inline-flex items-center gap-0.5">
                        <TrendingUp className="w-3 h-3" /> {formatCents(beat.total_lease_revenue)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {beat.preview_url && (
                <audio controls preload="none" className="hidden sm:block max-w-[180px]">
                  <source src={beat.preview_url} type="audio/mpeg" />
                </audio>
              )}
              <button onClick={() => deleteBeat(beat.id)} className="text-red-400 hover:text-red-600 p-2 flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
