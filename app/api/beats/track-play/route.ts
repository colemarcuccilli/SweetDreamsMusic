import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// POST — increment play count for a beat preview
export async function POST(request: NextRequest) {
  try {
    const { beatId } = await request.json();
    if (!beatId) return NextResponse.json({ error: 'beatId required' }, { status: 400 });

    const supabase = createServiceClient();

    // Atomic increment
    await supabase.rpc('increment_play_count', { p_beat_id: beatId });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to track play' }, { status: 500 });
  }
}
