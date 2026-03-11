import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { verifyEngineerAccess } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const hasAccess = await verifyEngineerAccess(supabase);
  if (!hasAccess) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const email = new URL(request.url).searchParams.get('email');
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

  // Look up user by email in profiles
  const serviceClient = createServiceClient();
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('user_id')
    .eq('email', email)
    .single();

  if (profile?.user_id) {
    return NextResponse.json({ userId: profile.user_id });
  }

  // Fallback: look up by user_id from auth via profile join
  const { data: profiles } = await serviceClient
    .from('profiles')
    .select('user_id, email')
    .not('user_id', 'is', null);

  // Check auth.users for email match
  if (profiles) {
    for (const p of profiles) {
      if (!p.email) {
        // Check if this user's auth email matches
        const { data: authData } = await serviceClient.auth.admin.getUserById(p.user_id);
        if (authData?.user?.email === email) {
          return NextResponse.json({ userId: p.user_id });
        }
      }
    }
  }

  return NextResponse.json({ userId: null });
}
