import { createClient } from '@/lib/supabase/server';
import { getUserRole } from '@/lib/utils';
import { SUPER_ADMINS, type UserRole } from '@/lib/constants';

export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
  profile: {
    id: string;
    display_name: string;
    public_profile_slug: string;
    profile_picture_url: string | null;
  } | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) return null;

  // Fetch profile including role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, display_name, public_profile_slug, profile_picture_url, role')
    .eq('user_id', user.id)
    .single();

  if (profileError) {
    console.error('[AUTH] Profile fetch error for', user.email, ':', JSON.stringify(profileError));
  }

  const role = getUserRole(user.email, profile?.role);

  return {
    id: user.id,
    email: user.email,
    role,
    profile,
  };
}

export function isAdmin(email: string): boolean {
  return SUPER_ADMINS.includes(email.toLowerCase() as typeof SUPER_ADMINS[number]);
}

export { getUserRole };
