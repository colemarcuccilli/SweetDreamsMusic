import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  const service = createServiceClient();
  const results: Record<string, unknown> = {};

  // Fix PRVRB: Delete broken record, recreate via Admin API
  try {
    // First delete the broken user (cascades to identities and profile)
    const { error: deleteError } = await service.auth.admin.deleteUser('909fd43a-f6a4-4b41-8d1d-ae9b950f2efb');
    results.prvrb_delete = deleteError ? { error: deleteError.message } : { ok: true };

    // Recreate via Admin API (this sets up everything correctly)
    const { data: newUser, error: createError } = await service.auth.admin.createUser({
      email: 'prvrbsounds@gmail.com',
      password: 'SweetDreamsFortWayne2020',
      email_confirm: true,
      user_metadata: { display_name: 'PRVRB' },
    });
    results.prvrb_create = createError
      ? { error: createError.message }
      : { ok: true, id: newUser.user.id, email: newUser.user.email };

    // Set engineer role on their new profile
    if (newUser?.user) {
      const { error: roleError } = await service
        .from('profiles')
        .update({ role: 'engineer', email: 'prvrbsounds@gmail.com', display_name: 'PRVRB' })
        .eq('user_id', newUser.user.id);
      results.prvrb_role = roleError ? { error: roleError.message } : { ok: true };
    }
  } catch (e: unknown) {
    results.prvrb = { exception: e instanceof Error ? e.message : String(e) };
  }

  // Fix Iszac: Same process
  try {
    // Find Iszac's user ID first
    const { data: iszacUsers } = await service
      .from('profiles')
      .select('user_id')
      .eq('email', 'iisszzaacc@gmail.com')
      .single();

    if (iszacUsers?.user_id) {
      const { error: deleteError } = await service.auth.admin.deleteUser(iszacUsers.user_id);
      results.iszac_delete = deleteError ? { error: deleteError.message } : { ok: true };
    } else {
      // Try finding in auth.users directly
      const { data: allUsers } = await service.auth.admin.listUsers();
      const iszac = allUsers?.users?.find(u => u.email === 'iisszzaacc@gmail.com');
      if (iszac) {
        const { error: deleteError } = await service.auth.admin.deleteUser(iszac.id);
        results.iszac_delete = deleteError ? { error: deleteError.message } : { ok: true };
      } else {
        results.iszac_delete = { skipped: 'no existing user found' };
      }
    }

    // Recreate via Admin API
    const { data: newIszac, error: createError } = await service.auth.admin.createUser({
      email: 'iisszzaacc@gmail.com',
      password: 'SweetDreamsFortWayne2020',
      email_confirm: true,
      user_metadata: { display_name: 'Iszac' },
    });
    results.iszac_create = createError
      ? { error: createError.message }
      : { ok: true, id: newIszac.user.id, email: newIszac.user.email };

    // Set engineer role
    if (newIszac?.user) {
      const { error: roleError } = await service
        .from('profiles')
        .update({ role: 'engineer', email: 'iisszzaacc@gmail.com', display_name: 'Iszac' })
        .eq('user_id', newIszac.user.id);
      results.iszac_role = roleError ? { error: roleError.message } : { ok: true };
    }
  } catch (e: unknown) {
    results.iszac = { exception: e instanceof Error ? e.message : String(e) };
  }

  return NextResponse.json(results, { status: 200 });
}
