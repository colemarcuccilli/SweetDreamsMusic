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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function verifyAdminAccess(supabase: any): Promise<boolean> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return false;
  return isAdmin(user.email);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function verifyEngineerAccess(supabase: any): Promise<boolean> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return false;
  if (isAdmin(user.email)) return true;
  if (!user.id) return false;
  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single();
  return profile?.role === 'engineer';
}
