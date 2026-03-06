import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, AlertCircle, Check, Percent } from 'lucide-react';
import { SITE_URL, PRICING, ROOM_RATES } from '@/lib/constants';
import { formatCents, calculateSessionTotal } from '@/lib/utils';
import { STUDIO_IMAGES } from '@/lib/images';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Recording studio pricing. Studio A from $70/hr, Studio B from $60/hr. 50% deposit at booking, remainder after session.',
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
            Simple pricing. 50% deposit to book, remainder after your session. No hidden fees.
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
              <div className="flex items-baseline gap-1 mb-6">
                <span className="font-heading text-display-md">{formatCents(ROOM_RATES.studio_a)}</span>
                <span className="font-mono text-lg text-black/50">/hour</span>
              </div>
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
              <div className="flex items-baseline gap-1 mb-6">
                <span className="font-heading text-display-md">{formatCents(ROOM_RATES.studio_b)}</span>
                <span className="font-mono text-lg text-black/50">/hour</span>
              </div>
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

          {/* Surcharges & Discounts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-2 border-black p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-accent" />
                <h3 className="text-heading-sm">AFTER HOURS</h3>
              </div>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="font-heading text-display-sm">+{formatCents(PRICING.afterHoursSurcharge)}</span>
                <span className="font-mono text-sm text-black/50">/hour</span>
              </div>
              <p className="font-mono text-sm text-black/60">Sessions starting after 9 PM, available daily until 3 AM.</p>
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
              <p className="font-mono text-sm text-black/60">Booking and recording on the same day.</p>
            </div>

            <div className="border-2 border-accent p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <Percent className="w-6 h-6 text-accent" />
                <h3 className="text-heading-sm">3+ HOURS</h3>
              </div>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="font-heading text-display-sm text-accent">-{formatCents(PRICING.threeHourDiscount)}</span>
                <span className="font-mono text-sm text-black/50">off</span>
              </div>
              <p className="font-mono text-sm text-black/60">Book 3 or more hours and save $10 on your session.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Example Sessions - Black */}
      <section className="bg-black text-white py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-heading-xl mb-12">EXAMPLE SESSIONS</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: '2 HOURS — STUDIO B', room: 'studio_b' as const, hours: 2, startHour: 14, sameDay: false },
              { title: '3 HOURS — STUDIO A', room: 'studio_a' as const, hours: 3, startHour: 18, sameDay: false },
              { title: '2 HOURS — AFTER HOURS', room: 'studio_a' as const, hours: 2, startHour: 21, sameDay: false },
            ].map((ex) => {
              const p = calculateSessionTotal(ex.room, ex.hours, ex.startHour, ex.sameDay);
              return (
                <div key={ex.title} className="border border-white/10 p-8">
                  <h3 className="text-heading-sm mb-4">{ex.title}</h3>
                  <div className="font-mono text-sm text-white/50 space-y-1 mb-6">
                    <p>Base: {formatCents(p.subtotal)}</p>
                    {p.afterHoursFee > 0 && <p>After-hours: +{formatCents(p.afterHoursFee)}</p>}
                    {p.discount > 0 && <p className="text-accent">Discount: -{formatCents(p.discount)}</p>}
                  </div>
                  <p className="font-mono text-xs text-white/40 mb-1">Total: {formatCents(p.total)}</p>
                  <p className="font-heading text-display-sm text-accent">Deposit: {formatCents(p.deposit)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How Payment Works - White */}
      <section className="bg-white text-black py-20 sm:py-28">
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
                  <p className="font-mono text-sm text-black/60">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black text-white py-20 sm:py-28">
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
