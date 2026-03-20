// ============================================================
// Achievement Definitions
// Each achievement has conditions checked automatically
// ============================================================

export interface AchievementDef {
  title: string;
  description: string;
  icon: string;
  xp: number;       // XP awarded on unlock
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  category: 'sessions' | 'projects' | 'metrics' | 'goals' | 'engagement' | 'milestones' | 'engineer';
}

export const ACHIEVEMENTS: Record<string, AchievementDef> = {
  // === Sessions ===
  first_session: {
    title: 'First Session',
    description: 'Completed your first studio session',
    icon: 'Mic', xp: 100, tier: 'bronze', category: 'sessions',
  },
  five_sessions: {
    title: 'Regular',
    description: 'Completed 5 studio sessions',
    icon: 'Calendar', xp: 150, tier: 'silver', category: 'sessions',
  },
  ten_sessions: {
    title: 'Studio Rat',
    description: 'Completed 10 studio sessions',
    icon: 'Star', xp: 200, tier: 'gold', category: 'sessions',
  },
  twenty_five_sessions: {
    title: 'Dedicated',
    description: 'Completed 25 studio sessions',
    icon: 'Award', xp: 500, tier: 'diamond', category: 'sessions',
  },

  // === Projects ===
  first_project: {
    title: 'Project Started',
    description: 'Created your first project',
    icon: 'Folder', xp: 50, tier: 'bronze', category: 'projects',
  },
  first_release: {
    title: 'Released!',
    description: 'Released your first project',
    icon: 'Rocket', xp: 200, tier: 'silver', category: 'projects',
  },
  five_releases: {
    title: 'Prolific',
    description: 'Released 5 projects',
    icon: 'Disc', xp: 500, tier: 'gold', category: 'projects',
  },
  ten_releases: {
    title: 'Catalog Builder',
    description: 'Released 10 projects',
    icon: 'Library', xp: 750, tier: 'diamond', category: 'projects',
  },

  // === Metrics ===
  first_metric_log: {
    title: 'Data Driven',
    description: 'Logged your first metrics',
    icon: 'BarChart', xp: 50, tier: 'bronze', category: 'metrics',
  },
  four_week_streak: {
    title: 'Consistent',
    description: 'Logged metrics 4 weeks in a row',
    icon: 'Flame', xp: 150, tier: 'silver', category: 'metrics',
  },
  twelve_week_streak: {
    title: 'Data Master',
    description: 'Logged metrics 12 weeks in a row',
    icon: 'Flame', xp: 300, tier: 'gold', category: 'metrics',
  },

  // === Goals ===
  first_goal_set: {
    title: 'Ambitious',
    description: 'Set your first goal',
    icon: 'Target', xp: 50, tier: 'bronze', category: 'goals',
  },
  first_goal_completed: {
    title: 'Goal Getter',
    description: 'Completed your first goal',
    icon: 'Trophy', xp: 150, tier: 'silver', category: 'goals',
  },
  five_goals_completed: {
    title: 'Unstoppable',
    description: 'Completed 5 goals',
    icon: 'Trophy', xp: 300, tier: 'gold', category: 'goals',
  },

  // === Engineer ===
  eng_first_session: {
    title: 'First Mix',
    description: 'Engineered your first session',
    icon: 'Wrench', xp: 100, tier: 'bronze', category: 'engineer',
  },
  eng_five_sessions: {
    title: 'Board Operator',
    description: 'Engineered 5 sessions',
    icon: 'Sliders', xp: 150, tier: 'silver', category: 'engineer',
  },
  eng_ten_sessions: {
    title: 'Mix Master',
    description: 'Engineered 10 sessions',
    icon: 'Headphones', xp: 200, tier: 'gold', category: 'engineer',
  },
  eng_twenty_five_sessions: {
    title: 'Studio Veteran',
    description: 'Engineered 25 sessions',
    icon: 'Award', xp: 500, tier: 'diamond', category: 'engineer',
  },
  eng_fifty_sessions: {
    title: 'Legendary Engineer',
    description: 'Engineered 50 sessions',
    icon: 'Crown', xp: 1000, tier: 'diamond', category: 'engineer',
  },

  // === Engagement ===
  profile_complete: {
    title: 'Looking Good',
    description: 'Completed your full profile',
    icon: 'User', xp: 50, tier: 'bronze', category: 'engagement',
  },
  first_beat_saved: {
    title: 'Beat Collector',
    description: 'Saved your first beat',
    icon: 'Heart', xp: 50, tier: 'bronze', category: 'engagement',
  },
  first_lyrics: {
    title: 'Wordsmith',
    description: 'Wrote lyrics for the first time',
    icon: 'PenLine', xp: 50, tier: 'bronze', category: 'engagement',
  },
  first_session_notes: {
    title: 'Reviewer',
    description: 'Wrote your first session notes',
    icon: 'FileText', xp: 50, tier: 'bronze', category: 'engagement',
  },

  // === Milestones ===
  level_5: {
    title: 'Getting Started',
    description: 'Reached Level 5',
    icon: 'Zap', xp: 100, tier: 'bronze', category: 'milestones',
  },
  level_10: {
    title: 'On the Rise',
    description: 'Reached Level 10',
    icon: 'Zap', xp: 200, tier: 'silver', category: 'milestones',
  },
  level_25: {
    title: 'Committed Artist',
    description: 'Reached Level 25',
    icon: 'Zap', xp: 500, tier: 'gold', category: 'milestones',
  },
  level_50: {
    title: 'Veteran',
    description: 'Reached Level 50',
    icon: 'Crown', xp: 1000, tier: 'diamond', category: 'milestones',
  },
  seven_day_streak: {
    title: 'Week Warrior',
    description: '7-day hub visit streak',
    icon: 'Flame', xp: 100, tier: 'bronze', category: 'milestones',
  },
  thirty_day_streak: {
    title: 'Monthly Grinder',
    description: '30-day hub visit streak',
    icon: 'Flame', xp: 300, tier: 'silver', category: 'milestones',
  },
  hundred_tasks: {
    title: 'Task Machine',
    description: 'Completed 100 tasks across all projects',
    icon: 'CheckCircle', xp: 300, tier: 'gold', category: 'milestones',
  },
};

// Tier colors for badge styling
export const TIER_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  bronze: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', glow: 'shadow-amber-200' },
  silver: { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-600', glow: 'shadow-gray-200' },
  gold: { bg: 'bg-yellow-50', border: 'border-yellow-400', text: 'text-yellow-700', glow: 'shadow-yellow-200' },
  diamond: { bg: 'bg-cyan-50', border: 'border-cyan-300', text: 'text-cyan-700', glow: 'shadow-cyan-200' },
};
