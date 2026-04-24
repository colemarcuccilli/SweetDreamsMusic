import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  Video,
  Music,
  ArrowRight,
  Camera,
  Film,
  Sparkles,
  Users,
  Mic2,
  Calendar,
  MessageCircle,
} from 'lucide-react';
import { SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'The Sweet Spot & Band Recording — Sweet Dreams Music',
  description:
    'The Sweet Spot is our premium live-band video showcase — full video, two songs in a professional mix, 3-6 short-form clips, featured on the Sweet Dreams YouTube. We also offer standard band recording sessions. Recorded in Fort Wayne, Indiana.',
  alternates: { canonical: `${SITE_URL}/bands` },
  openGraph: {
    title: 'The Sweet Spot & Band Recording — Sweet Dreams Music',
    description:
      'Premium live-band video showcase and standard band recording in Fort Wayne. Full tracking room, multicam video, release-ready audio.',
    url: `${SITE_URL}/bands`,
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'The Sweet Spot — Sweet Dreams Music Band Showcase',
      },
    ],
  },
};

// Sweet Spot assets hosted in Supabase Storage. Domain is allowlisted in
// next.config.ts so <Image> works without extra setup.
const SWEET_SPOT_BASE =
  'https://fweeyjnqwxywmpmnqpts.supabase.co/storage/v1/object/public/SweetSpot';
const SWEET_SPOT_LOGO = `${SWEET_SPOT_BASE}/sweetspotLogo.png`;
const SWEET_SPOT_PHOTOS = [
  { src: `${SWEET_SPOT_BASE}/Timeline 1_01_00_26_07.jpg`, alt: 'Sweet Spot session — full band in frame' },
  { src: `${SWEET_SPOT_BASE}/Timeline 1_01_01_47_18.jpg`, alt: 'Sweet Spot session — vocalist close-up' },
  { src: `${SWEET_SPOT_BASE}/Timeline 1_01_02_47_11.jpg`, alt: 'Sweet Spot session — instrument detail' },
  { src: `${SWEET_SPOT_BASE}/Timeline 1_01_03_05_09.jpg`, alt: 'Sweet Spot session — wide performance shot' },
  { src: `${SWEET_SPOT_BASE}/Timeline 1_01_03_54_18.jpg`, alt: 'Sweet Spot session — drummer in focus' },
  { src: `${SWEET_SPOT_BASE}/Timeline 1_01_07_24_17.jpg`, alt: 'Sweet Spot session — performance angle' },
  { src: `${SWEET_SPOT_BASE}/Timeline 1_01_07_50_14.jpg`, alt: 'Sweet Spot session — live moment' },
  { src: `${SWEET_SPOT_BASE}/Timeline 1_01_08_42_14.jpg`, alt: 'Sweet Spot session — final frame' },
] as const;

// What you actually get with a Sweet Spot booking. This is the whole pitch —
// straight, no "apply / review / maybe" language, because this is pay-to-book.
const SWEET_SPOT_INCLUDES = [
  {
    icon: Film,
    title: 'Full Video',
    description:
      'A full-length video of your Sweet Spot session, multicam, color-graded, ready for YouTube, press, label pitches, and your release rollout.',
  },
  {
    icon: Mic2,
    title: 'Two Songs, Professional Mix',
    description:
      'Two songs recorded live in our tracking room, mixed by our team. Delivered as finished masters you can release or use for sync.',
  },
  {
    icon: Sparkles,
    title: '3–6 Short-Form Clips',
    description:
      'Vertical cuts built for Reels, TikTok, and Shorts — formatted to push the video (and your band) on social.',
  },
  {
    icon: Video,
    title: 'Featured on Sweet Dreams YouTube',
    description:
      'Your Sweet Spot lands on our YouTube channel with full credit links, so our audience finds you alongside everything else we publish.',
  },
] as const;

// Standard band recording pricing. Mirrors BAND_PRICING in lib/constants.ts.
const BAND_PRICING = [
  { label: '4 Hours', price: '$400', note: 'Minimum booking' },
  { label: '8 Hours', price: '$680', note: '$85 / hour' },
  { label: '3 × 8hr Days', price: '$1,800', note: '$75 / hour — best for full-length tracking' },
] as const;

export default function BandsPage() {
  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════
          HERO — Sweet Spot branded, image bleed
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative bg-black text-white py-24 sm:py-32 overflow-hidden">
        <Image
          src={SWEET_SPOT_PHOTOS[0].src}
          alt="Sweet Spot live band session"
          fill
          className="object-cover opacity-30"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/80" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-8">
            <Image
              src={SWEET_SPOT_LOGO}
              alt="The Sweet Spot"
              width={88}
              height={88}
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
              priority
            />
            <p className="font-mono text-accent text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase">
              Sweet Dreams Music — Live Band Video Series
            </p>
          </div>
          <h1 className="text-display-lg mb-8">THE SWEET SPOT</h1>
          <p className="font-mono text-white/80 text-body-md max-w-2xl mb-4">
            A premium live-band video session from our Fort Wayne tracking floor. Two songs, one professional
            mix, a full video, short-form clips, and a feature on the Sweet Dreams YouTube channel.
          </p>
          <p className="font-mono text-white/70 text-body-sm max-w-2xl mb-10">
            Flat rate — <strong className="text-accent">$2,500</strong>. Bands on Sweet Dreams Music can book
            directly with an $800 deposit. New to us? Reach out and we&apos;ll walk you through it on a 30-min
            call.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/bands/sweet-spot/inquire"
              className="bg-accent text-black font-mono text-base font-bold tracking-wider uppercase px-8 py-4 hover:bg-accent/90 transition-colors no-underline inline-flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Inquire about Sweet Spot
            </Link>
            <Link
              href="#band-recording"
              className="border-2 border-white text-white font-mono text-base font-bold tracking-wider uppercase px-8 py-4 hover:bg-white hover:text-black transition-colors no-underline inline-flex items-center justify-center"
            >
              Or just book a band session
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          WHAT THE SWEET SPOT IS — explain it properly
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-white text-black py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase mb-3 text-black/50">
            What Is the Sweet Spot?
          </p>
          <h2 className="text-heading-xl mb-8">A RELEASE-READY VIDEO SESSION</h2>
          <div className="max-w-3xl mb-12 sm:mb-16">
            <p className="font-mono text-black/80 text-body-md mb-4">
              The Sweet Spot is the Sweet Dreams Music <strong>live-band video series</strong>. You come in,
              play two songs live on our tracking floor, and leave with finished video, finished audio, and
              clips built to push the session on social.
            </p>
            <p className="font-mono text-black/70 text-body-sm">
              It&apos;s different from a standard band recording session — the Sweet Spot is the full package:
              multicam video, professional mix of two songs, short-form content, and a feature on our YouTube.
              It&apos;s made to be released the day it&apos;s posted.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {SWEET_SPOT_INCLUDES.map((item) => (
              <div
                key={item.title}
                className="border-2 border-black/10 p-8 sm:p-10 hover:border-accent transition-colors"
              >
                <item.icon className="w-10 h-10 text-accent mb-6" strokeWidth={1.5} />
                <h3 className="text-heading-sm mb-4">{item.title}</h3>
                <p className="font-mono text-black/70 text-body-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          PHOTO GALLERY — the 8 Sweet Spot timeline stills
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-black text-white py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-accent text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase mb-3">
            From the Floor
          </p>
          <h2 className="text-heading-xl mb-4">SWEET SPOT, IN FRAMES</h2>
          <p className="font-mono text-white/60 text-body-sm max-w-2xl mb-12 sm:mb-16">
            Stills from a Sweet Spot session on the tracking floor. The full video is coming — our first
            Sweet Spot release drops soon.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {SWEET_SPOT_PHOTOS.map((photo, i) => (
              <div
                key={photo.src}
                className={`relative overflow-hidden aspect-[4/3] ${
                  i === 0 || i === 4 ? 'md:col-span-2 md:aspect-[2/1]' : ''
                }`}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
            ))}
          </div>

          {/* Placeholder for first Sweet Spot video — swap in Cloudflare Stream
              embed when user uploads it next week. Keeping the slot reserved
              so we don't forget. */}
          <div className="mt-12 sm:mt-16 border-2 border-white/10 bg-white/5 p-8 sm:p-12 text-center">
            <Film className="w-10 h-10 text-accent mx-auto mb-4" strokeWidth={1.5} />
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-2">Coming Soon</p>
            <p className="font-mono text-body-md text-white/80 mb-2">
              Our first Sweet Spot video drops next week.
            </p>
            <p className="font-mono text-body-sm text-white/50">
              Check back to watch the full session, or follow Sweet Dreams Music on YouTube to catch it live.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          HOW IT WORKS — the real flow (pay-to-book, not submit-and-wait)
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-white text-black py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase mb-3 text-black/50">
            How It Works
          </p>
          <h2 className="text-heading-xl mb-12 sm:mb-16">TWO WAYS TO BOOK</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
            {/* Path A: existing band on the platform */}
            <div className="border-2 border-black p-8 sm:p-10">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-8 h-8 text-accent" strokeWidth={1.5} />
                <p className="font-mono text-xs font-semibold tracking-[0.3em] uppercase text-black/60">
                  Path A · Already on Sweet Dreams
                </p>
              </div>
              <h3 className="text-heading-md mb-4">Book it directly</h3>
              <p className="font-mono text-black/70 text-body-sm mb-4">
                If your band is set up on Sweet Dreams Music, you can book a Sweet Spot the same way you book
                any band session. We reserve <strong>4 hours for filming</strong> plus{' '}
                <strong>2 hours for setup</strong> (same day or day prior) — both blocks show up on the
                studio calendar so nothing double-books.
              </p>
              <ul className="font-mono text-black/60 text-body-sm space-y-2 mb-6">
                <li>· $800 deposit via Stripe at booking</li>
                <li>· $1,700 remainder by cash, check, or transfer before the shoot</li>
                <li>· Flat $2,500 — no surcharges stack</li>
              </ul>
              <Link
                href="/dashboard/bands"
                className="font-mono text-sm font-bold uppercase tracking-wider text-accent hover:underline no-underline inline-flex items-center gap-1"
              >
                Go to your band hub <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Path B: brand-new band wants to learn more */}
            <div className="bg-black text-white border-2 border-black p-8 sm:p-10">
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="w-8 h-8 text-accent" strokeWidth={1.5} />
                <p className="font-mono text-xs font-semibold tracking-[0.3em] uppercase text-white/60">
                  Path B · New to Us
                </p>
              </div>
              <h3 className="text-heading-md mb-4">Set up a 30-min call</h3>
              <p className="font-mono text-white/70 text-body-sm mb-4">
                New bands, or bands who want to walk through it before booking — send us a note with your
                phone and a good time window. We&apos;ll call you to cover what you&apos;ll play, how the
                session runs, and what delivery looks like.
              </p>
              <ul className="font-mono text-white/60 text-body-sm space-y-2 mb-6">
                <li>· 30 minutes, zero commitment</li>
                <li>· We reply within 1 business day</li>
                <li>· We&apos;ll book the session from there if it&apos;s a fit</li>
              </ul>
              <Link
                href="/bands/sweet-spot/inquire"
                className="font-mono text-sm font-bold uppercase tracking-wider text-accent hover:underline no-underline inline-flex items-center gap-1"
              >
                Start an inquiry <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          BAND RECORDING — the standard non-Sweet-Spot flow
          ═══════════════════════════════════════════════════════════════ */}
      <section id="band-recording" className="bg-black text-white py-20 sm:py-28 border-t-4 border-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-accent text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase mb-3">
            Not the Sweet Spot — just recording
          </p>
          <h2 className="text-heading-xl mb-6">BAND RECORDING SESSIONS</h2>
          <p className="font-mono text-white/70 text-body-md max-w-3xl mb-12">
            Want to track a full-length record, a single, or demos — no video, no Sweet Spot? Book Studio A
            in band mode. Full tracking room, full engineering team, flat-rate blocks. Extra mixing is
            billed at standard studio rates.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mb-12">
            {BAND_PRICING.map((tier) => (
              <div
                key={tier.label}
                className="border-2 border-white/10 hover:border-accent transition-colors p-8"
              >
                <p className="font-mono text-xs text-white/50 uppercase tracking-wider mb-2">{tier.label}</p>
                <p className="text-display-sm text-accent mb-2">{tier.price}</p>
                <p className="font-mono text-sm text-white/70">{tier.note}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/dashboard/bands"
              className="bg-accent text-black font-mono text-base font-bold tracking-wider uppercase px-8 py-4 hover:bg-accent/90 transition-colors no-underline inline-flex items-center justify-center gap-2"
            >
              Book a band session <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/book"
              className="border-2 border-white text-white font-mono text-base font-bold tracking-wider uppercase px-8 py-4 hover:bg-white hover:text-black transition-colors no-underline inline-flex items-center justify-center"
            >
              Or book solo / session time
            </Link>
          </div>

          <p className="font-mono text-white/50 text-body-sm mt-8">
            Need more than 3 days? Reach out and we&apos;ll custom-quote it. Band practice space is also
            available at $60/hr, 2-hour minimum.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FINAL CTA — yellow
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-yellow-300 text-black py-20 sm:py-28 border-y-4 border-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Camera className="w-12 h-12 text-black mx-auto mb-6" strokeWidth={1.5} />
          <h2 className="text-display-sm mb-6">YOUR BAND. OUR FLOOR. ON VIDEO.</h2>
          <p className="font-mono text-black/80 text-body-md max-w-2xl mx-auto mb-10">
            The Sweet Spot is a flat-rate, release-ready video session. Two songs, full video, professional
            mix, short-form clips, featured on our YouTube. Book it if you&apos;re ready, or reach out to
            walk through it first.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/bands/sweet-spot/inquire"
              className="bg-black text-yellow-300 font-mono text-lg font-bold tracking-wider uppercase px-10 py-5 hover:bg-black/80 transition-colors no-underline inline-flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Inquire now
            </Link>
            <Link
              href="/dashboard/bands"
              className="border-2 border-black text-black font-mono text-lg font-bold tracking-wider uppercase px-10 py-5 hover:bg-black hover:text-yellow-300 transition-colors no-underline inline-flex items-center justify-center gap-2"
            >
              <Music className="w-5 h-5" />
              Go to band hub
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
