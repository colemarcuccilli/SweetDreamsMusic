import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Lock, Package as PackageIcon, Sparkles } from 'lucide-react';
import { SITE_URL } from '@/lib/constants';
import { STUDIO_IMAGES } from '@/lib/images';
import { getActiveOfferings } from '@/lib/media-server';
import {
  formatOfferingPrice,
  groupOfferings,
  isOfferingVisibleTo,
} from '@/lib/media';
import { getSessionUser } from '@/lib/auth';
import { getUserBands } from '@/lib/bands-server';

export const metadata: Metadata = {
  title: 'Media — Packages, Music Videos, Marketing & More',
  description:
    'Sweet Dreams Media — full-service music video production, shorts, photo, cover art, and marketing planning for artists and bands. Packages and standalone services.',
  alternates: { canonical: `${SITE_URL}/media` },
  openGraph: {
    title: 'Media — Sweet Dreams Music',
    description:
      'Music videos, shorts, photo, cover art, and marketing planning. Studio packages bundle recording with rollout in one fixed price.',
    url: `${SITE_URL}/media`,
    type: 'website',
  },
};

// Catalog rows can change at any time via admin edits, so we don't want stale
// pricing or stale "members only" labels showing up after a catalog edit. The
// query is cheap (1 read, 15 rows today) so dynamic rendering is the right
// default. Switch to ISR with `revalidate = 60` if traffic ever justifies it.
export const dynamic = 'force-dynamic';

// Embedded portfolio videos — kept from the previous /media page as social
// proof under the catalog. Add IDs here when new videos go live; this is a
// small enough list to keep inline rather than paying for a CMS round trip.
const PORTFOLIO_VIDEOS = [
  { id: 'tyQStwbljvo', title: 'Music Video' },
  { id: 'aVDCLVVbVBM', title: 'Music Video' },
  { id: '7BKNcbAsTaQ', title: 'Music Video' },
  { id: 'QWmJm75ryxY', title: 'Music Video' },
  { id: '270fw_HtGds', title: 'Music Video' },
];

/**
 * Public Media Hub catalog — visible to everyone, prices hidden.
 *
 * Hard rule per Cole (2026-04-24): non-band viewers don't see band offerings
 * AT ALL — no upsell tease, no locked tile. We compute viewer eligibility
 * here and filter the catalog accordingly.
 *
 * The /dashboard/media page (Phase C) ships the same catalog with prices
 * exposed and a configurator wizard for packages.
 */
export default async function MediaPage() {
  const user = await getSessionUser();
  // Only run the band lookup if there's a logged-in user — anonymous viewers
  // are hardcoded to 'anonymous' eligibility, which behaves identically to
  // 'solo' for the purposes of catalog visibility.
  const bandMemberships = user ? await getUserBands(user.id) : [];
  const viewer: 'anonymous' | 'solo' | 'band' = !user
    ? 'anonymous'
    : bandMemberships.length > 0
      ? 'band'
      : 'solo';

  const offerings = await getActiveOfferings();
  const visible = offerings.filter((o) => isOfferingVisibleTo(o, viewer));
  const { packages, services } = groupOfferings(visible);

  return (
    <>
      {/* Hero */}
      <section className="relative bg-black text-white py-20 sm:py-28 overflow-hidden">
        <Image
          src={STUDIO_IMAGES.prvrbTopStudioAWide}
          alt="Sweet Dreams Media"
          fill
          className="object-cover opacity-30"
          priority
          sizes="100vw"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-accent text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase mb-3">
            Music Videos · Shorts · Photo · Marketing
          </p>
          <h1 className="text-display-md mb-6">MEDIA HUB</h1>
          <p className="font-mono text-white/70 text-body-md max-w-2xl">
            Studio packages that bundle recording with full rollout — and standalone services for
            anything you need à la carte. Sign in to see pricing and book.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            {user ? (
              <Link
                href="/dashboard/media"
                className="bg-accent text-black font-mono text-base font-bold tracking-wider uppercase px-8 py-4 hover:bg-accent/90 transition-colors no-underline inline-flex items-center justify-center gap-2"
              >
                Open the Media Hub <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login?redirect=/dashboard/media"
                  className="bg-accent text-black font-mono text-base font-bold tracking-wider uppercase px-8 py-4 hover:bg-accent/90 transition-colors no-underline inline-flex items-center justify-center gap-2"
                >
                  Sign in to book <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/contact"
                  className="border-2 border-white text-white font-mono text-base font-bold tracking-wider uppercase px-8 py-4 hover:bg-white hover:text-black transition-colors no-underline inline-flex items-center justify-center"
                >
                  Talk to us
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Studio Packages — bundled offers, prices hidden */}
      {packages.length > 0 && (
        <section className="bg-white text-black py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-3">
              <PackageIcon className="w-5 h-5 text-accent" />
              <p className="font-mono text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase text-black/50">
                Studio Packages
              </p>
            </div>
            <h2 className="text-heading-xl mb-3">RECORD + ROLL OUT, IN ONE</h2>
            <p className="font-mono text-body-sm text-black/70 max-w-2xl mb-12">
              Bundles that combine studio recording with marketing, shorts, photos, and music
              videos at one price. Configure exactly what you need inside your dashboard.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="border-2 border-black/10 p-6 sm:p-8 hover:border-black transition-colors flex flex-col"
                >
                  <h3 className="text-heading-md mb-3">{pkg.title}</h3>
                  {pkg.public_blurb && (
                    <p className="font-mono text-sm text-black/70 mb-6 leading-relaxed">
                      {pkg.public_blurb}
                    </p>
                  )}
                  <div className="mt-auto pt-4 border-t border-black/10">
                    <p className="font-mono text-xs font-bold uppercase tracking-wider text-black/40 mb-1">
                      Price
                    </p>
                    <p className="font-mono text-lg font-bold text-black inline-flex items-center gap-2">
                      {!user && pkg.price_cents != null && (
                        <Lock className="w-4 h-4 text-black/40" />
                      )}
                      {formatOfferingPrice(pkg, { hidePrices: !user })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Standalone Services */}
      {services.length > 0 && (
        <section className="bg-black text-white py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-5 h-5 text-accent" />
              <p className="font-mono text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase text-white/60">
                Standalone Services
              </p>
            </div>
            <h2 className="text-heading-xl mb-3">À LA CARTE</h2>
            <p className="font-mono text-body-sm text-white/70 max-w-2xl mb-12">
              Anything in a package, individually. Pick exactly what you need without committing
              to a full bundle.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((svc) => (
                <div key={svc.id} className="border border-white/10 p-5 sm:p-6 hover:border-accent transition-colors">
                  <h3 className="font-mono text-base font-bold uppercase tracking-wider mb-2">
                    {svc.title}
                  </h3>
                  {svc.public_blurb && (
                    <p className="font-mono text-sm text-white/60 mb-4 leading-relaxed">
                      {svc.public_blurb}
                    </p>
                  )}
                  <p className="font-mono text-sm font-bold text-accent inline-flex items-center gap-2">
                    {!user && svc.price_cents != null && (
                      <Lock className="w-3 h-3 text-white/40" />
                    )}
                    {formatOfferingPrice(svc, { hidePrices: !user })}
                  </p>
                </div>
              ))}
            </div>

            {!user && (
              <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="font-mono text-sm text-white/60 max-w-xl">
                  Pricing and the package configurator open up after sign-in. Booking is per-engineer
                  and per-location, so the dashboard handles the calendar logic.
                </p>
                <Link
                  href="/login?redirect=/dashboard/media"
                  className="bg-accent text-black font-mono text-sm font-bold tracking-wider uppercase px-6 py-3 hover:bg-accent/90 transition-colors no-underline inline-flex items-center gap-2 shrink-0"
                >
                  Sign in <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Portfolio — kept from previous /media page as social proof */}
      <section className="bg-white text-black py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-sm font-semibold tracking-[0.3em] uppercase mb-3 text-black/50">
            Selected Work
          </p>
          <h2 className="text-heading-xl mb-12 sm:mb-16">MUSIC VIDEOS WE&apos;VE MADE</h2>
          <div className="space-y-6 sm:space-y-8">
            {PORTFOLIO_VIDEOS.map((video) => (
              <div
                key={video.id}
                className="w-full"
                style={{
                  position: 'relative',
                  paddingBottom: '56.25%',
                  height: 0,
                  overflow: 'hidden',
                  background: '#000',
                }}
              >
                <iframe
                  src={`https://www.youtube.com/embed/${video.id}`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 0,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sweet Dreams Company - Black */}
      <section className="bg-black text-white py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="font-mono text-accent text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase mb-3">
              A Sweet Dreams Company
            </p>
            <h2 className="text-heading-xl mb-6">MORE THAN A STUDIO</h2>
            <div className="font-mono text-body-sm text-white/70 space-y-4 mb-10">
              <p>
                Sweet Dreams Music is the recording arm of{' '}
                <a href="https://sweetdreams.us" className="text-accent hover:underline">
                  Sweet Dreams
                </a>{' '}
                — Fort Wayne&apos;s creative media company. From music production to music videos,
                branding, and digital content, we handle every part of the creative process.
              </p>
              <p>
                Need a music video? A visual identity? A full release strategy? Sweet Dreams does
                it all under one roof.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="https://sweetdreams.us"
                className="bg-accent text-black font-mono text-base font-bold tracking-wider uppercase px-8 py-4 hover:bg-accent/90 transition-colors no-underline inline-flex items-center justify-center"
              >
                VISIT SWEETDREAMS.US
              </a>
              <Link
                href="/contact"
                className="border-2 border-white text-white font-mono text-base font-bold tracking-wider uppercase px-8 py-4 hover:bg-white hover:text-black transition-colors no-underline inline-flex items-center justify-center"
              >
                GET IN TOUCH
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
