import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { fetchSpotifyArtist, fetchYouTubeChannel } from '@/lib/platform-fetch';

// Vercel Cron: Auto-fetch metrics from connected platforms
// Runs daily at 6am UTC
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const today = new Date().toISOString().split('T')[0];
  let fetched = 0;
  let errors = 0;

  // Get all active connections that haven't been fetched today
  const { data: connections } = await supabase
    .from('platform_connections')
    .select('*')
    .eq('auto_fetch_enabled', true)
    .in('platform', ['spotify', 'youtube'])
    .or(`last_fetched_at.is.null,last_fetched_at.lt.${today}T00:00:00Z`);

  if (!connections || connections.length === 0) {
    return NextResponse.json({ message: 'No connections to fetch', fetched: 0 });
  }

  for (const conn of connections) {
    try {
      if (conn.platform === 'spotify' && conn.platform_id) {
        const artist = await fetchSpotifyArtist(conn.platform_id);
        if (artist) {
          await supabase.from('artist_metrics').upsert({
            user_id: conn.user_id,
            platform: 'spotify',
            metric_date: today,
            followers: artist.followers,
            popularity_score: artist.popularity_score,
            source: 'spotify_api',
          }, { onConflict: 'user_id,metric_date,platform' });

          await supabase.from('platform_connections').update({
            last_fetched_at: new Date().toISOString(),
            fetch_error: null,
            display_name: artist.name,
            profile_image_url: artist.images?.[0]?.url || conn.profile_image_url,
            metadata: { ...((conn.metadata as Record<string, unknown>) || {}), genres: artist.genres, followers: artist.followers, popularity: artist.popularity_score },
          }).eq('id', conn.id);

          fetched++;
        }
      }

      if (conn.platform === 'youtube' && conn.platform_id) {
        // For YouTube we stored channelId, construct a URL-like input for the fetcher
        const channel = await fetchYouTubeChannel(conn.platform_id);
        if (channel) {
          await supabase.from('artist_metrics').upsert({
            user_id: conn.user_id,
            platform: 'youtube',
            metric_date: today,
            subscribers: channel.subscribers,
            total_views: channel.total_views,
            videos_count: channel.videos_count,
            source: 'youtube_api',
          }, { onConflict: 'user_id,metric_date,platform' });

          await supabase.from('platform_connections').update({
            last_fetched_at: new Date().toISOString(),
            fetch_error: null,
            display_name: channel.name,
            profile_image_url: channel.thumbnail || conn.profile_image_url,
            metadata: { ...((conn.metadata as Record<string, unknown>) || {}), subscribers: channel.subscribers, total_views: channel.total_views, videos_count: channel.videos_count },
          }).eq('id', conn.id);

          fetched++;
        }
      }
    } catch (err) {
      errors++;
      await supabase.from('platform_connections').update({
        fetch_error: err instanceof Error ? err.message : 'Unknown error',
      }).eq('id', conn.id);
    }
  }

  return NextResponse.json({ fetched, errors, total: connections.length });
}
