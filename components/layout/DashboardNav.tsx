'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Shield, Wrench, User, Music, Rocket, Bell, Users, PartyPopper, Film } from 'lucide-react';
import type { UserRole } from '@/lib/constants';
import SignOutButton from '@/components/auth/SignOutButton';

interface DashboardNavProps {
  role: UserRole;
  isProducer?: boolean;
  displayName?: string;
  email: string;
  profileSlug?: string;
}

export default function DashboardNav({ role, isProducer, displayName, email, profileSlug }: DashboardNavProps) {
  const pathname = usePathname();

  const tabs = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, show: true },
    { href: '/dashboard/hub', label: 'Artist Hub', icon: Rocket, show: true },
    { href: '/dashboard/bands', label: 'Bands', icon: Users, show: true },
    { href: '/dashboard/events', label: 'Events', icon: PartyPopper, show: true },
    // Media Hub — visible to every logged-in user. Visibility filtering
    // (solo doesn't see band-only offerings) happens *inside* the page,
    // not at the tab level. Rule per Cole: tab is universal, catalog
    // adapts.
    { href: '/dashboard/media', label: 'Media', icon: Film, show: true },
    { href: '/engineer', label: 'Engineer', icon: Wrench, show: role === 'engineer' || role === 'admin' },
    { href: '/producer', label: 'Producer', icon: Music, show: isProducer === true },
    { href: '/admin', label: 'Admin', icon: Shield, show: role === 'admin' },
  ].filter((t) => t.show);

  return (
    <section className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-8 sm:pt-12 pb-6">
          <div>
            <h1 className="text-heading-xl">{displayName || 'Welcome'}</h1>
            <p className="font-mono text-white/80 text-sm mt-1">{email}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/updates"
              className={`border border-white/20 text-white font-mono text-xs font-bold uppercase tracking-wider px-3 py-2 hover:border-accent hover:text-accent transition-colors no-underline inline-flex items-center gap-1.5 ${
                pathname === '/dashboard/updates' ? 'border-accent text-accent' : ''
              }`}
              title="Platform Updates"
            >
              <Bell className="w-4 h-4" /> Updates
            </Link>
            {profileSlug && (
              <Link
                href={`/u/${profileSlug}`}
                className="border border-white/20 text-white font-mono text-xs font-bold uppercase tracking-wider px-4 py-2 hover:border-accent hover:text-accent transition-colors no-underline inline-flex items-center gap-2"
              >
                <User className="w-4 h-4" /> Profile
              </Link>
            )}
            <SignOutButton />
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-0 overflow-x-auto border-t border-white/10">
          {tabs.map((t) => {
            const isActive = t.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`font-mono text-sm font-semibold uppercase tracking-wider px-5 py-4 border-b-2 transition-colors inline-flex items-center gap-2 flex-shrink-0 no-underline ${
                  isActive
                    ? 'border-accent text-accent'
                    : 'border-transparent text-white/60 hover:text-white/80'
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
