'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Music, X } from 'lucide-react';
import { formatCents } from '@/lib/utils';
import { BEAT_LICENSES } from '@/lib/constants';

interface Beat {
  id: string;
  title: string;
  producer: string;
  genre: string | null;
  bpm: number | null;
  musical_key: string | null;
  tags: string[];
  preview_url: string | null;
  mp3_lease_price: number | null;
  wav_lease_price: number | null;
  unlimited_price: number | null;
  exclusive_price: number | null;
  status: string;
  created_at: string;
}

export default function BeatManager() {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [producer, setProducer] = useState('');
  const [genre, setGenre] = useState('');
  const [bpm, setBpm] = useState('');
  const [musicalKey, setMusicalKey] = useState('');
  const [tags, setTags] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [mp3Price, setMp3Price] = useState('2999');
  const [wavPrice, setWavPrice] = useState('4999');
  const [unlimitedPrice, setUnlimitedPrice] = useState('9999');
  const [exclusivePrice, setExclusivePrice] = useState('29999');

  useEffect(() => {
    fetch('/api/admin/beats')
      .then((r) => r.json())
      .then((d) => setBeats(d.beats || []))
      .finally(() => setLoading(false));
  }, []);

  async function handleUpload() {
    if (!audioFile || !title || !producer) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('audio_file', audioFile);
    formData.append('title', title);
    formData.append('producer', producer);
    formData.append('genre', genre);
    formData.append('bpm', bpm);
    formData.append('key', musicalKey);
    formData.append('tags', tags);
    formData.append('mp3_lease_price', mp3Price);
    formData.append('wav_lease_price', wavPrice);
    formData.append('unlimited_price', unlimitedPrice);
    formData.append('exclusive_price', exclusivePrice);

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
    setTitle(''); setProducer(''); setGenre(''); setBpm(''); setMusicalKey('');
    setTags(''); setAudioFile(null); setMp3Price('2999'); setWavPrice('4999');
    setUnlimitedPrice('9999'); setExclusivePrice('29999');
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
              <input type="text" value={producer} onChange={(e) => setProducer(e.target.value)}
                className="w-full border border-black/20 px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none" placeholder="Producer name" />
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

          <div>
            <label className="block font-mono text-xs text-black/60 uppercase tracking-wider mb-1">Audio File *</label>
            <input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
              className="w-full font-mono text-xs" />
          </div>

          {/* Pricing */}
          <div>
            <label className="block font-mono text-xs text-black/60 uppercase tracking-wider mb-2">License Prices (in cents)</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="font-mono text-[10px] text-black/40">{BEAT_LICENSES.mp3_lease.name}</label>
                <input type="number" value={mp3Price} onChange={(e) => setMp3Price(e.target.value)}
                  className="w-full border border-black/20 px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none" />
              </div>
              <div>
                <label className="font-mono text-[10px] text-black/40">{BEAT_LICENSES.wav_lease.name}</label>
                <input type="number" value={wavPrice} onChange={(e) => setWavPrice(e.target.value)}
                  className="w-full border border-black/20 px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none" />
              </div>
              <div>
                <label className="font-mono text-[10px] text-black/40">{BEAT_LICENSES.unlimited.name}</label>
                <input type="number" value={unlimitedPrice} onChange={(e) => setUnlimitedPrice(e.target.value)}
                  className="w-full border border-black/20 px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none" />
              </div>
              <div>
                <label className="font-mono text-[10px] text-black/40">{BEAT_LICENSES.exclusive.name}</label>
                <input type="number" value={exclusivePrice} onChange={(e) => setExclusivePrice(e.target.value)}
                  className="w-full border border-black/20 px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none" />
              </div>
            </div>
            <p className="font-mono text-[10px] text-black/30 mt-1">
              Preview: MP3 {formatCents(parseInt(mp3Price) || 0)} · WAV {formatCents(parseInt(wavPrice) || 0)} · Unlimited {formatCents(parseInt(unlimitedPrice) || 0)} · Exclusive {formatCents(parseInt(exclusivePrice) || 0)}
            </p>
          </div>

          <button
            onClick={handleUpload}
            disabled={!audioFile || !title || !producer || uploading}
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
            <div key={beat.id} className="border-2 border-black/10 p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-black/5 flex items-center justify-center flex-shrink-0">
                <Music className="w-5 h-5 text-black/20" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm font-bold truncate">{beat.title}</p>
                <p className="font-mono text-xs text-black/50">
                  {beat.producer}
                  {beat.bpm && ` · ${beat.bpm} BPM`}
                  {beat.musical_key && ` · ${beat.musical_key}`}
                  {beat.genre && ` · ${beat.genre}`}
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {beat.mp3_lease_price && <span className="font-mono text-[10px] text-black/40">MP3: {formatCents(beat.mp3_lease_price)}</span>}
                  {beat.wav_lease_price && <span className="font-mono text-[10px] text-black/40">WAV: {formatCents(beat.wav_lease_price)}</span>}
                  {beat.unlimited_price && <span className="font-mono text-[10px] text-black/40">UNL: {formatCents(beat.unlimited_price)}</span>}
                  {beat.exclusive_price && <span className="font-mono text-[10px] text-accent font-bold">EXCL: {formatCents(beat.exclusive_price)}</span>}
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
