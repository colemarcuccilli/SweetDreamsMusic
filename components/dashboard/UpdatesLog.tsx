'use client';

import { useMemo, useState } from 'react';
import { Sparkles, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { CHANGELOG, type ChangelogTag, type ChangelogEntry } from '@/lib/changelog';

interface UpdatesLogProps {
  userRole: string; // 'admin' | 'engineer' | 'producer' | 'client' | etc
  isProducer?: boolean;
}

function getVisibleTags(role: string, isProducer?: boolean): ChangelogTag[] {
  const tags: ChangelogTag[] = ['all', 'client'];
  if (role === 'engineer' || role === 'admin') tags.push('engineer');
  if (role === 'admin') tags.push('admin');
  if (isProducer || role === 'admin') tags.push('producer');
  return tags;
}

const TAG_COLORS: Record<ChangelogTag, string> = {
  all: 'bg-accent/20 text-accent',
  client: 'bg-blue-100 text-blue-700',
  engineer: 'bg-green-100 text-green-700',
  producer: 'bg-purple-100 text-purple-700',
  admin: 'bg-red-100 text-red-700',
};

const TAG_LABELS: Record<ChangelogTag, string> = {
  all: 'Everyone',
  client: 'Artists',
  engineer: 'Engineers',
  producer: 'Producers',
  admin: 'Admin',
};

export default function UpdatesLog({ userRole, isProducer }: UpdatesLogProps) {
  const visibleTags = useMemo(() => getVisibleTags(userRole, isProducer), [userRole, isProducer]);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set(['0'])); // First group expanded
  const [filterTag, setFilterTag] = useState<ChangelogTag | 'all_visible'>('all_visible');

  // Filter entries to only those visible to this user's role
  const visibleEntries = useMemo(() => {
    return CHANGELOG.filter(entry =>
      entry.tags.some(tag => visibleTags.includes(tag))
    );
  }, [visibleTags]);

  // Further filter by selected tag
  const filteredEntries = useMemo(() => {
    if (filterTag === 'all_visible') return visibleEntries;
    return visibleEntries.filter(entry => entry.tags.includes(filterTag as ChangelogTag));
  }, [visibleEntries, filterTag]);

  // Group by version
  const grouped = useMemo(() => {
    const map: Record<string, ChangelogEntry[]> = {};
    filteredEntries.forEach(entry => {
      const key = `${entry.version} — ${entry.date}`;
      if (!map[key]) map[key] = [];
      map[key].push(entry);
    });
    return Object.entries(map);
  }, [filteredEntries]);

  function toggleVersion(idx: string) {
    setExpandedVersions(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilterTag('all_visible')}
          className={`font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 transition-colors ${
            filterTag === 'all_visible' ? 'bg-black text-white' : 'bg-black/5 text-black/40 hover:bg-black/10'
          }`}
        >
          All Updates
        </button>
        {visibleTags.filter(t => t !== 'all').map(tag => (
          <button
            key={tag}
            onClick={() => setFilterTag(tag)}
            className={`font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 transition-colors ${
              filterTag === tag ? 'bg-black text-white' : 'bg-black/5 text-black/40 hover:bg-black/10'
            }`}
          >
            {TAG_LABELS[tag]}
          </button>
        ))}
      </div>

      {/* Changelog */}
      <div className="space-y-4">
        {grouped.length === 0 && (
          <p className="font-mono text-sm text-black/30 text-center py-12">No updates match this filter</p>
        )}

        {grouped.map(([versionKey, entries], idx) => {
          const idxStr = String(idx);
          const isExpanded = expandedVersions.has(idxStr);
          const version = entries[0].version;
          const date = entries[0].date;

          return (
            <div key={versionKey} className="border-2 border-black/10">
              <button
                onClick={() => toggleVersion(idxStr)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-black/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="bg-accent text-black font-mono text-[10px] font-bold px-2 py-1">
                    v{version}
                  </span>
                  <span className="font-mono text-sm font-bold">
                    {entries.length === 1 ? entries[0].title : `${entries.length} updates`}
                  </span>
                  <span className="font-mono text-xs text-black/30">
                    {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-black/30" /> : <ChevronDown className="w-4 h-4 text-black/30" />}
              </button>

              {isExpanded && (
                <div className="border-t border-black/10 divide-y divide-black/5">
                  {entries.map((entry, eIdx) => (
                    <div key={eIdx} className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <h4 className="font-mono text-sm font-bold">{entry.title}</h4>
                          <p className="font-mono text-xs text-black/50 mt-0.5">{entry.description}</p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {entry.tags.map(tag => (
                            <span key={tag} className={`font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 ${TAG_COLORS[tag]}`}>
                              {TAG_LABELS[tag]}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ul className="space-y-1 mt-3">
                        {entry.items.map((item, iIdx) => (
                          <li key={iIdx} className="font-mono text-xs text-black/60 flex items-start gap-2">
                            <Sparkles className="w-3 h-3 text-accent flex-shrink-0 mt-0.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
