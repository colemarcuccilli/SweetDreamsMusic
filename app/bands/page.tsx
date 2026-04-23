import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Users, Video, Music, Mic, ArrowRight, Eye } from 'lucide-react';
import { SITE_URL } from '@/lib/constants';
import { STUDIO_IMAGES } from '@/lib/images';

export const metadata: Metadata = {
  title: 'The Sweet Spot — Live Band Showcase by Sweet Dreams Music',
  description:
    'The Sweet Spot is our band showcase series — live-tracked performances from the Sweet Dreams Music floor. Full tracking room, multicam video, and release-ready audio. Recorded in Fort Wayne, Indiana.',
  alternates: { canonical: `${SITE_URL}/bands` },
  openGraph: {
    title: 'The Sweet Spot — Live Band Showcase by Sweet Dreams Music',
    description:
      'Live-tracked band showcase series from our Fort Wayne studio. Full tracking room, multicam video, release-ready audio.',
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

const features = [
  {
    icon: Users,
    title: 'Full Tracking Room',
    description:
      'Our live tracking space holds a full band — drums, bass, guitars, keys, vocals — all captured at once.',
  },
  {
    icon: Eye,
    title: 'Window to the Booth',
    description:
      'Line-of-sight between the booth and the main floor. Singers stay in their zone, the band stays locked in.',
  },
  {
    icon: Mic,
    title: 'Live Mix & Isolation',
    description:
      'Mix room windows overlook the tracking floor. Engineer stays with the band, the band stays in the music.',
  },
  {
    icon: Video,
    title: 'Multicam Capture',
    description:
      'Every Sweet Spot session is filmed — performance video for socials, label pitches, or release-day content.',
  },
];

export default function BandsPage() {
  return (
    <>
      {/* Hero — black with image bleed */}
      <section className="relative bg-black text-white py-24 sm:py-32 overflow-hidden">
        <Image
          src={STUDIO_IMAGES.jayIszacPrvrbStudioAWide}
          alt="Band tracking in Studio A"
          fill
          className="object-cover opacity-30"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/80" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-accent text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase mb-4">
            Live Band Showcase
          </p>
          <h1 className="text-display-lg mb-8">THE SWEET SPOT</h1>
          <p className="font-mono text-white/80 text-body-md max-w-2xl mb-10">
            A live-tracked performance series from the Sweet Dreams Music floor. Bring your band, play your
            set, leave with release-ready audio and video. Think Tiny Desk, Fort Wayne edition.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/contact"
              className="bg-accent text-black font-mono text-base font-bold tracking-wider uppercase px-8 py-4 hover:bg-accent/90 transition-colors no-underline inline-flex items-center justify-center gap-2"
            >
              Apply for The Sweet Spot <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/book"
              className="border-2 border-white text-white font-mono text-base font-bold tracking-wider uppercase px-8 py-4 hover:bg-white hover:text-black transition-colors no-underline inline-flex items-center justify-center"
            >
              Book a band session
            </Link>
          </div>
        </div>
      </section>

      {/* Features — white */}
      <section className="bg-white text-black py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase mb-3 text-black/50">
            Built to Capture a Full Band
          </p>
          <h2 className="text-heading-xl mb-12 sm:mb-16">WHY IT WORKS HERE</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
            {features.map((f) => (
              <div key={f.title} className="border-2 border-black/10 p-8 sm:p-10 hover:border-accent transition-colors">
                <f.icon className="w-10 h-10 text-accent mb-6" strokeWidth={1.5} />
                <h3 className="text-heading-sm mb-4">{f.title}</h3>
                <p className="font-mono text-black/70 text-body-sm">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works — black */}
      <section className="bg-black text-white py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-accent text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase mb-3">
            How It Works
          </p>
          <h2 className="text-heading-xl mb-12 sm:mb-16">FROM PITCH TO RELEASE</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            {[
              {
                step: '01',
                title: 'Apply',
                description:
                  'Tell us about your band — genre, lineup, what you want to track. We review submissions weekly and select bands that fit the program.',
              },
              {
                step: '02',
                title: 'Record',
                description:
                  'One session on the tracking floor with our engineering team. Live performance, multicam video, board mix, and the finished audio.',
              },
              {
                step: '03',
                title: 'Release',
                description:
                  'Your Sweet Spot lives on our channels and yours. Use the performance for release rollout, label pitches, or social content.',
              },
            ].map((step) => (
              <div key={step.step}>
                <p className="font-mono text-accent text-display-sm font-heading mb-4">{step.step}</p>
                <h3 className="text-heading-sm mb-4">{step.title}</h3>
                <p className="font-mono text-white/70 text-body-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Studio Visual — white */}
      <section className="bg-white text-black py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase mb-3 text-black/50">
            The Floor
          </p>
          <h2 className="text-heading-xl mb-12 sm:mb-16">WHERE IT HAPPENS</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {[
              { src: STUDIO_IMAGES.topStudioAFocusedWide, alt: 'Studio A tracking floor', className: 'col-span-2 aspect-[2/1]' },
              { src: STUDIO_IMAGES.iszacVert, alt: 'Engineer at the board', className: 'aspect-square' },
              { src: STUDIO_IMAGES.jayBoothWide, alt: 'Vocal booth', className: 'aspect-square' },
              { src: STUDIO_IMAGES.prvrbTopStudioAWide, alt: 'Studio A top view', className: 'aspect-square' },
              { src: STUDIO_IMAGES.adamCloseupWide, alt: 'Adam Audio monitors', className: 'col-span-2 aspect-[2/1]' },
              { src: STUDIO_IMAGES.doloBoothSquare, alt: 'Recording session', className: 'aspect-square' },
            ].map((item) => (
              <div key={item.alt} className={`relative overflow-hidden ${item.className}`}>
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — yellow */}
      <section className="bg-yellow-300 text-black py-20 sm:py-28 border-y-4 border-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Music className="w-12 h-12 text-black mx-auto mb-6" strokeWidth={1.5} />
          <h2 className="text-display-sm mb-6">YOUR BAND. OUR FLOOR.</h2>
          <p className="font-mono text-black/80 text-body-md max-w-2xl mx-auto mb-10">
            The Sweet Spot is new — we&apos;re taking applications now. If you play, tour, or record in a band
            and want a live-tracked session worth watching, reach out.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-black text-yellow-300 font-mono text-lg font-bold tracking-wider uppercase px-10 py-5 hover:bg-black/80 transition-colors no-underline inline-flex items-center justify-center gap-2"
            >
              Apply now <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/book"
              className="border-2 border-black text-black font-mono text-lg font-bold tracking-wider uppercase px-10 py-5 hover:bg-black hover:text-yellow-300 transition-colors no-underline inline-flex items-center justify-center"
            >
              Book a studio session
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
