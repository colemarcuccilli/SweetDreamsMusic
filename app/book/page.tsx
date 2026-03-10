import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { SITE_URL } from '@/lib/constants';
import { STUDIO_IMAGES } from '@/lib/images';
import { getSessionUser } from '@/lib/auth';
import BookingFlow from '@/components/booking/BookingFlow';

export const metadata: Metadata = {
  title: 'Book a Session',
  description: 'Book your recording session at Sweet Dreams Music. Choose your date, time, studio, and engineer. Starting at $50/hour.',
  alternates: { canonical: `${SITE_URL}/book` },
};

export default async function BookPage() {
  const user = await getSessionUser();

  return (
    <>
      {/* Hero */}
      <section className="relative bg-black text-white py-16 sm:py-20 overflow-hidden">
        <Image
          src={STUDIO_IMAGES.akgMicWide}
          alt=""
          fill
          className="object-cover opacity-20"
          priority
          sizes="100vw"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-accent text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase mb-3">
            Get Started
          </p>
          <h1 className="text-display-md mb-4">BOOK YOUR SESSION</h1>
          <p className="font-mono text-white/70 text-body-md max-w-2xl">
            Select your date, time, and session details below. Pay a 50% deposit to lock in your session.
          </p>
        </div>
      </section>

      {/* Booking Flow - White */}
      <section className="bg-white text-black py-12 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {user ? (
            <BookingFlow
              userName={user.profile?.display_name || ''}
              userEmail={user.email}
            />
          ) : (
            <div className="text-center py-16">
              <h2 className="text-heading-lg mb-4">CREATE AN ACCOUNT TO BOOK</h2>
              <p className="font-mono text-sm text-black/60 max-w-md mx-auto mb-8">
                You need an account to book a session. Sign up to see the schedule, book sessions, and manage your recordings.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/login?redirect=/book"
                  className="bg-accent text-black font-mono text-base font-bold tracking-wider uppercase px-8 py-4 hover:bg-accent/90 transition-colors no-underline inline-flex items-center justify-center"
                >
                  SIGN UP / LOG IN
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
