'use client';

// components/admin/PackageTemplates.tsx
//
// Round A read-only view: lists package templates with their line items.
// Empty in production until Round B's calculator can create them. Sets
// the navigation slot + UI shape so subsequent rounds slot in cleanly.
//
// Live behaviour today:
//   • Empty list → friendly empty state ("Round B will add the calculator
//     here") so admins don't think the page is broken.
//   • Future templates → renders one card per template with its lines.
//
// Anything destructive (edit, archive, generate-quote) is a Round B+
// feature. Buttons exist as disabled placeholders so the layout doesn't
// shift when actions land.

import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, Package, Crown, Users, Clock, Film, Music, Archive } from 'lucide-react';

interface TemplateLine {
  id: string;
  kind: 'studio_hours' | 'media_offering' | 'beat_credit' | 'custom';
  quantity: number;
  media_offering_id: string | null;
  full_price_cents: number;
  package_value_cents: number;
  notes: string | null;
  sort_order: number;
}

interface PackageTemplate {
  id: string;
  name: string;
  description: string | null;
  slug: string | null;
  audience: 'solo' | 'band';
  is_membership: boolean;
  duration_days: number | null;
  membership_months: number | null;
  price_cents: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  lines: TemplateLine[];
}

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function lineKindLabel(line: TemplateLine): string {
  switch (line.kind) {
    case 'studio_hours':
      return `${line.quantity} studio hour${line.quantity === 1 ? '' : 's'}`;
    case 'media_offering':
      return line.notes || `Media offering × ${line.quantity}`;
    case 'beat_credit':
      return `${line.quantity} beat credit${line.quantity === 1 ? '' : 's'}`;
    case 'custom':
      return line.notes || `Custom × ${line.quantity}`;
  }
}

function lineKindIcon(kind: TemplateLine['kind']) {
  switch (kind) {
    case 'studio_hours': return Clock;
    case 'media_offering': return Film;
    case 'beat_credit': return Music;
    case 'custom': return Package;
  }
}

export default function PackageTemplates() {
  const [templates, setTemplates] = useState<PackageTemplate[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/packages/templates', { cache: 'no-store' });
        if (cancelled) return;
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body?.error || 'Could not load package templates.');
          return;
        }
        const body = await res.json();
        setTemplates((body.templates ?? []) as PackageTemplate[]);
      } catch {
        if (!cancelled) setError('Network error while loading templates.');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return (
      <div className="border-2 border-red-300 bg-red-50 p-4 inline-flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-red-700" />
        <p className="font-mono text-sm text-red-900">{error}</p>
      </div>
    );
  }

  if (templates === null) {
    return (
      <div className="text-center py-16">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-black/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + (disabled-for-now) primary action */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="font-mono text-accent text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase mb-2">
            Admin · Packages & Memberships
          </p>
          <h1 className="text-heading-xl mb-2">PACKAGE TEMPLATES</h1>
          <p className="font-mono text-xs text-black/60 max-w-2xl">
            One-time bundles and 3-month memberships you can quote to customers.
            All session valuations use Studio B rate as the baseline. Studio A,
            Sweet 4, same-day, and night surcharges are paid separately at
            booking time.
          </p>
        </div>
        <button
          disabled
          title="Coming in Round B (calculator)"
          className="bg-black/10 text-black/40 font-mono text-xs font-bold uppercase tracking-wider px-4 py-3 cursor-not-allowed inline-flex items-center gap-2"
        >
          + New Template
        </button>
      </div>

      {/* Body */}
      {templates.length === 0 ? (
        <div className="border-2 border-dashed border-black/10 p-12 text-center">
          <Package className="w-8 h-8 text-black/30 mx-auto mb-3" />
          <p className="font-mono text-sm text-black/60 mb-2">
            No package templates yet.
          </p>
          <p className="font-mono text-[11px] text-black/45 max-w-md mx-auto">
            Round B will add the calculator UI here — admin builds a template
            (line items, discount, valuation) and saves it. Then quotes can be
            generated from any template and sent to customers.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {templates.map((tpl) => {
            const totalFullPrice = tpl.lines.reduce((s, l) => s + l.full_price_cents, 0);
            const discountCents = Math.max(0, totalFullPrice - tpl.price_cents);
            const discountPct = totalFullPrice > 0
              ? Math.round((discountCents / totalFullPrice) * 100)
              : 0;
            return (
              <li key={tpl.id}>
                <div className={`border-2 p-5 ${tpl.is_active ? 'border-black/15' : 'border-black/5 bg-black/[0.02]'}`}>
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-base">{tpl.name}</h3>
                        {tpl.is_membership && (
                          <span className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-accent text-black font-bold inline-flex items-center gap-1">
                            <Crown className="w-2.5 h-2.5" />
                            Membership
                          </span>
                        )}
                        {tpl.audience === 'band' && (
                          <span className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 border border-black/30 font-bold inline-flex items-center gap-1">
                            <Users className="w-2.5 h-2.5" />
                            Band
                          </span>
                        )}
                        {!tpl.is_active && (
                          <span className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-black/10 text-black/50 font-bold inline-flex items-center gap-1">
                            <Archive className="w-2.5 h-2.5" />
                            Archived
                          </span>
                        )}
                      </div>
                      {tpl.description && (
                        <p className="font-mono text-xs text-black/65">{tpl.description}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-black/50">
                        {tpl.is_membership ? 'Per month' : 'One-time'}
                      </p>
                      <p className="font-bold text-lg">{formatMoney(tpl.price_cents)}</p>
                      {tpl.is_membership && tpl.membership_months && (
                        <p className="font-mono text-[10px] text-black/50">
                          × {tpl.membership_months} months
                        </p>
                      )}
                      {discountCents > 0 && (
                        <p className="font-mono text-[10px] text-accent font-bold mt-1">
                          {discountPct}% off retail
                        </p>
                      )}
                    </div>
                  </div>

                  {tpl.lines.length > 0 && (
                    <div className="border-t border-black/10 pt-3 mt-3">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-black/45 mb-2">
                        Includes
                      </p>
                      <ul className="space-y-1">
                        {tpl.lines.map((line) => {
                          const Icon = lineKindIcon(line.kind);
                          return (
                            <li key={line.id} className="flex items-center justify-between gap-3 text-sm">
                              <div className="inline-flex items-center gap-2 min-w-0">
                                <Icon className="w-3.5 h-3.5 text-black/45 shrink-0" />
                                <span className="font-mono text-xs truncate">{lineKindLabel(line)}</span>
                              </div>
                              <div className="font-mono text-[10px] text-black/45 shrink-0">
                                Retail {formatMoney(line.full_price_cents)}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
