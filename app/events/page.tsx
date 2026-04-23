import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, ArrowRight } from 'lucide-react';
import { SITE_URL } from '@/lib/constants';
import { STUDIO_IMAGES } from '@/lib/images';

export const metadata: Metadata = {
  title: 'Events — Sweet Dreams Music',
  description:
    'Upcoming events at Sweet Dreams Music — band showcases, The Sweet Spot sessions, open-mic nights, and studio happenings in Fort Wayne, Indiana.',
  alternates: { canonical: `${SITE_URL}/events` },
  openGraph: {
    title: 'Events — Sweet Dreams Music',
    description: 'Upcoming events at Sweet Dreams Music in Fort Wayne, Indiana.',
    url: `${SITE_URL}/events`,
    type: 'website',
  },
};

/**
 * Events page — currently a placeholder until the events system is wired
 * to the database. Phase 5 will replace this with a query-driven listing
 * respecting the visibility enum (public / private_listed / private_hidden).
 */
export default function EventsPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-black text-white py-20 sm:py-28 overflow-hidden">
        <Image
          src={STUDIO_IMAGES.adamCloseupWide}
          alt="Sweet Dreams Music studio"
          fill
          className="object-cover opacity-25"
          priority
          sizes="100vw"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-accent text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase mb-3">
            What&apos;s Happening
          </p>
          <h1 className="text-display-md mb-6">EVENTS</h1>
          <p className="font-mono text-white/70 text-body-md max-w-2xl">
            Showcases, sessions, open nights, and special broadcasts from the Sweet Dreams Music floor.
            Keep this page bookmarked — new events post regularly.
          </p>
        </div>
      </section>

      {/* Empty state */}
      <section className="bg-white text-black py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Calendar className="w-16 h-16 text-accent mx-auto mb-8" strokeWidth={1.5} />
          <h2 className="text-heading-lg mb-6">NO EVENTS LISTED RIGHT NOW</h2>
          <p className="font-mono text-black/70 text-body-md max-w-2xl mx-auto mb-10">
            We&apos;re booking our first round of <strong className="text-black">The Sweet Spot</strong> band
            showcases — live-tracked performances from the Sweet Dreams Music floor. First dates post soon.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/bands"
              className="bg-accent text-black font-mono text-base font-bold tracking-wider uppercase px-8 py-4 hover:bg-accent/90 transition-colors no-underline inline-flex items-center justify-center gap-2"
            >
              The Sweet Spot <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="border-2 border-black text-black font-mono text-base font-bold tracking-wider uppercase px-8 py-4 hover:bg-black hover:text-white transition-colors no-underline inline-flex items-center justify-center"
            >
              Get notified
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
