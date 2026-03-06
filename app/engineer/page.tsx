import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import EngineerDashboard from '@/components/engineer/EngineerDashboard';
import DashboardNav from '@/components/layout/DashboardNav';

export const metadata: Metadata = { title: 'Engineer Dashboard' };

export default async function EngineerPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'engineer' && user.role !== 'admin') redirect('/dashboard');

  return (
    <>
      <DashboardNav
        role={user.role}
        displayName={user.profile?.display_name}
        email={user.email}
        profileSlug={user.profile?.public_profile_slug}
      />
      <EngineerDashboard user={user} />
    </>
  );
}
