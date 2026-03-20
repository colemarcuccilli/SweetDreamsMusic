import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { calculateLevel } from '@/lib/xp-system';
import { ACHIEVEMENTS } from '@/lib/achievements';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const service = createServiceClient();

  // Query all relevant data in parallel
  const [
    sessionsResult,
    projectsResult,
    completedProjectsResult,
    goalsResult,
    completedGoalsResult,
    metricsResult,
    tasksResult,
    profileResult,
    sessionNotesResult,
    existingAchievementsResult,
  ] = await Promise.all([
    // Completed bookings (sessions) where customer_email = user.email
    service
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('customer_email', user.email!)
      .eq('status', 'completed'),

    // Total artist_projects
    supabase
      .from('artist_projects')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),

    // Completed/released projects
    supabase
      .from('artist_projects')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .or('status.eq.completed,current_phase.eq.released'),

    // Total goals
    supabase
      .from('artist_goals')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),

    // Completed goals
    supabase
      .from('artist_goals')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed'),

    // Metrics entries
    supabase
      .from('artist_metrics')
      .select('week_of')
      .eq('user_id', user.id)
      .order('week_of', { ascending: false }),

    // Completed tasks
    supabase
      .from('artist_project_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed'),

    // Profile data
    supabase
      .from('profiles')
      .select('total_xp, artist_level, daily_streak, display_name, genre, career_stage, profile_picture_url')
      .eq('id', user.id)
      .single(),

    // Session notes by this user
    supabase
      .from('session_notes')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', user.id),

    // Existing achievements
    supabase
      .from('artist_achievements')
      .select('achievement_key')
      .eq('user_id', user.id),
  ]);

  const completedSessions = sessionsResult.count || 0;
  const totalProjects = projectsResult.count || 0;
  const completedProjects = completedProjectsResult.count || 0;
  const totalGoals = goalsResult.count || 0;
  const completedGoals = completedGoalsResult.count || 0;
  const metricCount = metricsResult.data?.length || 0;
  const completedTasks = tasksResult.count || 0;
  const profile = profileResult.data;
  const sessionNotesCount = sessionNotesResult.count || 0;

  const existingKeys = new Set(
    (existingAchievementsResult.data || []).map((a) => a.achievement_key)
  );

  // Calculate metric weeks streak (consecutive weeks)
  let metricWeeksStreak = 0;
  if (metricsResult.data && metricsResult.data.length > 0) {
    metricWeeksStreak = 1;
    const weeks = metricsResult.data.map((m) => new Date(m.week_of).getTime());
    for (let i = 1; i < weeks.length; i++) {
      const diff = weeks[i - 1] - weeks[i]; // sorted desc
      // ~7 days in ms (allow some slack: 5-9 days)
      if (diff >= 5 * 86400000 && diff <= 9 * 86400000) {
        metricWeeksStreak++;
      } else {
        break;
      }
    }
  }

  const profileComplete = !!(
    profile?.display_name &&
    profile?.genre &&
    profile?.career_stage &&
    profile?.profile_picture_url
  );

  const artistLevel = profile?.artist_level || 0;
  const dailyStreak = profile?.daily_streak || 0;

  // Achievement conditions map
  const conditions: Record<string, boolean> = {
    first_session: completedSessions >= 1,
    five_sessions: completedSessions >= 5,
    ten_sessions: completedSessions >= 10,
    twenty_five_sessions: completedSessions >= 25,
    first_project: totalProjects >= 1,
    first_release: completedProjects >= 1,
    five_releases: completedProjects >= 5,
    ten_releases: completedProjects >= 10,
    first_metric_log: metricCount >= 1,
    four_week_streak: metricWeeksStreak >= 4,
    twelve_week_streak: metricWeeksStreak >= 12,
    first_goal_set: totalGoals >= 1,
    first_goal_completed: completedGoals >= 1,
    five_goals_completed: completedGoals >= 5,
    profile_complete: profileComplete,
    first_session_notes: sessionNotesCount >= 1,
    level_5: artistLevel >= 5,
    level_10: artistLevel >= 10,
    level_25: artistLevel >= 25,
    level_50: artistLevel >= 50,
    seven_day_streak: dailyStreak >= 7,
    thirty_day_streak: dailyStreak >= 30,
    hundred_tasks: completedTasks >= 100,
  };

  const newAchievements: string[] = [];
  let totalXpAwarded = 0;

  for (const [key, met] of Object.entries(conditions)) {
    if (met && !existingKeys.has(key) && ACHIEVEMENTS[key]) {
      newAchievements.push(key);
      totalXpAwarded += ACHIEVEMENTS[key].xp;

      // Insert achievement
      await supabase.from('artist_achievements').insert({
        user_id: user.id,
        achievement_key: key,
      });
    }
  }

  // Award XP for all new achievements at once
  if (totalXpAwarded > 0) {
    const currentXp = profile?.total_xp || 0;
    const newTotal = currentXp + totalXpAwarded;
    const levelInfo = calculateLevel(newTotal);

    await supabase
      .from('profiles')
      .update({
        total_xp: newTotal,
        artist_level: levelInfo.level,
      })
      .eq('id', user.id);

    // Log XP entries for each achievement
    const xpLogs = newAchievements.map((key) => ({
      user_id: user.id,
      action: 'unlock_achievement',
      xp_amount: ACHIEVEMENTS[key].xp,
      label: `Unlocked: ${ACHIEVEMENTS[key].title}`,
      metadata: { achievement: key },
    }));

    if (xpLogs.length > 0) {
      await supabase.from('xp_log').insert(xpLogs);
    }
  }

  return NextResponse.json({ newAchievements, totalXpAwarded });
}
