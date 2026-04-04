import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  const results: Record<string, unknown> = {};

  // Test 1: Auth check (who is logged in?)
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    results.auth = error ? { error: error.message } : { ok: true, user_id: user?.id, email: user?.email };

    // Test 2: If logged in, fetch their profile with the user's own auth
    if (user) {
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('id, display_name, role, email, public_profile_slug')
        .eq('user_id', user.id)
        .single();
      results.user_profile = profileErr
        ? { error: profileErr.message, code: profileErr.code, details: profileErr.details, hint: profileErr.hint }
        : { ok: true, profile };
    }
  } catch (e: unknown) {
    results.auth = { exception: e instanceof Error ? e.message : String(e) };
  }

  // Test 3: Service role — check PRVRB profile specifically
  try {
    const service = createServiceClient();
    const { data, error } = await service
      .from('profiles')
      .select('id, user_id, display_name, role, email, public_profile_slug')
      .eq('email', 'prvrbsounds@gmail.com')
      .single();
    results.prvrb_profile = error
      ? { error: error.message, code: error.code, details: error.details }
      : { ok: true, data };
  } catch (e: unknown) {
    results.prvrb_profile = { exception: e instanceof Error ? e.message : String(e) };
  }

  // Test 4: Check PRVRB auth.users entry
  try {
    const service = createServiceClient();
    const { data, error } = await service.auth.admin.getUserById('909fd43a-f6a4-4b41-8d1d-ae9b950f2efb');
    results.prvrb_auth = error
      ? { error: error.message }
      : { ok: true, id: data.user.id, email: data.user.email, identities: data.user.identities?.length };
  } catch (e: unknown) {
    results.prvrb_auth = { exception: e instanceof Error ? e.message : String(e) };
  }

  return NextResponse.json(results, { status: 200 });
}
