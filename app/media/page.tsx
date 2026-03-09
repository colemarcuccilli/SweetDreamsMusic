import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { SITE_URL } from '@/lib/constants';
import { STUDIO_IMAGES } from '@/lib/images';

export const metadata: Metadata = {
  title: 'Media',
  description: 'Music videos, visual content, and creative media by Sweet Dreams. Full-service creative agency based in Fort Wayne, IN.',
  alternates: { canonical: `${SITE_URL}/media` },
};

const videos = [
  { id: 'tyQStwbljvo', title: 'Music Video' },
  { id: 'aVDCLVVbVBM', title: 'Music Video' },
  { id: '7BKNcbAsTaQ', title: 'Music Video' },
  { id: 'QWmJm75ryxY', title: 'Music Video' },
  { id: '270fw_HtGds', title: 'Music Video' },
];

export default function MediaPage() {
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
            Portfolio
          </p>
          <h1 className="text-display-md mb-6">MEDIA</h1>
          <p className="font-mono text-white/70 text-body-md max-w-2xl">
            Sweet Dreams Music is part of <a href="https://sweetdreams.us" className="text-accent hover:underline">Sweet Dreams</a> — a full-service creative company based in Fort Wayne.
            Beyond the studio, we produce music videos, visual content, and creative media for artists.
          </p>
        </div>
      </section>

      {/* Video Portfolio - White */}
      <section className="bg-white text-black py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-sm font-semibold tracking-[0.3em] uppercase mb-3 text-black/50">Our Work</p>
          <h2 className="text-heading-xl mb-12 sm:mb-16">MUSIC VIDEOS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {videos.map((video, i) => (
              <div
                key={video.id}
                className={`${i === 0 ? 'md:col-span-2' : ''}`}
              >
                <div className={`relative w-full ${i === 0 ? 'aspect-video' : 'aspect-video'} bg-black`}>
                  <iframe
                    src={`https://www.youtube.com/embed/${video.id}`}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
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
                Sweet Dreams Music is the recording arm of <a href="https://sweetdreams.us" className="text-accent hover:underline">Sweet Dreams</a> — Fort Wayne&apos;s creative media company. From music production to music videos, branding, and digital content, we handle every part of the creative process.
              </p>
              <p>
                Need a music video? A visual identity? A full release strategy? Sweet Dreams does it all under one roof.
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
