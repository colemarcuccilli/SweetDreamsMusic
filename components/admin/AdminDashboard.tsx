'use client';

import { useState } from 'react';
import { Calendar, Music, Users, DollarSign, Clock, Video, Mic, FileText, LayoutDashboard } from 'lucide-react';
import type { SessionUser } from '@/lib/auth';
import AdminOverview from './AdminOverview';
import BookingManager from './BookingManager';
import BeatManager from './BeatManager';
import UserManager from './UserManager';
import Accounting from './Accounting';
import StudioBlocks from './StudioBlocks';
import MediaSales from './MediaSales';
import ProducerApplications from './ProducerApplications';
import ContractsViewer from './ContractsViewer';

type Tab = 'overview' | 'accounting' | 'bookings' | 'media' | 'blocks' | 'beats' | 'producers' | 'contracts' | 'users';

export default function AdminDashboard({ user }: { user: SessionUser }) {
  const [tab, setTab] = useState<Tab>('overview');

  const tabs: { key: Tab; label: string; icon: typeof Calendar }[] = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'accounting', label: 'Accounting', icon: DollarSign },
    { key: 'bookings', label: 'Bookings', icon: Calendar },
    { key: 'media', label: 'Media Sales', icon: Video },
    { key: 'blocks', label: 'Block Off', icon: Clock },
    { key: 'beats', label: 'Beat Store', icon: Music },
    { key: 'producers', label: 'Producers', icon: Mic },
    { key: 'contracts', label: 'Contracts', icon: FileText },
    { key: 'users', label: 'Users', icon: Users },
  ];

  return (
    <>
      {/* Sub-tabs for admin sections */}
      <section className="bg-white text-black border-b-2 border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-0 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`font-mono text-sm font-semibold uppercase tracking-wider px-5 py-4 border-b-2 transition-colors inline-flex items-center gap-2 flex-shrink-0 ${
                  tab === t.key ? 'border-accent text-black' : 'border-transparent text-black/40 hover:text-black/70'
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white text-black py-8 sm:py-12 min-h-[60vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {tab === 'overview' && <AdminOverview />}
          {tab === 'accounting' && <Accounting />}
          {tab === 'bookings' && <BookingManager />}
          {tab === 'media' && <MediaSales />}
          {tab === 'blocks' && <StudioBlocks />}
          {tab === 'beats' && <BeatManager />}
          {tab === 'producers' && <ProducerApplications />}
          {tab === 'contracts' && <ContractsViewer />}
          {tab === 'users' && <UserManager />}
        </div>
      </section>
    </>
  );
}
