import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Booking Confirmed',
  description: 'Your recording session has been booked. Check your email for confirmation details.',
};

export default function BookingSuccessPage() {
  return (
    <section className="bg-white text-black min-h-[80vh] flex items-center justify-center py-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <CheckCircle className="w-16 h-16 text-accent mx-auto mb-6" strokeWidth={1.5} />
        <h1 className="text-display-sm mb-4">BOOKING CONFIRMED</h1>
        <p className="font-mono text-black/60 text-body-md mb-8">
          Your session has been booked and payment received. Check your email for confirmation
          details including the studio address and what to bring.
        </p>

        <div className="border-2 border-black p-6 sm:p-8 mb-8 text-left">
          <h2 className="text-heading-sm mb-4">WHAT&apos;S NEXT</h2>
          <ul className="font-mono text-sm text-black/70 space-y-3">
            <li className="flex gap-3">
              <span className="text-accent font-bold">1.</span>
              Check your email for a confirmation with your session details
            </li>
            <li className="flex gap-3">
              <span className="text-accent font-bold">2.</span>
              Arrive 10 minutes early to get settled in
            </li>
            <li className="flex gap-3">
              <span className="text-accent font-bold">3.</span>
              Bring your lyrics, beats, or reference tracks ready to go
            </li>
            <li className="flex gap-3">
              <span className="text-accent font-bold">4.</span>
              Your engineer will handle the rest — let&apos;s make music
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="border-2 border-black text-black font-mono text-base font-bold tracking-wider uppercase px-8 py-4 hover:bg-black hover:text-white transition-colors no-underline inline-flex items-center justify-center"
          >
            BACK TO HOME
          </Link>
          <Link
            href="/book"
            className="bg-black text-white font-mono text-base font-bold tracking-wider uppercase px-8 py-4 hover:bg-black/80 transition-colors no-underline inline-flex items-center justify-center"
          >
            BOOK ANOTHER SESSION
          </Link>
        </div>
      </div>
    </section>
  );
}
