'use client';

// components/media/MediaCartSidebar.tsx
//
// Two presentations of the same cart state:
//   • Desktop  — sticky right rail when cart has items
//   • Mobile   — fixed bottom bar with item count + open-drawer button;
//                tapping opens an overlay drawer with the full cart
//
// Posts to /api/media/checkout with the full cart array on submit. The
// API recomputes prices server-side (never trusts client computedPrice)
// and returns the Stripe URL we redirect to.

import { useState } from 'react';
import { ShoppingCart, X, Trash2, ArrowRight } from 'lucide-react';
import { useMediaCart } from './MediaCartContext';
import { toCheckoutPayload, type MediaCartItem } from '@/lib/media-cart';

function fmt(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function MediaCartSidebar() {
  const cart = useMediaCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  async function checkout() {
    if (cart.items.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/media/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart: toCheckoutPayload(cart.items) }),
      });
      if (res.status === 401) {
        window.location.href = '/login?redirect=/dashboard/media';
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to start checkout. Try again.');
        setSubmitting(false);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('Checkout URL missing — please try again.');
        setSubmitting(false);
      }
    } catch (e) {
      console.error('[media-cart] checkout error:', e);
      setError('Network error — try again.');
      setSubmitting(false);
    }
  }

  if (cart.items.length === 0) return null;

  return (
    <>
      {/* DESKTOP — sticky right rail. Hidden on small screens; the bottom
          bar takes over there. */}
      <aside className="hidden lg:block fixed right-4 top-32 w-80 max-h-[calc(100vh-9rem)] overflow-y-auto z-30 bg-white border-2 border-black shadow-lg">
        <CartContents
          items={cart.items}
          totalCents={cart.totalCents}
          onRemove={cart.removeItem}
          onCheckout={checkout}
          submitting={submitting}
          error={error}
        />
      </aside>

      {/* MOBILE — fixed bottom bar with item count, tap opens drawer */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="fixed bottom-4 right-4 left-4 z-30 bg-accent text-black font-mono text-sm font-bold uppercase tracking-wider px-5 py-4 inline-flex items-center justify-between shadow-lg"
        >
          <span className="inline-flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Cart · {cart.items.length} item{cart.items.length === 1 ? '' : 's'}
          </span>
          <span className="font-bold">{fmt(cart.totalCents)}</span>
        </button>

        {mobileOpen && (
          <div className="fixed inset-0 z-40 bg-black/50 flex items-end" onClick={() => setMobileOpen(false)}>
            <div
              className="bg-white w-full max-h-[85vh] overflow-y-auto border-t-4 border-accent"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-black/10 sticky top-0 bg-white z-10">
                <p className="font-mono text-sm font-bold uppercase tracking-wider">Your cart</p>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="text-black/50 hover:text-black"
                  aria-label="Close cart"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <CartContents
                items={cart.items}
                totalCents={cart.totalCents}
                onRemove={cart.removeItem}
                onCheckout={checkout}
                submitting={submitting}
                error={error}
                noBorder
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Shared cart content list — used by both desktop sidebar + mobile drawer.
// ──────────────────────────────────────────────────────────────────────
function CartContents({
  items,
  totalCents,
  onRemove,
  onCheckout,
  submitting,
  error,
  noBorder,
}: {
  items: MediaCartItem[];
  totalCents: number;
  onRemove: (id: string) => void;
  onCheckout: () => void;
  submitting: boolean;
  error: string | null;
  noBorder?: boolean;
}) {
  return (
    <div>
      {!noBorder && (
        <div className="p-4 border-b border-black/10 bg-black text-white">
          <p className="font-mono text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2">
            <ShoppingCart className="w-3.5 h-3.5" />
            Your cart · {items.length}
          </p>
        </div>
      )}
      <ul className="p-4 space-y-3">
        {items.map((it) => (
          <li key={it.id} className="border border-black/10 p-3">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="font-mono text-sm font-bold uppercase tracking-wider">
                {it.offering.title}
              </p>
              <button
                type="button"
                onClick={() => onRemove(it.id)}
                className="text-black/40 hover:text-red-700 shrink-0"
                aria-label="Remove from cart"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="font-mono text-xs text-black/60 mb-1.5">
              {it.projectDetails.artist_name} · {it.projectDetails.songs}
            </p>
            <p className="font-mono text-xs text-black/50 italic line-clamp-1 mb-2">
              {it.projectDetails.vibe}
            </p>
            <p className="font-mono text-sm font-bold text-accent">
              {fmt(it.computedPriceCents)}
            </p>
          </li>
        ))}
      </ul>
      <div className="p-4 border-t border-black/10 bg-black/[0.02] space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-xs uppercase tracking-wider text-black/60">
            Total
          </span>
          <span className="text-2xl font-bold tracking-tight">
            {fmt(totalCents)}
          </span>
        </div>
        {error && (
          <p className="font-mono text-[11px] text-red-700">{error}</p>
        )}
        <button
          type="button"
          onClick={onCheckout}
          disabled={submitting || items.length === 0}
          className="w-full bg-black text-white font-mono text-xs font-bold uppercase tracking-wider px-4 py-3 hover:bg-accent hover:text-black transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? 'Starting checkout…' : 'Checkout'}
          {!submitting && <ArrowRight className="w-3 h-3" />}
        </button>
      </div>
    </div>
  );
}
