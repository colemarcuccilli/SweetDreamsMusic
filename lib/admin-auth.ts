import { SUPER_ADMINS } from './constants';

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return SUPER_ADMINS.includes(email.toLowerCase() as typeof SUPER_ADMINS[number]);
}

export function isEngineerOrAdmin(email: string | null | undefined, profileRole?: string): boolean {
  if (!email) return false;
  if (isAdmin(email)) return true;
  return profileRole === 'engineer';
}

export async function verifyAdminAccess(supabase: { auth: { getUser: () => Promise<{ data: { user: { email?: string } | null }; error: unknown }> } }): Promise<boolean> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return false;
  return isAdmin(user.email);
}

export async function verifyEngineerAccess(supabase: { auth: { getUser: () => Promise<{ data: { user: { email?: string } | null }; error: unknown }> } }): Promise<boolean> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return false;
  return isAdmin(user.email) || true; // TODO: check engineer role from profiles table
}
