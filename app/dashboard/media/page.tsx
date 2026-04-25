// app/dashboard/media/page.tsx
//
// Logged-in Media Hub catalog. THIS is where prices live and where buying
// happens. Public `/media` is the showcase + offerings menu with NO prices;
// pricing exists only behind auth.
//
// Mirrors the public page's section ordering (packages → standalones) but
// adds:
//   - Prepaid balance widget at the top (studio_credits "gift card")
//   - Visible prices via formatOfferingPrice (without hidePrices)
//   - Each tile links to /dashboard/media/[slug] for the buy flow
//   - Solo / band visibility filter via isOfferingVisibleTo
//
// Spec: SweetDreamsMusicVault/Features/Media-Booking-Hub.md

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Package as PackageIcon, Sparkles, Wallet, Calendar } from 'lucide-react';
import { getSessionUser } from '@/lib/auth';
import { getUserBands } from '@/lib/bands-server';
import {
  getActiveOfferings,
  getStudioCreditBalanceForUser,
} from '@/lib/media-server';
import { getMediaBookingsForOwner } from '@/lib/media-scheduling-server';
import {
  groupOfferings,
  isOfferingVisibleTo,
  formatOfferingPrice,
  viewerEligibilityFromBands,
} from '@/lib/media';
import { formatCents } from '@/lib/utils';
import DashboardNav from '@/components/layout/DashboardNav';

export const metadata: Metadata = {
  title: 'Media Hub — Sweet Dreams Music',
  description: 'Browse, configure, and book Sweet Dreams media services and studio packages.',
};

// Catalog rows are admin-edited. Prepaid balance changes after every
// purchase. Both are cheap reads — dynamic is correct here.
export const dynamic = 'force-dynamic';

export default async function DashboardMediaPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?redirect=/dashboard/media');

  const bandMemberships = await getUserBands(user.id);
  const viewer = viewerEligibilityFromBands({
    authenticated: true,
    bandCount: bandMemberships.length,
  });

  // Parallel fetch — catalog, credit balance, and order count are
  // independent. Order count drives the "Your orders" entry point in
  // the hero — if zero we still show the link, but with hint copy.
  const [allOfferings, balance, orders] = await Promise.all([
    getActiveOfferings(),
    getStudioCreditBalanceForUser(user.id),
    getMediaBookingsForOwner({
      userId: user.id,
      bandIds: bandMemberships.map((m) => m.band_id),
    }),
  ]);
  const orderCount = orders.length;

  const visible = allOfferings.filter((o) => isOfferingVisibleTo(o, viewer));
  const { packages, services } = groupOfferings(visible);

  return (
    <>
      <DashboardNav
        role={user.role}
        isProducer={user.is_producer}
        displayName={user.profile?.display_name}
        email={user.email}
        profileSlug={user.profile?.public_profile_slug}
      />

      {/* Hero + balance widget */}
      <section className="bg-black text-white py-10 sm:py-14 border-b-2 border-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-2xl">
              <p className="font-mono text-accent text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase mb-2">
                Media Hub
              </p>
              <h1 className="text-display-sm sm:text-display-md mb-3">BROWSE & BOOK</h1>
              <p className="font-mono text-white/70 text-body-sm">
                Standalone services and bundled studio packages. Packages save you money vs the
                same line items à la carte — and the studio time inside flows into your prepaid
                balance.
              </p>
            </div>

            {/* Prepaid balance + orders link — the "gift card" widget */}
            <div className="space-y-3 sm:min-w-[320px]">
              <div className="bg-white/[0.04] border border-white/15 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4 text-accent" />
                  <p className="font-mono text-xs font-semibold tracking-[0.2em] uppercase text-white/60">
                    Prepaid Balance
                  </p>
                </div>
                {balance.hoursRemaining > 0 ? (
                  <>
                    <p className="font-mono text-3xl font-bold mb-1">
                      {balance.hoursRemaining.toFixed(1)} hrs
                    </p>
                    <p className="font-mono text-xs text-white/60 mb-3">
                      Studio time available — use it on any session.{' '}
                      {balance.costBasisCents > 0 && (
                        <>Value: {formatCents(balance.costBasisCents)}.</>
                      )}
                    </p>
                    <Link
                      href="/dashboard/media/credits"
                      className="font-mono text-[11px] font-bold uppercase tracking-wider text-accent hover:underline inline-flex items-center gap-1 no-underline"
                    >
                      Book studio time with credits
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="font-mono text-3xl font-bold mb-1 text-white/30">0 hrs</p>
                    <p className="font-mono text-xs text-white/60">
                      Buy a package to load your balance with studio time.
                    </p>
                  </>
                )}
              </div>

              {/* Orders entry point — schedule sessions, view deliverables */}
              <Link
                href="/dashboard/media/orders"
                className="block bg-accent text-black border border-accent p-4 hover:bg-accent/90 transition-colors no-underline"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="font-mono text-xs font-bold uppercase tracking-wider">
                      Your orders {orderCount > 0 && <>· {orderCount}</>}
                    </span>
                  </div>
                  <ArrowRight className="w-3 h-3" />
                </div>
                <p className="font-mono text-[11px] mt-1 text-black/70">
                  {orderCount > 0
                    ? 'Schedule sessions and view deliverables.'
                    : 'When you buy, your orders + sessions land here.'}
                </p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CATALOG — Packages first (the AOV play) */}
      {packages.length > 0 && (
        <section className="bg-white text-black py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-3">
              <PackageIcon className="w-5 h-5 text-accent" />
              <p className="font-mono text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase text-black/50">
                Studio Packages
              </p>
            </div>
            <h2 className="text-heading-xl mb-3">RECORD + ROLL OUT, IN ONE</h2>
            <p className="font-mono text-body-sm text-black/70 max-w-2xl mb-12">
              The bigger the bundle, the more you save vs booking the same work à la carte.
              Studio time inside a package becomes a prepaid balance — book your sessions on
              your own schedule.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <Link
                  key={pkg.id}
                  href={`/dashboard/media/${pkg.slug}`}
                  className="group border-2 border-black/10 p-6 sm:p-8 hover:border-accent transition-colors flex flex-col no-underline text-black"
                >
                  <h3 className="text-heading-md mb-2">{pkg.title}</h3>
                  <p className="font-mono text-xl font-bold text-accent mb-4">
                    {formatOfferingPrice(pkg)}
                  </p>
                  {pkg.public_blurb && (
                    <p className="font-mono text-sm text-black/70 leading-relaxed mb-4 flex-grow">
                      {pkg.public_blurb}
                    </p>
                  )}
                  {pkg.studio_hours_included > 0 && (
                    <p className="font-mono text-xs font-semibold text-black/60 mb-4">
                      Includes {pkg.studio_hours_included} hrs studio time
                    </p>
                  )}
                  <span className="font-mono text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1 text-accent group-hover:gap-2 transition-all mt-auto">
                    View &amp; book <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CATALOG — Standalone services */}
      {services.length > 0 && (
        <section className="bg-black text-white py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-5 h-5 text-accent" />
              <p className="font-mono text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase text-white/60">
                Standalone Services
              </p>
            </div>
            <h2 className="text-heading-xl mb-3">À LA CARTE</h2>
            <p className="font-mono text-body-sm text-white/70 max-w-2xl mb-12">
              Anything in a package, individually. Pick exactly what you need.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((svc) => (
                <Link
                  key={svc.id}
                  href={`/dashboard/media/${svc.slug}`}
                  className="group border border-white/15 p-5 sm:p-6 hover:border-accent hover:bg-white/[0.02] transition-colors no-underline text-white"
                >
                  <h3 className="font-mono text-base font-bold uppercase tracking-wider mb-2">
                    {svc.title}
                  </h3>
                  <p className="font-mono text-lg font-bold text-accent mb-3">
                    {formatOfferingPrice(svc)}
                  </p>
                  {svc.public_blurb && (
                    <p className="font-mono text-sm text-white/60 leading-relaxed mb-3">
                      {svc.public_blurb}
                    </p>
                  )}
                  <span className="font-mono text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1 text-white/80 group-hover:text-accent group-hover:gap-2 transition-all">
                    View &amp; book <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty state — no offerings visible to this viewer (admin-edited
          catalogue could plausibly leave a viewer with nothing). */}
      {packages.length === 0 && services.length === 0 && (
        <section className="bg-white text-black py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="font-mono text-sm text-black/60">
              No offerings available right now. Check back soon — or{' '}
              <Link href="/contact" className="text-accent hover:underline">
                reach out
              </Link>{' '}
              if you have something specific in mind.
            </p>
          </div>
        </section>
      )}
    </>
  );
}
