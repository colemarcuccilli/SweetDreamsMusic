'use client';

import { useState } from 'react';
import { Users, Calendar, Link as LinkIcon } from 'lucide-react';
import type { SessionUser } from '@/lib/auth';
import ClientLibrary from './ClientLibrary';
import EngineerSessions from './EngineerSessions';
import CreateInvite from './CreateInvite';

type Tab = 'library' | 'sessions' | 'invite';

export default function EngineerDashboard({ user }: { user: SessionUser }) {
  const [tab, setTab] = useState<Tab>('library');

  const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: 'library', label: 'Client Library', icon: Users },
    { key: 'sessions', label: 'My Sessions', icon: Calendar },
    { key: 'invite', label: 'Invite to Session', icon: LinkIcon },
  ];

  return (
    <>
      {/* Sub-tabs for engineer sections */}
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
          {tab === 'library' && <ClientLibrary />}
          {tab === 'sessions' && <EngineerSessions userEmail={user.email} />}
          {tab === 'invite' && <CreateInvite />}
        </div>
      </section>
    </>
  );
}
