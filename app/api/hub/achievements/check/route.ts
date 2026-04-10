import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { calculateLevel } from '@/lib/xp-system';
import { ACHIEVEMENTS } from '@/lib/achievements';
import { ENGINEERS } from '@/lib/constants';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const service = createServiceClient();

  // Determine if this user is an engineer (by email match)
  const isEngineer = ENGINEERS.some(
    (e) => e.email.toLowerCase() === user.email?.toLowerCase()
  );
  const engineerConfig = ENGINEERS.find(
    (e) => e.email.toLowerCase() === user.email?.toLowerCase()
  );

  // Query all relevant data in parallel
  const [
    sessionsResult,
    engineerSessionsResult,
    projectsResult,
    completedProjectsResult,
    goalsResult,
    completedGoalsResult,
    metricsResult,
    tasksResult,
    profileResult,
    sessionNotesResult,
    beatPurchasesResult,
    calendarEventsResult,
    platformConnectionsResult,
    existingAchievementsResult,
  ] = await Promise.all([
    // Completed bookings as CLIENT (customer_email = user.email)
    // IMPORTANT: Exclude sessions where this user is the ENGINEER, not the client
    // We filter out bookings where engineer_name matches this user's engineer name
    service
      .from('bookings')
      .select('id, engineer_name', { count: 'exact', head: false })
      .eq('customer_email', user.email!)
      .eq('status', 'completed'),

    // Completed bookings as ENGINEER (for engineer-specific achievements)
    isEngineer && engineerConfig
      ? service
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('engineer_name', engineerConfig.name)
          .eq('status', 'completed')
      : Promise.resolve({ count: 0, data: null, error: null }),

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
      .select('total_xp, artist_level, daily_streak, display_name, genre, career_stage, profile_picture_url, public_profile_slug, role')
      .eq('user_id', user.id)
      .single(),

    // Session notes by this user
    supabase
      .from('session_notes')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', user.id),

    // Beat purchases by this user
    service
      .from('beat_purchases')
      .select('id', { count: 'exact', head: true })
      .eq('buyer_id', user.id),

    // Calendar events created by this user
    supabase
      .from('calendar_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),

    // Platform connections (Spotify, YouTube, etc.)
    supabase
      .from('platform_connections')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),

    // Existing achievements
    supabase
      .from('artist_achievements')
      .select('achievement_key')
      .eq('user_id', user.id),
  ]);

  // Filter out sessions where the user was the engineer, not the client
  // This prevents engineers from getting "First Session" when they engineer a session
  const clientSessions = isEngineer && engineerConfig
    ? (sessionsResult.data || []).filter(
        (b: { engineer_name: string | null }) => b.engineer_name !== engineerConfig.name
      )
    : (sessionsResult.data || []);
  const completedSessions = clientSessions.length;
  const engineerSessions = (engineerSessionsResult as { count: number | null }).count || 0;

  const totalProjects = projectsResult.count || 0;
  const completedProjects = completedProjectsResult.count || 0;
  const totalGoals = goalsResult.count || 0;
  const completedGoals = completedGoalsResult.count || 0;
  const metricCount = metricsResult.data?.length || 0;
  const completedTasks = tasksResult.count || 0;
  const profile = profileResult.data;
  const sessionNotesCount = sessionNotesResult.count || 0;
  const beatPurchaseCount = beatPurchasesResult.count || 0;
  const calendarEventCount = calendarEventsResult.count || 0;
  const platformConnectionCount = platformConnectionsResult.count || 0;
  const hasPublicProfile = !!profile?.public_profile_slug;

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

  // Achievement conditions map — artist achievements (session-based ones only count CLIENT sessions)
  const conditions: Record<string, boolean> = {
    // Artist session achievements (excludes sessions where user was the engineer)
    first_session: completedSessions >= 1,
    five_sessions: completedSessions >= 5,
    ten_sessions: completedSessions >= 10,
    twenty_five_sessions: completedSessions >= 25,

    // Engineer-specific achievements (only for engineers)
    ...(isEngineer ? {
      eng_first_session: engineerSessions >= 1,
      eng_five_sessions: engineerSessions >= 5,
      eng_ten_sessions: engineerSessions >= 10,
      eng_twenty_five_sessions: engineerSessions >= 25,
      eng_fifty_sessions: engineerSessions >= 50,
    } : {}),

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
    public_profile: hasPublicProfile,
    first_beat_purchase: beatPurchaseCount >= 1,
    first_session_notes: sessionNotesCount >= 1,
    first_calendar_event: calendarEventCount >= 1,
    connect_platform: platformConnectionCount >= 1,
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
      .eq('user_id', user.id);

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

  // Return progress data so the UI can show "3/5 sessions" etc.
  const progress: Record<string, { current: number; target: number }> = {
    first_session: { current: Math.min(completedSessions, 1), target: 1 },
    five_sessions: { current: Math.min(completedSessions, 5), target: 5 },
    ten_sessions: { current: Math.min(completedSessions, 10), target: 10 },
    twenty_five_sessions: { current: Math.min(completedSessions, 25), target: 25 },
    first_project: { current: Math.min(totalProjects, 1), target: 1 },
    first_release: { current: Math.min(completedProjects, 1), target: 1 },
    five_releases: { current: Math.min(completedProjects, 5), target: 5 },
    ten_releases: { current: Math.min(completedProjects, 10), target: 10 },
    first_metric_log: { current: Math.min(metricCount, 1), target: 1 },
    four_week_streak: { current: Math.min(metricWeeksStreak, 4), target: 4 },
    twelve_week_streak: { current: Math.min(metricWeeksStreak, 12), target: 12 },
    first_goal_set: { current: Math.min(totalGoals, 1), target: 1 },
    first_goal_completed: { current: Math.min(completedGoals, 1), target: 1 },
    five_goals_completed: { current: Math.min(completedGoals, 5), target: 5 },
    first_beat_purchase: { current: Math.min(beatPurchaseCount, 1), target: 1 },
    first_calendar_event: { current: Math.min(calendarEventCount, 1), target: 1 },
    connect_platform: { current: Math.min(platformConnectionCount, 1), target: 1 },
    level_5: { current: Math.min(artistLevel, 5), target: 5 },
    level_10: { current: Math.min(artistLevel, 10), target: 10 },
    level_25: { current: Math.min(artistLevel, 25), target: 25 },
    level_50: { current: Math.min(artistLevel, 50), target: 50 },
    seven_day_streak: { current: Math.min(dailyStreak, 7), target: 7 },
    thirty_day_streak: { current: Math.min(dailyStreak, 30), target: 30 },
    hundred_tasks: { current: Math.min(completedTasks, 100), target: 100 },
    ...(isEngineer ? {
      eng_first_session: { current: Math.min(engineerSessions, 1), target: 1 },
      eng_five_sessions: { current: Math.min(engineerSessions, 5), target: 5 },
      eng_ten_sessions: { current: Math.min(engineerSessions, 10), target: 10 },
      eng_twenty_five_sessions: { current: Math.min(engineerSessions, 25), target: 25 },
      eng_fifty_sessions: { current: Math.min(engineerSessions, 50), target: 50 },
    } : {}),
  };

  return NextResponse.json({ newAchievements, totalXpAwarded, progress });
}
