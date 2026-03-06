import type { Metadata } from 'next';
import Link from 'next/link';
import { Music, Play, ShoppingCart } from 'lucide-react';
import { SITE_URL, BEAT_LICENSES } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Beat Store',
  description: 'Browse and buy beats from Sweet Dreams Music producers. MP3 leases, WAV leases, unlimited licenses, and exclusive rights available.',
  alternates: { canonical: `${SITE_URL}/beats` },
};

export default function BeatsPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-black text-white py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-accent text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase mb-3">
            Beat Store
          </p>
          <h1 className="text-display-md mb-6">FIND YOUR SOUND</h1>
          <p className="font-mono text-white/70 text-body-md max-w-2xl">
            Professionally produced beats, curated by Sweet Dreams Music.
            Browse, preview, and buy — instant download delivery.
          </p>
        </div>
      </section>

      {/* Coming Soon / Beat Grid - White */}
      <section className="bg-white text-black py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* TODO: Replace with actual beat grid from Supabase */}
          <div className="border-2 border-black/10 p-12 sm:p-16 text-center">
            <Music className="w-16 h-16 text-accent mx-auto mb-6" strokeWidth={1} />
            <h2 className="text-heading-xl mb-4">COMING SOON</h2>
            <p className="font-mono text-black/60 text-body-sm max-w-xl mx-auto mb-8">
              Our beat store is being stocked with fire. Sign up to get notified when new beats drop.
            </p>
            <Link href="/login"
              className="bg-black text-white font-mono text-base font-bold tracking-wider uppercase px-8 py-4 hover:bg-black/80 transition-colors no-underline inline-flex items-center justify-center">
              CREATE AN ACCOUNT
            </Link>
          </div>
        </div>
      </section>

      {/* License Types - Black */}
      <section className="bg-black text-white py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-heading-xl mb-12">LICENSE TYPES</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(BEAT_LICENSES).map(([key, license]) => (
              <div key={key} className="border border-white/10 p-6 sm:p-8 hover:border-accent/50 transition-colors">
                <h3 className="text-heading-sm mb-3">{license.name}</h3>
                <p className="font-mono text-white/50 text-xs mb-4">{license.description}</p>
                <div className="border-t border-white/10 pt-4">
                  <p className="font-mono text-xs text-accent uppercase tracking-wider">Delivery</p>
                  <p className="font-mono text-sm text-white/70">{license.deliveryFormat}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white text-black py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-display-md mb-6">WANT CUSTOM PRODUCTION?</h2>
          <p className="font-mono text-black/70 text-body-md max-w-2xl mx-auto mb-10">
            Book a session with one of our producers and get a beat made specifically for you.
          </p>
          <Link href="/book"
            className="bg-black text-white font-mono text-base font-bold tracking-wider uppercase px-8 py-4 hover:bg-black/80 transition-colors no-underline inline-flex items-center justify-center">
            BOOK A PRODUCTION SESSION
          </Link>
        </div>
      </section>
    </>
  );
}
