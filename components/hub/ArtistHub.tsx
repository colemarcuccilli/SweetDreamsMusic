'use client';

import { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Folder, Target, BarChart3, CalendarDays, Award, BookOpen, FileText } from 'lucide-react';
import { HUB_TABS, type HubTab } from '@/lib/hub-constants';
import { calculateLevel, getLevelTitle, getLevelColor } from '@/lib/xp-system';
import XPBar from './XPBar';
import HubOverview from './HubOverview';
import ProjectList from './ProjectList';
import GoalTracker from './GoalTracker';
import MetricsDashboard from './MetricsDashboard';
import ContentCalendar from './ContentCalendar';
import AchievementBadges from './AchievementBadges';
import ArtistRoadmap from './ArtistRoadmap';
import SessionNotes from './SessionNotes';

const TAB_ICONS: Record<string, typeof LayoutDashboard> = {
  overview: LayoutDashboard,
  projects: Folder,
  goals: Target,
  metrics: BarChart3,
  calendar: CalendarDays,
  achievements: Award,
  roadmap: BookOpen,
  notes: FileText,
};

// Extended tabs with session notes
const EXTENDED_TABS = [
  ...HUB_TABS,
  { key: 'notes' as const, label: 'Notes' },
];

type ExtendedTab = HubTab | 'notes';

interface XpHistoryItem {
  label: string;
  xp_amount: number;
  action: string;
  created_at: string;
}

interface XpData {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progress: number;
  totalXp: number;
  streak: number;
  recentXp: { label: string; xp: number }[];
  xpHistory: XpHistoryItem[];
}

export default function ArtistHub({ userId }: { userId: string }) {
  const [tab, setTab] = useState<ExtendedTab>('overview');
  const [xpData, setXpData] = useState<XpData | null>(null);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const [achievementProgress, setAchievementProgress] = useState<Record<string, { current: number; target: number }>>({});

  const loadXp = useCallback(async () => {
    try {
      const res = await fetch('/api/hub/xp');
      if (!res.ok) return;
      const data = await res.json();
      const levelInfo = calculateLevel(data.totalXp || 0);
      // Build recent XP pills from xpHistory (last few unique actions)
      const recentXp = (data.xpHistory || [])
        .slice(0, 5)
        .map((h: { label: string; xp_amount: number }) => ({
          label: h.label,
          xp: h.xp_amount,
        }));
      setXpData({
        ...levelInfo,
        streak: data.dailyStreak || 0,
        recentXp,
        xpHistory: (data.xpHistory || []).slice(0, 5),
      });
    } catch {
      // silent
    }
  }, []);

  const checkAchievements = useCallback(async () => {
    try {
      const res = await fetch('/api/hub/achievements/check', { method: 'POST' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.progress) {
        setAchievementProgress(data.progress);
      }
      if (data.newAchievements?.length > 0) {
        setNewAchievements(data.newAchievements);
        // Reload XP after achievement awards
        loadXp();
      }
    } catch {
      // silent
    }
  }, [loadXp]);

  useEffect(() => {
    loadXp();
    // Check achievements on mount (slight delay to let XP load first)
    const timer = setTimeout(checkAchievements, 2000);
    return () => clearTimeout(timer);
  }, [loadXp, checkAchievements]);

  // Callback for child components to trigger XP refresh + re-check achievements
  const onXpEarned = useCallback(() => {
    loadXp();
    // Re-check achievements after any XP-granting action
    setTimeout(checkAchievements, 500);
  }, [loadXp, checkAchievements]);

  return (
    <>
      {/* XP Bar */}
      {xpData && (
        <section className="bg-white text-black border-b border-black/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <XPBar
              level={xpData.level}
              currentLevelXp={xpData.currentLevelXp}
              nextLevelXp={xpData.nextLevelXp}
              progress={xpData.progress}
              totalXp={xpData.totalXp}
              title={getLevelTitle(xpData.level)}
              color={getLevelColor(xpData.level)}
              streak={xpData.streak}
              recentXp={xpData.recentXp}
              xpHistory={xpData.xpHistory}
            />
          </div>
        </section>
      )}

      {/* Sub-tabs */}
      <section className="bg-white text-black border-b-2 border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-0 overflow-x-auto scrollbar-hide">
            {EXTENDED_TABS.map((t) => {
              const Icon = TAB_ICONS[t.key] || LayoutDashboard;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key as ExtendedTab)}
                  className={`font-mono text-sm font-semibold uppercase tracking-wider px-5 py-4 border-b-2 transition-all duration-200 inline-flex items-center gap-2 flex-shrink-0 ${
                    tab === t.key
                      ? 'border-accent text-black'
                      : 'border-transparent text-black/40 hover:text-black/70 hover:border-black/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white text-black py-8 sm:py-12 min-h-[60vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {tab === 'overview' && <HubOverview onXpEarned={onXpEarned} onNavigate={(t) => setTab(t as ExtendedTab)} />}
          {tab === 'projects' && <ProjectList onXpEarned={onXpEarned} />}
          {tab === 'goals' && <GoalTracker onXpEarned={onXpEarned} />}
          {tab === 'metrics' && <MetricsDashboard onXpEarned={onXpEarned} />}
          {tab === 'calendar' && <ContentCalendar onXpEarned={onXpEarned} />}
          {tab === 'achievements' && <AchievementBadges newUnlocks={newAchievements} progress={achievementProgress} onDismiss={() => setNewAchievements([])} />}
          {tab === 'roadmap' && <ArtistRoadmap />}
          {tab === 'notes' && <SessionNotes onXpEarned={onXpEarned} />}

        </div>
      </section>
    </>
  );
}
