import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { getPendingInvitesForEmail } from '@/lib/bands-server';
import DashboardNav from '@/components/layout/DashboardNav';
import ArtistHub from '@/components/hub/ArtistHub';
import PendingInvitesBanner from '@/components/bands/PendingInvitesBanner';

export const metadata: Metadata = { title: 'Artist Hub' };

/**
 * Artist Hub landing. We fetch pending band invites server-side here so the
 * yellow banner renders instantly on load — no client waterfall, no hydration
 * flash. The banner hides itself when the list is empty, so adding it costs
 * nothing when there are no pending invites.
 */
export default async function ArtistHubPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const pendingInvites = await getPendingInvitesForEmail(user.email);

  return (
    <>
      <DashboardNav
        role={user.role}
        isProducer={user.is_producer}
        displayName={user.profile?.display_name}
        email={user.email}
        profileSlug={user.profile?.public_profile_slug}
      />
      <PendingInvitesBanner invites={pendingInvites} />
      <ArtistHub userId={user.id} />
    </>
  );
}
