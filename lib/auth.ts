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

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, public_profile_slug, profile_picture_url')
    .eq('user_id', user.id)
    .single();

  // Check if user is an engineer (check admin_users table or a role field)
  // For now, we determine role from email + a future role column
  const role = getUserRole(user.email);

  return {
    id: user.id,
    email: user.email,
    role,
    profile,
  };
}

export function isAdmin(email: string): boolean {
  return SUPER_ADMINS.includes(email as typeof SUPER_ADMINS[number]);
}

export { getUserRole };
