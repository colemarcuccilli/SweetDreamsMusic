// lib/media-cart.ts
//
// Pure types for the new cart-pattern media booking UX. The cart is a
// client-side staging area: each item captures an offering + the buyer's
// configurator choices (for packages) + project details (artist / songs /
// vibe / etc). Cart submit POSTs the whole array to /api/media/checkout
// which creates a single Stripe session with multiple line items, then
// the webhook fans out into one media_bookings row per item.
//
// Why client-only state (no DB persistence pre-checkout): the cart is
// ephemeral by design. If the buyer closes the tab, they re-pick — same
// as any e-commerce shopping cart. A page refresh wipes it; that's
// acceptable for a low-frequency, high-consideration purchase.
//
// Pure module — safe to import from client + server. No Supabase, no
// next/headers.

import type { MediaOffering } from './media';
import type { ConfiguredComponents } from './media-config';

// ============================================================
// Project details — collected per cart item
// ============================================================

/**
 * The questionnaire shape collected on each cart item. Mirrors the
 * media_bookings.project_details JSONB that the webhook writes. Only
 * artist_name / songs / vibe are required; everything else is optional.
 */
export interface MediaProjectDetails {
  project_name?: string | null;
  artist_name: string;
  songs: string;
  vibe: string;
  references?: string | null;
  release_date?: string | null;
  notes?: string | null;
}

// ============================================================
// Cart item — one row in the buyer's cart
// ============================================================

/**
 * One offering in the buyer's cart. The `id` is a client-generated
 * (crypto.randomUUID) identifier so we can have MULTIPLE entries for
 * the SAME offering (e.g., two short videos for two different songs)
 * without collisions. The server doesn't trust this id — it just lets
 * the UI key React lists.
 */
export interface MediaCartItem {
  /** Client-side UUID. Used for React keys + cart removal. */
  id: string;
  /** Full offering snapshot at time of add — read-only from cart's perspective. */
  offering: MediaOffering;
  /**
   * Set when the offering is configurable (packages with slots). Captured
   * at add-to-cart time; the user must re-add if they want to change.
   * Empty for non-configurable offerings.
   */
  configuredComponents?: ConfiguredComponents;
  projectDetails: MediaProjectDetails;
  /**
   * Computed price at add-to-cart time, for display in the cart summary.
   * The server recomputes this independently before charging — never
   * trust the client price.
   */
  computedPriceCents: number;
}

// ============================================================
// Cart payload — what the client POSTs to checkout
// ============================================================

/**
 * The shape /api/media/checkout accepts. We strip the heavy `offering`
 * snapshot and re-fetch on the server (the offering may have been
 * edited since the buyer added it; we want fresh canonical data).
 */
export interface MediaCheckoutCartItem {
  /** Client-side cart-item id, only used for echoing back in errors. */
  id: string;
  slug: string;
  configured_components?: ConfiguredComponents;
  project_details: MediaProjectDetails;
}

export function toCheckoutPayload(items: MediaCartItem[]): MediaCheckoutCartItem[] {
  return items.map((it) => ({
    id: it.id,
    slug: it.offering.slug,
    configured_components: it.configuredComponents,
    project_details: it.projectDetails,
  }));
}

// ============================================================
// Validation helpers
// ============================================================

/**
 * Minimum-fields check for project details. The form should validate the
 * same rule but we keep it here too so a manually-constructed cart item
 * (e.g., from a future quick-add-to-cart helper) can't sneak in empty.
 */
export function isProjectDetailsComplete(d: MediaProjectDetails): boolean {
  return (
    typeof d.artist_name === 'string' && d.artist_name.trim().length >= 2 &&
    typeof d.songs === 'string' && d.songs.trim().length >= 2 &&
    typeof d.vibe === 'string' && d.vibe.trim().length >= 2
  );
}

export const EMPTY_PROJECT_DETAILS: MediaProjectDetails = {
  project_name: '',
  artist_name: '',
  songs: '',
  vibe: '',
  references: '',
  release_date: '',
  notes: '',
};
