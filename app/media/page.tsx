import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Package as PackageIcon, Sparkles } from 'lucide-react';
import { SITE_URL } from '@/lib/constants';
import { STUDIO_IMAGES } from '@/lib/images';
import { getActiveOfferings } from '@/lib/media-server';
import { groupOfferings, isOfferingVisibleTo } from '@/lib/media';
import { getSessionUser } from '@/lib/auth';
import { getUserBands } from '@/lib/bands-server';

export const metadata: Metadata = {
  title: 'Media — Music Videos, Shorts, Marketing & Studio Packages',
  description:
    'Sweet Dreams Media — full-service music video production, shorts, photo, cover art, marketing planning, and bundled studio packages for artists and bands.',
  alternates: { canonical: `${SITE_URL}/media` },
  openGraph: {
    title: 'Media — Sweet Dreams Music',
    description:
      'Music videos we made, plus the full menu of services and packages we offer. Sign in to see pricing and book.',
    url: `${SITE_URL}/media`,
    type: 'website',
  },
};

// Catalog rows can change at any time via admin edits, so we don't want stale
// "what we offer" tiles after a catalog edit. Cheap query, dynamic is fine.
export const dynamic = 'force-dynamic';

// Embedded portfolio videos — the "showcase" half of this page. Add IDs here
// when new videos go live; small enough list to keep inline rather than
// paying for a CMS round trip.
const PORTFOLIO_VIDEOS = [
  { id: 'tyQStwbljvo', title: 'Music Video' },
  { id: 'aVDCLVVbVBM', title: 'Music Video' },
  { id: '7BKNcbAsTaQ', title: 'Music Video' },
  { id: 'QWmJm75ryxY', title: 'Music Video' },
  { id: '270fw_HtGds', title: 'Music Video' },
];

/**
 * Public Media Hub — TWO things in one page:
 *
 *   1. SHOWCASE — music videos we've made, leading the scroll right after
 *      the hero. The "show, don't tell" half.
 *
 *   2. CATALOG — full menu of packages + standalone services we offer.
 *      The "here's what you can buy" half, BUT with NO PRICING anywhere.
 *      Pricing is only visible inside the logged-in dashboard at
 *      /dashboard/media (the booking surface).
 *
 * Hard rules per Cole:
 *   - Public surface never shows prices, regardless of auth state. The only
 *     pricing surface is /dashboard/media.
 *   - Solo + anonymous viewers don't see band offerings AT ALL — no upsell
 *     tease, no locked tile. Hidden entirely.
 *   - "Discounts" mean two things, neither of which is a one-time code:
 *       a) Bundle savings — packages cost less than the same line items à
 *          la carte. The bigger the bundle, the bigger the saving.
 *       b) Prepaid balance — `studio_credits` "gift card" hours that flow
 *          into your account when you buy a package.
 */
export default async function MediaPage() {
  const user = await getSessionUser();
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
            Music Videos · Shorts · Photo · Marketing · Packages
          </p>
          <h1 className="text-display-md mb-6">MEDIA</h1>
          <p className="font-mono text-white/70 text-body-md max-w-2xl">
            Music videos and visual content we&apos;ve made for artists, plus the full menu of
            services and packages you can book with us. Pricing lives inside your dashboard.
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
                  Sign in for pricing <ArrowRight className="w-4 h-4" />
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

      {/* SHOWCASE — music videos we've made (lead with proof of work) */}
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

      {/* CATALOG — Packages */}
      {packages.length > 0 && (
        <section className="bg-black text-white py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-3">
              <PackageIcon className="w-5 h-5 text-accent" />
              <p className="font-mono text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase text-white/60">
                Studio Packages
              </p>
            </div>
            <h2 className="text-heading-xl mb-3">RECORD + ROLL OUT, IN ONE</h2>
            <p className="font-mono text-body-sm text-white/70 max-w-2xl mb-3">
              Bundles that combine studio recording with marketing, shorts, photos, and music
              videos at one price. The bigger the bundle, the more you save vs booking the same
              work à la carte.
            </p>
            <p className="font-mono text-body-sm text-accent max-w-2xl mb-12">
              Studio time inside a package becomes a prepaid balance — book your sessions on
              your own schedule, no separate invoice.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="border border-white/15 bg-white/[0.02] p-6 sm:p-8 hover:border-accent transition-colors flex flex-col"
                >
                  <h3 className="text-heading-md mb-3">{pkg.title}</h3>
                  {pkg.public_blurb && (
                    <p className="font-mono text-sm text-white/70 leading-relaxed">
                      {pkg.public_blurb}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CATALOG — Standalone services */}
      {services.length > 0 && (
        <section className="bg-white text-black py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-5 h-5 text-accent" />
              <p className="font-mono text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase text-black/50">
                Standalone Services
              </p>
            </div>
            <h2 className="text-heading-xl mb-3">À LA CARTE</h2>
            <p className="font-mono text-body-sm text-black/70 max-w-2xl mb-12">
              Anything in a package, individually. Pick exactly what you need without committing
              to a full bundle.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((svc) => (
                <div
                  key={svc.id}
                  className="border border-black/10 p-5 sm:p-6 hover:border-black transition-colors"
                >
                  <h3 className="font-mono text-base font-bold uppercase tracking-wider mb-2">
                    {svc.title}
                  </h3>
                  {svc.public_blurb && (
                    <p className="font-mono text-sm text-black/60 leading-relaxed">
                      {svc.public_blurb}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom-of-catalog CTA — single, prominent, drives the only
                action this page can take: go see prices in the dashboard. */}
            <div className="mt-12 pt-8 border-t border-black/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="font-mono text-sm text-black/70 max-w-xl">
                {user
                  ? 'Open the Media Hub for full pricing, the package configurator, and booking.'
                  : 'Pricing and the package configurator open up after sign-in. Booking is per-engineer and per-location, so the dashboard handles the calendar logic.'}
              </p>
              <Link
                href={user ? '/dashboard/media' : '/login?redirect=/dashboard/media'}
                className="bg-accent text-black font-mono text-sm font-bold tracking-wider uppercase px-6 py-3 hover:bg-accent/90 transition-colors no-underline inline-flex items-center gap-2 shrink-0"
              >
                {user ? 'Open Media Hub' : 'Sign in for pricing'}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Sweet Dreams Company — brand pitch + final CTA */}
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
