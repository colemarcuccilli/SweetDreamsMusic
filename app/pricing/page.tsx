import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, AlertCircle, Check, Star, Users, Moon } from 'lucide-react';
import { SITE_URL, PRICING, ROOM_RATES, SWEET_SPOTS, BAND_PRICING } from '@/lib/constants';
import { formatCents, calculateSessionTotal } from '@/lib/utils';
import { STUDIO_IMAGES } from '@/lib/images';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Recording studio pricing. Studio A from $70/hr, Studio B from $50/hr. Sweet Spot deals and band recording available. Open 24 hours.',
  alternates: { canonical: `${SITE_URL}/pricing` },
};

const included = [
  'Professional recording engineer',
  'Acoustically treated studio room',
  'Industry-standard equipment',
  'Basic mixing assistance',
  'Digital file delivery',
  'Comfortable lounge area',
];

export default function PricingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-black text-white py-20 sm:py-28 overflow-hidden">
        <Image
          src={STUDIO_IMAGES.adamSpeakersWide}
          alt=""
          fill
          className="object-cover opacity-20"
          priority
          sizes="100vw"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-accent text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase mb-3">
            Transparent Pricing
          </p>
          <h1 className="text-display-md mb-6">OUR RATES</h1>
          <p className="font-mono text-white/70 text-body-md max-w-2xl">
            Simple pricing. Open 24 hours. 50% deposit to book, remainder after your session.
          </p>
        </div>
      </section>

      {/* Studio Rates - White */}
      <section className="bg-white text-black py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Studio A */}
            <div className="border-4 border-black p-8 sm:p-12">
              <h2 className="text-heading-lg mb-2">STUDIO A</h2>
              <p className="font-mono text-sm text-black/50 mb-6">Premium room — top-tier acoustics and equipment</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="font-heading text-display-md">{formatCents(ROOM_RATES.studio_a)}</span>
                <span className="font-mono text-lg text-black/50">/hour</span>
              </div>
              <p className="font-mono text-xs text-black/40 mb-6">Single hour: {formatCents(PRICING.studioASingleHour)}</p>
              <hr className="my-6 border-black/10" />
              <h3 className="text-heading-sm mb-4">INCLUDED</h3>
              <div className="space-y-3">
                {included.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-accent flex-shrink-0" />
                    <span className="font-mono text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Studio B */}
            <div className="border-2 border-black p-8 sm:p-12">
              <h2 className="text-heading-lg mb-2">STUDIO B</h2>
              <p className="font-mono text-sm text-black/50 mb-6">Versatile room — great for all session types</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="font-heading text-display-md">{formatCents(ROOM_RATES.studio_b)}</span>
                <span className="font-mono text-lg text-black/50">/hour</span>
              </div>
              <p className="font-mono text-xs text-black/40 mb-6">Single hour: {formatCents(PRICING.studioBSingleHour)}</p>
              <hr className="my-6 border-black/10" />
              <h3 className="text-heading-sm mb-4">INCLUDED</h3>
              <div className="space-y-3">
                {included.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-accent flex-shrink-0" />
                    <span className="font-mono text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sweet Spots + Surcharges */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="border-2 border-accent p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <Star className="w-6 h-6 text-accent" />
                <h3 className="text-heading-sm">SWEET SPOT</h3>
              </div>
              <div className="space-y-3 mb-3">
                <div>
                  <p className="font-heading text-display-sm text-accent">{formatCents(SWEET_SPOTS.studio_a.price)}</p>
                  <p className="font-mono text-xs text-black/50">Studio A — 4 hours ({formatCents(SWEET_SPOTS.studio_a.perHour)}/hr)</p>
                </div>
                <div>
                  <p className="font-heading text-display-sm text-accent">{formatCents(SWEET_SPOTS.studio_b.price)}</p>
                  <p className="font-mono text-xs text-black/50">Studio B — 4 hours ({formatCents(SWEET_SPOTS.studio_b.perHour)}/hr)</p>
                </div>
              </div>
              <p className="font-mono text-sm text-black/60">Best value. Book 4 hours at a discounted flat rate.</p>
            </div>

            <div className="border-2 border-amber-400 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <Moon className="w-6 h-6 text-amber-500" />
                <h3 className="text-heading-sm">LATE NIGHT</h3>
              </div>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="font-heading text-display-sm">+{formatCents(PRICING.lateNightSurcharge)}</span>
                <span className="font-mono text-sm text-black/50">/hour</span>
              </div>
              <p className="font-mono text-sm text-black/60">10 PM – 2 AM. Per-hour surcharge applies to each hour in this window.</p>
            </div>

            <div className="border-2 border-red-400 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-red-500" />
                <h3 className="text-heading-sm">AFTER HOURS</h3>
              </div>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="font-heading text-display-sm">+{formatCents(PRICING.deepNightSurcharge)}</span>
                <span className="font-mono text-sm text-black/50">/hour</span>
              </div>
              <p className="font-mono text-sm text-black/60">2 AM – 9 AM. Per-hour surcharge applies to each hour in this window.</p>
            </div>

            <div className="border-2 border-black p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-accent" />
                <h3 className="text-heading-sm">SAME-DAY</h3>
              </div>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="font-heading text-display-sm">+{formatCents(PRICING.sameDaySurcharge)}</span>
                <span className="font-mono text-sm text-black/50">/hour</span>
              </div>
              <p className="font-mono text-sm text-black/60">Booking and recording on the same day. Applies to every hour.</p>
            </div>
          </div>

          {/* How surcharges stack */}
          <div className="mt-8 border border-black/10 p-6">
            <h3 className="font-mono text-sm font-semibold uppercase tracking-wider mb-3">How Surcharges Work</h3>
            <p className="font-mono text-sm text-black/60 mb-3">
              Surcharges are calculated <strong className="text-black">per hour</strong>. If your session spans multiple time zones, each hour gets its own surcharge.
              Surcharges stack — a same-day session starting at 1 AM would have both the late night/after hours surcharge AND the same-day surcharge.
            </p>
            <div className="font-mono text-xs text-black/40 space-y-1">
              <p>Example: 4hr session starting at midnight, same-day booking</p>
              <p>12 AM: $70 base + $10 late night + $10 same-day = <strong className="text-black">$90</strong></p>
              <p>1 AM: $70 base + $10 late night + $10 same-day = <strong className="text-black">$90</strong></p>
              <p>2 AM: $70 base + $30 after hours + $10 same-day = <strong className="text-black">$110</strong></p>
              <p>3 AM: $70 base + $30 after hours + $10 same-day = <strong className="text-black">$110</strong></p>
              <p className="pt-1 text-black font-semibold">Total: $400 — Deposit: $200</p>
            </div>
          </div>
        </div>
      </section>

      {/* Band Recording - Black */}
      <section className="bg-black text-white py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-6 h-6 text-accent" />
            <p className="font-mono text-accent text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase">Studio A Only</p>
          </div>
          <h2 className="text-heading-xl mb-12 sm:mb-16">BAND RECORDING</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {BAND_PRICING.map((pkg) => (
              <div key={pkg.hours} className="border border-white/10 p-8">
                <h3 className="text-heading-sm mb-2">{pkg.label}</h3>
                <p className="font-mono text-xs text-white/70 mb-4">{pkg.note}</p>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="font-heading text-display-sm text-accent">{formatCents(pkg.price)}</span>
                </div>
                <p className="font-mono text-sm text-white/80">{formatCents(pkg.perHour)}/hour</p>
              </div>
            ))}
          </div>
          <p className="font-mono text-xs text-white/60 mt-8">
            Band recording includes full use of Studio A. 4-hour minimum booking required.
          </p>
        </div>
      </section>

      {/* Example Sessions - White */}
      <section className="bg-white text-black py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-heading-xl mb-12">EXAMPLE SESSIONS</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: '2 HOURS — STUDIO B (DAYTIME)', room: 'studio_b' as const, hours: 2, startHour: 14, sameDay: false },
              { title: 'SWEET SPOT — STUDIO A', room: 'studio_a' as const, hours: 4, startHour: 12, sameDay: false },
              { title: '3 HOURS — STUDIO A (11 PM START)', room: 'studio_a' as const, hours: 3, startHour: 23, sameDay: false },
            ].map((ex) => {
              const p = calculateSessionTotal(ex.room, ex.hours, ex.startHour, ex.sameDay);
              return (
                <div key={ex.title} className="border-2 border-black p-8">
                  <h3 className="text-heading-sm mb-4">{ex.title}</h3>
                  <div className="font-mono text-sm text-black/50 space-y-1 mb-6">
                    <p>Base: {formatCents(p.subtotal)}</p>
                    {p.sweetSpot && <p className="text-accent">Sweet Spot rate applied</p>}
                    {p.nightFees > 0 && <p className="text-amber-600">Night surcharges: +{formatCents(p.nightFees)}</p>}
                    {p.sameDayFee > 0 && <p>Same-day: +{formatCents(p.sameDayFee)}</p>}
                  </div>
                  <p className="font-mono text-xs text-black/40 mb-1">Total: {formatCents(p.total)}</p>
                  <p className="font-heading text-display-sm text-accent">Deposit: {formatCents(p.deposit)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How Payment Works - Black */}
      <section className="bg-black text-white py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-heading-xl mb-12">HOW PAYMENT WORKS</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'BOOK & PAY DEPOSIT', desc: 'Select your session details and pay a 50% deposit. Your card is saved on file.' },
              { step: '2', title: 'RECORD YOUR SESSION', desc: 'Show up, make music. Your engineer handles everything.' },
              { step: '3', title: 'REMAINDER CHARGED', desc: 'After your session, the remaining balance is charged to your card on file. The total can be adjusted for add-ons.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <span className="font-heading text-display-sm text-accent flex-shrink-0">{item.step}</span>
                <div>
                  <h3 className="text-heading-sm mb-2">{item.title}</h3>
                  <p className="font-mono text-sm text-white/60">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white text-black py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-display-md mb-6">LET&apos;S MAKE MUSIC</h2>
          <Link href="/book"
            className="bg-accent text-black font-mono text-lg font-bold tracking-wider uppercase px-10 py-5 hover:bg-accent/90 transition-colors no-underline inline-flex items-center justify-center">
            BOOK YOUR SESSION
          </Link>
        </div>
      </section>
    </>
  );
}
