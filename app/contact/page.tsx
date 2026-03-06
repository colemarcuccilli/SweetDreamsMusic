import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/constants';
import ContactForm from '@/components/shared/ContactForm';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Sweet Dreams Music recording studio. Questions about booking, pricing, or our services? We\'re here to help.',
  alternates: { canonical: `${SITE_URL}/contact` },
};

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-black text-white py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-accent text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase mb-3">
            Get in Touch
          </p>
          <h1 className="text-display-md mb-6">CONTACT US</h1>
          <p className="font-mono text-white/70 text-body-md max-w-2xl">
            Have a question about booking, pricing, or our services? Send us a message and we&apos;ll get back to you.
          </p>
        </div>
      </section>

      {/* Contact Form - White */}
      <section className="bg-white text-black py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <ContactForm />
        </div>
      </section>
    </>
  );
}
