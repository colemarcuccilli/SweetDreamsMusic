import Link from 'next/link';
import { NAV_LINKS, BRAND } from '@/lib/constants';

export default function Footer() {
  return (
    <footer className="bg-black text-white border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <h3 className="text-2xl mb-4">SWEET DREAMS MUSIC</h3>
            <p className="font-mono text-white/60 text-sm leading-relaxed">
              Professional recording studio in {BRAND.address.city}, {BRAND.address.state}.
              Sessions starting at $50/hour.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-lg mb-4">NAVIGATE</h4>
            <nav className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-mono text-sm text-white/60 hover:text-accent transition-colors no-underline"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Studio Hours */}
          <div>
            <h4 className="text-lg mb-4">STUDIO HOURS</h4>
            <div className="font-mono text-sm text-white/60 space-y-2">
              <p>Mon – Sun: 9:00 AM – 9:00 PM</p>
              <p>After Hours: 9:00 PM – 3:00 AM</p>
              <p className="text-accent text-xs mt-3">After-hours +$10/hr surcharge</p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-mono text-xs text-white/40">
            &copy; {new Date().getFullYear()} {BRAND.legalName}. All rights reserved.
          </p>
          <Link
            href="https://sweetdreams.us"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-white/40 hover:text-accent transition-colors no-underline"
          >
            A Sweet Dreams Studios Company
          </Link>
        </div>
      </div>
    </footer>
  );
}
