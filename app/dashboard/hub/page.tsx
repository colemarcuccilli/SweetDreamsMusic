import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import DashboardNav from '@/components/layout/DashboardNav';
import ArtistHub from '@/components/hub/ArtistHub';

export const metadata: Metadata = { title: 'Artist Hub' };

export default async function ArtistHubPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  return (
    <>
      <DashboardNav
        role={user.role}
        isProducer={user.is_producer}
        displayName={user.profile?.display_name}
        email={user.email}
        profileSlug={user.profile?.public_profile_slug}
      />
      <ArtistHub userId={user.id} />
    </>
  );
}
