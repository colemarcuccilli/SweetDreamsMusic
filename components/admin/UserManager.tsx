'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, ExternalLink, Shield, Wrench, Music, User, Check } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  public_profile_slug: string;
  profile_picture_url: string | null;
  role: string;
  email: string | null;
  is_producer: boolean;
  producer_name: string | null;
  files_count: number;
  notes_count: number;
}

const ROLE_OPTIONS = [
  { value: 'user', label: 'User', icon: User },
  { value: 'engineer', label: 'Engineer', icon: Wrench },
  { value: 'admin', label: 'Admin', icon: Shield },
];

export default function UserManager() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'user' | 'engineer' | 'admin' | 'producer'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/library/clients')
      .then((r) => r.json())
      .then((d) => setProfiles(d.clients || []))
      .finally(() => setLoading(false));
  }, []);

  async function updateRole(profileId: string, role: string) {
    setUpdatingId(profileId);
    const res = await fetch('/api/admin/users/update-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId, role }),
    });
    if (res.ok) {
      setProfiles((prev) => prev.map((p) => p.id === profileId ? { ...p, role } : p));
    }
    setUpdatingId(null);
  }

  async function toggleProducer(profileId: string, currentValue: boolean) {
    setUpdatingId(profileId);
    const res = await fetch('/api/admin/users/update-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId, is_producer: !currentValue }),
    });
    if (res.ok) {
      setProfiles((prev) => prev.map((p) => p.id === profileId ? { ...p, is_producer: !currentValue } : p));
    }
    setUpdatingId(null);
  }

  const filtered = useMemo(() => {
    let result = profiles;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        p.display_name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.producer_name?.toLowerCase().includes(q)
      );
    }
    if (filter === 'producer') {
      result = result.filter((p) => p.is_producer);
    } else if (filter !== 'all') {
      result = result.filter((p) => p.role === filter);
    }
    return result;
  }, [profiles, search, filter]);

  const counts = useMemo(() => ({
    all: profiles.length,
    user: profiles.filter((p) => p.role === 'user').length,
    engineer: profiles.filter((p) => p.role === 'engineer').length,
    admin: profiles.filter((p) => p.role === 'admin').length,
    producer: profiles.filter((p) => p.is_producer).length,
  }), [profiles]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-heading-md">USERS ({profiles.length})</h2>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-0 border-b border-black/10 mb-6 overflow-x-auto">
        {([
          { key: 'all', label: 'All' },
          { key: 'user', label: 'Users' },
          { key: 'engineer', label: 'Engineers' },
          { key: 'admin', label: 'Admins' },
          { key: 'producer', label: 'Producers' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`font-mono text-xs uppercase tracking-wider px-4 py-3 border-b-2 transition-colors flex-shrink-0 ${
              filter === tab.key
                ? 'border-accent text-black font-bold'
                : 'border-transparent text-black/40 hover:text-black/70'
            }`}
          >
            {tab.label} ({counts[tab.key]})
          </button>
        ))}
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black/30" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or producer name..."
          className="w-full border-2 border-black/20 pl-10 pr-4 py-3 font-mono text-sm focus:border-accent focus:outline-none"
        />
      </div>

      {loading ? (
        <p className="font-mono text-sm text-black/40">Loading users...</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((profile) => (
            <div key={profile.id} className="border border-black/10 p-4 hover:border-black/20 transition-colors">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 bg-black/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {profile.profile_picture_url ? (
                    <img src={profile.profile_picture_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-heading text-lg text-black/20">{profile.display_name?.[0]}</span>
                  )}
                </div>

                {/* User info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm font-semibold truncate">{profile.display_name}</p>
                    {profile.is_producer && (
                      <span className="bg-accent/20 text-accent font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                        Producer
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-xs text-black/40 truncate">
                    {profile.email || 'No email'}
                    {profile.producer_name && ` · ${profile.producer_name}`}
                  </p>
                  <p className="font-mono text-[10px] text-black/30 mt-0.5">
                    {profile.files_count} files · {profile.notes_count} notes
                  </p>
                </div>

                {/* Role dropdown */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={profile.role}
                    onChange={(e) => updateRole(profile.id, e.target.value)}
                    disabled={updatingId === profile.id}
                    className="border border-black/20 px-2 py-1.5 font-mono text-xs focus:border-accent focus:outline-none bg-white disabled:opacity-50"
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>

                  {/* Producer toggle */}
                  <button
                    onClick={() => toggleProducer(profile.id, profile.is_producer)}
                    disabled={updatingId === profile.id}
                    title={profile.is_producer ? 'Remove producer access' : 'Grant producer access'}
                    className={`border px-2 py-1.5 font-mono text-xs uppercase tracking-wider inline-flex items-center gap-1 transition-colors disabled:opacity-50 ${
                      profile.is_producer
                        ? 'border-accent bg-accent/10 text-accent font-bold'
                        : 'border-black/20 text-black/40 hover:border-accent hover:text-accent'
                    }`}
                  >
                    <Music className="w-3 h-3" />
                    {profile.is_producer ? <Check className="w-3 h-3" /> : null}
                  </button>

                  {/* Profile link */}
                  {profile.public_profile_slug && (
                    <a
                      href={`/u/${profile.public_profile_slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline p-1.5 flex-shrink-0"
                      title="View profile"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="font-mono text-sm text-black/30 text-center py-8">No users found</p>
          )}
        </div>
      )}
    </div>
  );
}
