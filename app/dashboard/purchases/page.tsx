'use client';

import { useState, useEffect } from 'react';
import { Music, Download, FileText, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react';
import { formatCents } from '@/lib/utils';
import { BEAT_LICENSES } from '@/lib/constants';
import Link from 'next/link';

interface Purchase {
  id: string;
  beat_id: string | null;
  license_type: string;
  amount_paid: number;
  download_count: number;
  license_text: string | null;
  payment_method: string | null;
  revoked_at: string | null;
  revoked_reason: string | null;
  created_at: string;
  beats: {
    id: string;
    title: string;
    producer: string;
    genre: string | null;
    cover_image_url: string | null;
    preview_url: string | null;
  } | null;
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLicense, setExpandedLicense] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/purchases')
      .then(r => r.json())
      .then(d => setPurchases(d.purchases || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleDownload(purchaseId: string) {
    setDownloading(purchaseId);
    try {
      const res = await fetch(`/api/beats/download?purchaseId=${purchaseId}`);
      const data = await res.json();
      if (data.downloads && data.downloads.length > 0) {
        for (const file of data.downloads) {
          const link = document.createElement('a');
          link.href = file.url;
          link.download = file.fileName;
          link.click();
        }
        // Update local download count
        setPurchases(prev => prev.map(p =>
          p.id === purchaseId ? { ...p, download_count: p.download_count + 1 } : p
        ));
      } else {
        alert(data.error || 'Download not available');
      }
    } catch {
      alert('Download failed');
    }
    setDownloading(null);
  }

  async function viewLicense(purchaseId: string) {
    if (expandedLicense === purchaseId) {
      setExpandedLicense(null);
      return;
    }

    // If license_text is already loaded, just toggle
    const purchase = purchases.find(p => p.id === purchaseId);
    if (purchase?.license_text) {
      setExpandedLicense(purchaseId);
      return;
    }

    // Fetch license from API
    try {
      const res = await fetch(`/api/beats/license?purchaseId=${purchaseId}`);
      const data = await res.json();
      if (data.license) {
        setPurchases(prev => prev.map(p =>
          p.id === purchaseId ? { ...p, license_text: data.license } : p
        ));
      }
    } catch { /* */ }
    setExpandedLicense(purchaseId);
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <p className="font-mono text-sm text-black/70">Loading purchases...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-heading-lg">MY PURCHASES</h1>
        <Link href="/beats" className="font-mono text-xs font-bold text-accent hover:underline">
          Browse Beats
        </Link>
      </div>

      {purchases.length === 0 ? (
        <div className="border-2 border-black/10 p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-black/10 mx-auto mb-4" />
          <p className="font-mono text-sm text-black/70 mb-4">No purchases yet</p>
          <Link href="/beats" className="bg-accent text-black font-mono text-xs font-bold uppercase tracking-wider px-6 py-3 hover:bg-accent/90 inline-block">
            Browse Beat Store
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="font-mono text-xs text-black/60">{purchases.length} purchase{purchases.length !== 1 ? 's' : ''}</p>

          {purchases.map(purchase => {
            const beat = Array.isArray(purchase.beats) ? purchase.beats[0] : purchase.beats;
            const license = BEAT_LICENSES[purchase.license_type as keyof typeof BEAT_LICENSES];
            const isExpanded = expandedLicense === purchase.id;
            const isRevoked = !!purchase.revoked_at;

            return (
              <div key={purchase.id} className={`border-2 overflow-hidden ${isRevoked ? 'border-red-200 bg-red-50/30' : 'border-black/10'}`}>
                {/* Revoked banner */}
                {purchase.revoked_at && (
                  <div className="bg-red-100 border-b border-red-200 px-4 py-2">
                    <p className="font-mono text-xs font-bold text-red-700 uppercase">
                      Lease Revoked — Exclusive rights purchased
                    </p>
                    <p className="font-mono text-[10px] text-red-600">
                      Revoked on {new Date(purchase.revoked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}. Downloads are no longer available. See your license agreement for details.
                    </p>
                  </div>
                )}

                <div className="p-4 flex items-start gap-4">
                  {/* Cover art */}
                  <div className={`w-16 h-16 bg-black/5 flex-shrink-0 flex items-center justify-center overflow-hidden ${isRevoked ? 'opacity-50' : ''}`}>
                    {beat?.cover_image_url ? (
                      <img src={beat.cover_image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Music className="w-6 h-6 text-black/20" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-mono text-sm font-bold truncate ${isRevoked ? 'text-black/40 line-through' : ''}`}>{beat?.title || 'Beat'}</p>
                    <p className="font-mono text-xs text-black/70">
                      {beat?.producer || 'Producer'}
                      {beat?.genre && ` · ${beat.genre}`}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {isRevoked ? (
                        <span className="bg-red-100 text-red-700 font-mono text-[10px] font-bold uppercase px-2 py-0.5">
                          Revoked
                        </span>
                      ) : (
                        <span className="bg-accent/20 text-accent font-mono text-[10px] font-bold uppercase px-2 py-0.5">
                          {license?.name || purchase.license_type}
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-black/60">
                        {formatCents(purchase.amount_paid)}
                      </span>
                      <span className="font-mono text-[10px] text-black/60">
                        {new Date(purchase.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {!isRevoked && (
                        <span className="font-mono text-[10px] text-black/60">
                          {purchase.download_count}/10 downloads
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {isRevoked ? (
                      <span className="font-mono text-[10px] text-red-500 font-bold uppercase px-3 py-2">
                        No Downloads
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDownload(purchase.id)}
                        disabled={downloading === purchase.id || purchase.download_count >= 10}
                        className="bg-accent text-black font-mono text-[10px] font-bold uppercase px-3 py-2 hover:bg-accent/90 disabled:opacity-50 inline-flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        {downloading === purchase.id ? 'Loading...' : purchase.download_count >= 10 ? 'Limit Reached' : 'Download'}
                      </button>
                    )}
                    <button
                      onClick={() => viewLicense(purchase.id)}
                      className="border border-black/20 text-black font-mono text-[10px] font-bold uppercase px-3 py-2 hover:border-black/40 inline-flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3" />
                      License
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Expanded license */}
                {isExpanded && (
                  <div className="border-t border-black/10 bg-black/[0.02] p-4">
                    <h4 className="font-mono text-xs font-bold uppercase tracking-wider mb-3">License Agreement</h4>
                    <pre className="font-mono text-xs text-black/70 whitespace-pre-wrap max-h-96 overflow-y-auto border border-black/10 bg-white p-4">
                      {purchase.license_text || 'Loading license...'}
                    </pre>
                    <p className="font-mono text-[10px] text-black/60 mt-2">
                      Purchase ID: {purchase.id} · This license is stored in your account and can be accessed at any time.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
