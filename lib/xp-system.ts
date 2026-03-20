// ============================================================
// XP & Leveling System for Artist Hub
// ============================================================

// XP needed to advance FROM level N to level N+1
// Starts fast (80 XP for level 2), gradually gets harder
// Level 10: ~3,000 total XP | Level 50: ~100k | Level 100: ~500k
export function xpForNextLevel(level: number): number {
  return Math.floor(50 + 30 * Math.pow(level, 1.3));
}

// Total cumulative XP needed to REACH a given level
export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpForNextLevel(i);
  }
  return total;
}

// Given total XP, calculate current level and progress
export function calculateLevel(totalXp: number): {
  level: number;
  currentLevelXp: number;   // XP earned within current level
  nextLevelXp: number;      // XP needed to reach next level
  progress: number;          // 0-100 percentage
  totalXp: number;
} {
  let level = 1;
  let remaining = totalXp;

  while (true) {
    const needed = xpForNextLevel(level);
    if (remaining < needed) {
      return {
        level,
        currentLevelXp: remaining,
        nextLevelXp: needed,
        progress: Math.min(100, Math.round((remaining / needed) * 100)),
        totalXp,
      };
    }
    remaining -= needed;
    level++;
  }
}

// Level title based on level ranges
export function getLevelTitle(level: number): string {
  if (level <= 3) return 'Newcomer';
  if (level <= 7) return 'Rising';
  if (level <= 12) return 'Committed';
  if (level <= 18) return 'Dedicated';
  if (level <= 25) return 'Skilled';
  if (level <= 35) return 'Established';
  if (level <= 50) return 'Veteran';
  if (level <= 70) return 'Master';
  if (level <= 100) return 'Legend';
  return 'Icon';
}

// Level color gradient based on level
export function getLevelColor(level: number): string {
  if (level <= 5) return '#9CA3AF';   // gray
  if (level <= 10) return '#3B82F6';  // blue
  if (level <= 20) return '#8B5CF6';  // purple
  if (level <= 35) return '#F4C430';  // gold
  if (level <= 50) return '#F97316';  // orange
  if (level <= 75) return '#EF4444';  // red
  if (level <= 100) return '#EC4899'; // pink
  return '#F4C430';                   // diamond gold
}

// ============================================================
// XP Action Values
// ============================================================
export const XP_ACTIONS = {
  hub_visit: { xp: 10, label: 'Daily Hub Visit', once_per_day: true },
  create_project: { xp: 15, label: 'Created a Project' },
  complete_task: { xp: 10, label: 'Completed a Task' },
  advance_phase: { xp: 50, label: 'Advanced Project Phase' },
  complete_project: { xp: 200, label: 'Completed a Project' },
  set_goal: { xp: 10, label: 'Set a New Goal' },
  update_goal: { xp: 5, label: 'Updated Goal Progress' },
  complete_goal: { xp: 75, label: 'Completed a Goal' },
  log_metrics: { xp: 15, label: 'Logged Metrics' },
  add_calendar_event: { xp: 5, label: 'Added Calendar Event' },
  book_session: { xp: 25, label: 'Booked a Session' },
  complete_session: { xp: 50, label: 'Completed a Session' },
  log_session_notes: { xp: 25, label: 'Logged Session Notes' },
  unlock_achievement: { xp: 100, label: 'Unlocked Achievement' },
  daily_streak: { xp: 5, label: 'Daily Streak Bonus' }, // multiplied by streak count (capped at 10)
} as const;

export type XpAction = keyof typeof XP_ACTIONS;

// ============================================================
// Platform Level Thresholds (follower/listener-based)
// ============================================================
export const PLATFORM_LEVEL_THRESHOLDS = [
  0,        // Level 1
  50,       // Level 2
  100,      // Level 3
  250,      // Level 4
  500,      // Level 5
  1000,     // Level 6
  2500,     // Level 7
  5000,     // Level 8
  10000,    // Level 9
  25000,    // Level 10
  50000,    // Level 11
  100000,   // Level 12
  250000,   // Level 13
  500000,   // Level 14
  1000000,  // Level 15
] as const;

export function getPlatformLevel(followers: number): {
  level: number;
  nextThreshold: number | null;
  progress: number;
} {
  let level = 1;
  for (let i = 1; i < PLATFORM_LEVEL_THRESHOLDS.length; i++) {
    if (followers >= PLATFORM_LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  const currentThreshold = PLATFORM_LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = PLATFORM_LEVEL_THRESHOLDS[level] ?? null;
  const progress = nextThreshold
    ? Math.min(100, Math.round(((followers - currentThreshold) / (nextThreshold - currentThreshold)) * 100))
    : 100;

  return { level, nextThreshold, progress };
}

export function getPlatformLevelTitle(level: number): string {
  if (level <= 2) return 'Starting Out';
  if (level <= 4) return 'Building';
  if (level <= 6) return 'Growing';
  if (level <= 8) return 'Buzzing';
  if (level <= 10) return 'Popping';
  if (level <= 12) return 'Viral';
  if (level <= 14) return 'Major';
  return 'Superstar';
}
