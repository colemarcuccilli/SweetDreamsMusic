import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateLevel, XP_ACTIONS, XpAction } from '@/lib/xp-system';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  // Fetch profile data
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('total_xp, artist_level, daily_streak, last_hub_visit, longest_streak')
    .eq('id', user.id)
    .single();

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  let totalXp = profile.total_xp || 0;
  let dailyStreak = profile.daily_streak || 0;
  let longestStreak = profile.longest_streak || 0;
  const lastVisit = profile.last_hub_visit;

  const today = new Date().toISOString().split('T')[0];
  let visitXpAwarded = 0;
  let streakXpAwarded = 0;

  // Daily visit tracking
  if (lastVisit !== today) {
    // Award hub_visit XP
    visitXpAwarded = XP_ACTIONS.hub_visit.xp;

    if (lastVisit) {
      const lastDate = new Date(lastVisit);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day - increment streak
        dailyStreak += 1;
        if (dailyStreak > longestStreak) {
          longestStreak = dailyStreak;
        }
      } else {
        // Streak broken - reset to 1
        dailyStreak = 1;
      }
    } else {
      // First ever visit
      dailyStreak = 1;
    }

    // Award streak bonus XP
    if (dailyStreak > 0) {
      streakXpAwarded = 5 * Math.min(dailyStreak, 10);
    }

    totalXp += visitXpAwarded + streakXpAwarded;
    const levelInfo = calculateLevel(totalXp);

    // Update profile
    await supabase
      .from('profiles')
      .update({
        total_xp: totalXp,
        artist_level: levelInfo.level,
        daily_streak: dailyStreak,
        longest_streak: longestStreak,
        last_hub_visit: today,
      })
      .eq('id', user.id);

    // Insert xp_log entries
    const logEntries: { user_id: string; action: string; xp_amount: number; label: string; metadata: Record<string, unknown> }[] = [
      {
        user_id: user.id,
        action: 'hub_visit',
        xp_amount: visitXpAwarded,
        label: XP_ACTIONS.hub_visit.label,
        metadata: {},
      },
    ];

    if (streakXpAwarded > 0) {
      logEntries.push({
        user_id: user.id,
        action: 'daily_streak',
        xp_amount: streakXpAwarded,
        label: XP_ACTIONS.daily_streak.label,
        metadata: { streak: dailyStreak },
      });
    }

    await supabase.from('xp_log').insert(logEntries);
  }

  // Fetch recent XP history
  const { data: xpHistory } = await supabase
    .from('xp_log')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  const levelInfo = calculateLevel(totalXp);

  return NextResponse.json({
    totalXp,
    level: levelInfo.level,
    currentLevelXp: levelInfo.currentLevelXp,
    nextLevelXp: levelInfo.nextLevelXp,
    progress: levelInfo.progress,
    dailyStreak,
    longestStreak,
    lastHubVisit: today,
    visitXpAwarded,
    streakXpAwarded,
    xpHistory: (xpHistory || []).map((h) => ({
      ...h,
      label: (XP_ACTIONS[h.action as XpAction]?.label) || h.action.replace(/_/g, ' '),
    })),
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const { action, metadata } = body;

  if (!action || !(action in XP_ACTIONS)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const xpAction = XP_ACTIONS[action as XpAction];

  // Check once_per_day restriction
  if ('once_per_day' in xpAction && xpAction.once_per_day) {
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('xp_log')
      .select('id')
      .eq('user_id', user.id)
      .eq('action', action)
      .gte('created_at', today + 'T00:00:00.000Z')
      .lte('created_at', today + 'T23:59:59.999Z')
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Already awarded today', alreadyAwarded: true }, { status: 409 });
    }
  }

  const xpAmount = xpAction.xp;

  // Insert xp_log entry
  const { error: logError } = await supabase.from('xp_log').insert({
    user_id: user.id,
    action,
    xp_amount: xpAmount,
    label: xpAction.label,
    metadata: metadata || {},
  });

  if (logError) return NextResponse.json({ error: logError.message }, { status: 500 });

  // Get current total and update
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_xp')
    .eq('id', user.id)
    .single();

  const newTotal = (profile?.total_xp || 0) + xpAmount;
  const levelInfo = calculateLevel(newTotal);

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      total_xp: newTotal,
      artist_level: levelInfo.level,
    })
    .eq('id', user.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({
    xpAwarded: xpAmount,
    totalXp: newTotal,
    level: levelInfo.level,
    currentLevelXp: levelInfo.currentLevelXp,
    nextLevelXp: levelInfo.nextLevelXp,
    progress: levelInfo.progress,
  });
}
