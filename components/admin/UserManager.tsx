'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, ExternalLink } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  public_profile_slug: string;
  profile_picture_url: string | null;
  files_count: number;
  notes_count: number;
}

export default function UserManager() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/library/clients')
      .then((r) => r.json())
      .then((d) => setProfiles(d.clients || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return profiles;
    const q = search.toLowerCase();
    return profiles.filter((p) => p.display_name?.toLowerCase().includes(q));
  }, [profiles, search]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-heading-md">USERS ({profiles.length})</h2>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black/30" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full border-2 border-black/20 pl-10 pr-4 py-3 font-mono text-sm focus:border-accent focus:outline-none"
        />
      </div>

      {loading ? (
        <p className="font-mono text-sm text-black/40">Loading users...</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((profile) => (
            <div key={profile.id} className="border border-black/10 p-4 flex items-center gap-4 hover:border-black/20 transition-colors">
              <div className="w-10 h-10 bg-black/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {profile.profile_picture_url ? (
                  <img src={profile.profile_picture_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-heading text-lg text-black/20">{profile.display_name?.[0]}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm font-semibold truncate">{profile.display_name}</p>
                <p className="font-mono text-xs text-black/40">
                  {profile.files_count} files · {profile.notes_count} notes
                </p>
              </div>
              {profile.public_profile_slug && (
                <a
                  href={`/u/${profile.public_profile_slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-accent hover:underline inline-flex items-center gap-1 flex-shrink-0"
                >
                  Profile <ExternalLink className="w-3 h-3" />
                </a>
              )}
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
