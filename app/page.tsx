import Image from 'next/image';
import Link from 'next/link';
import { Mic, Music, Headphones, Clock, DollarSign, Users } from 'lucide-react';
import { ROOM_RATES, ENGINEERS } from '@/lib/constants';
import { formatCents } from '@/lib/utils';
import { STUDIO_IMAGES } from '@/lib/images';
import HeroTitle from '@/components/home/HeroTitle';

const services = [
  {
    icon: Mic,
    title: 'Recording',
    description: 'Professional vocal and instrument recording in our acoustically treated studios.',
    image: STUDIO_IMAGES.ayeGBoothWide,
  },
  {
    icon: Music,
    title: 'Mixing',
    description: 'Industry-standard mixing to make your tracks sound polished and radio-ready.',
    image: STUDIO_IMAGES.adamSpeakersWide,
  },
  {
    icon: Headphones,
    title: 'Production',
    description: 'Full music production from beat-making to arrangement and sound design.',
    image: STUDIO_IMAGES.jayStudioBWritingWide,
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative bg-black text-white min-h-[90vh] flex items-center justify-center overflow-hidden">
        <Image
          src={STUDIO_IMAGES.studioBSideLowAngleWide}
          alt="Sweet Dreams Music Studio"
          fill
          className="object-cover opacity-40"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          <p className="font-mono text-accent text-sm sm:text-base font-semibold tracking-[0.3em] uppercase mb-6">
            Fort Wayne Recording Studio
          </p>
          <HeroTitle />
          <p className="font-mono text-white/70 text-body-md max-w-2xl mx-auto mb-10">
            Professional recording sessions starting at {formatCents(ROOM_RATES.studio_b)}/hour.
            Two studios. Four engineers. 30+ years of mixing experience combined.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/book"
              className="bg-accent text-black font-mono text-base font-bold tracking-wider uppercase px-8 py-4 hover:bg-accent/90 transition-colors no-underline inline-flex items-center justify-center">
              BOOK A SESSION
            </Link>
            <Link href="/beats"
              className="border-2 border-white text-white font-mono text-base font-bold tracking-wider uppercase px-8 py-4 hover:bg-white hover:text-black transition-colors no-underline inline-flex items-center justify-center">
              BROWSE BEATS
            </Link>
          </div>
        </div>
      </section>

      {/* Services - Black */}
      <section className="bg-black text-white py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-accent text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase mb-3">What We Do</p>
          <h2 className="text-heading-xl mb-12 sm:mb-16">OUR SERVICES</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            {services.map((service) => (
              <div key={service.title} className="border border-white/10 hover:border-accent/50 transition-colors overflow-hidden group">
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="p-8 sm:p-10">
                  <service.icon className="w-10 h-10 text-accent mb-6" strokeWidth={1.5} />
                  <h3 className="text-heading-sm mb-4">{service.title}</h3>
                  <p className="font-mono text-white/60 text-body-sm">{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipment Showcase - White */}
      <section className="bg-white text-black py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-sm font-semibold tracking-[0.3em] uppercase mb-3 text-black/50">Professional Equipment</p>
          <h2 className="text-heading-xl mb-12 sm:mb-16">THE GEAR</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[
              { src: STUDIO_IMAGES.akgGraphic, alt: 'AKG Microphone' },
              { src: STUDIO_IMAGES.manleyGraphic, alt: 'Manley' },
              { src: STUDIO_IMAGES.mojaveGraphic, alt: 'Mojave' },
              { src: STUDIO_IMAGES.bockMicCloseup, alt: 'Bock Audio Microphone' },
            ].map((item) => (
              <div key={item.alt} className="relative aspect-square overflow-hidden bg-black/5">
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing - Black */}
      <section className="bg-black text-white py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-accent text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase mb-3">Transparent Pricing</p>
          <h2 className="text-heading-xl mb-12 sm:mb-16">OUR RATES</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8">
            <div className="border border-white/10 overflow-hidden">
              <div className="relative aspect-[16/9]">
                <Image src={STUDIO_IMAGES.iszacStudioAWide} alt="Studio A" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
              </div>
              <div className="p-8 sm:p-10">
                <h3 className="text-heading-sm mb-2">STUDIO A</h3>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="font-heading text-display-sm text-accent">{formatCents(ROOM_RATES.studio_a)}</span>
                  <span className="font-mono text-sm text-white/50">/hour</span>
                </div>
                <p className="font-mono text-sm text-white/60">Our primary recording room. Premium acoustics and equipment.</p>
              </div>
            </div>
            <div className="border border-white/10 overflow-hidden">
              <div className="relative aspect-[16/9]">
                <Image src={STUDIO_IMAGES.studioBSideLowAngleWide} alt="Studio B" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
              </div>
              <div className="p-8 sm:p-10">
                <h3 className="text-heading-sm mb-2">STUDIO B</h3>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="font-heading text-display-sm text-accent">{formatCents(ROOM_RATES.studio_b)}</span>
                  <span className="font-mono text-sm text-white/50">/hour</span>
                </div>
                <p className="font-mono text-sm text-white/60">Versatile second studio. Perfect for all session types.</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 font-mono text-sm text-white/50 mb-8">
            <span className="text-accent font-semibold">4hr Sweet Spots available</span>
            <span className="text-white/20">|</span>
            <span>After hours: +$10/hr</span>
            <span className="text-white/20">|</span>
            <span>Same-day: +$10/hr</span>
            <span className="text-white/20">|</span>
            <span>Band recording available</span>
          </div>
          <Link href="/pricing"
            className="border-2 border-white text-white font-mono text-base font-bold tracking-wider uppercase px-8 py-4 hover:bg-white hover:text-black transition-colors no-underline inline-flex items-center justify-center">
            FULL PRICING DETAILS
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white text-black py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: Users, value: String(ENGINEERS.length), label: 'Engineers' },
              { icon: DollarSign, value: '$60', label: 'Starting Rate' },
              { icon: Clock, value: '7', label: 'Days a Week' },
              { icon: Mic, value: '2', label: 'Studios' },
            ].map((stat) => (
              <div key={stat.label}>
                <stat.icon className="w-8 h-8 text-accent mx-auto mb-3" strokeWidth={1.5} />
                <p className="font-heading text-display-sm">{stat.value}</p>
                <p className="font-mono text-sm text-black/60 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Studio Gallery - Black */}
      <section className="bg-black text-white py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-accent text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase mb-3">Inside the Studio</p>
          <h2 className="text-heading-xl mb-12 sm:mb-16">THE SPACE</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {[
              { src: STUDIO_IMAGES.jayBoothWide, alt: 'Recording booth', className: 'col-span-2 aspect-[2/1]' },
              { src: STUDIO_IMAGES.iszacVert, alt: 'Iszac engineering', className: 'aspect-square' },
              { src: STUDIO_IMAGES.doloBoothSquare, alt: 'Recording session', className: 'aspect-square' },
              { src: STUDIO_IMAGES.bockMicWide, alt: 'Bock Audio microphone', className: 'aspect-square' },
              { src: STUDIO_IMAGES.akgMicWide, alt: 'AKG microphone setup', className: 'aspect-square' },
              { src: STUDIO_IMAGES.adamCloseupWide, alt: 'Adam Audio monitors', className: 'col-span-2 aspect-[2/1]' },
              { src: STUDIO_IMAGES.jebJayStudioAVert, alt: 'Studio A session', className: 'aspect-square' },
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

      {/* CTA */}
      <section className="relative bg-black text-white py-20 sm:py-28 overflow-hidden">
        <Image
          src={STUDIO_IMAGES.doloWindowSquare}
          alt=""
          fill
          className="object-cover opacity-20"
          sizes="100vw"
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-display-md mb-6">READY TO RECORD?</h2>
          <p className="font-mono text-white/70 text-body-md max-w-2xl mx-auto mb-10">
            Book your session today. Pay a 50% deposit, and the rest after your session.
          </p>
          <Link href="/book"
            className="bg-accent text-black font-mono text-lg font-bold tracking-wider uppercase px-10 py-5 hover:bg-accent/90 transition-colors no-underline inline-flex items-center justify-center">
            BOOK YOUR SESSION
          </Link>
        </div>
      </section>
    </>
  );
}
