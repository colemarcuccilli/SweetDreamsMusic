import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Music, ExternalLink, Settings } from 'lucide-react';
import { createServiceClient, createClient } from '@/lib/supabase/server';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createServiceClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, bio')
    .eq('public_profile_slug', slug)
    .single();

  if (!profile) return { title: 'Profile Not Found' };

  return {
    title: `${profile.display_name}`,
    description: profile.bio || `${profile.display_name} on Sweet Dreams Music`,
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { slug } = await params;
  const supabase = createServiceClient();

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('public_profile_slug', slug)
    .single();

  if (!profile) notFound();

  // Check if this is the profile owner viewing their own page
  const authClient = await createClient();
  const { data: { user: currentUser } } = await authClient.auth.getUser();
  const isOwner = currentUser?.id === profile.user_id;

  // Fetch public audio showcase
  const { data: showcaseItems } = await supabase
    .from('profile_audio_showcase')
    .select(`
      id, custom_title, custom_description, display_order, is_public, is_released,
      spotify_link, apple_music_link, youtube_link, soundcloud_link, custom_links,
      deliverable_id
    `)
    .eq('user_id', profile.user_id)
    .eq('is_public', true)
    .order('display_order', { ascending: true });

  // Fetch deliverable details for showcase items
  let deliverables: Record<string, { file_name: string; display_name: string; file_path: string }> = {};
  if (showcaseItems && showcaseItems.length > 0) {
    const deliverableIds = showcaseItems.map((item) => item.deliverable_id);
    const { data: deliverableData } = await supabase
      .from('deliverables')
      .select('id, file_name, display_name, file_path')
      .in('id', deliverableIds);

    if (deliverableData) {
      deliverables = Object.fromEntries(deliverableData.map((d) => [d.id, d]));
    }
  }

  // Fetch public projects
  const { data: projects } = await supabase
    .from('profile_projects')
    .select('*')
    .eq('user_id', profile.user_id)
    .eq('is_public', true)
    .order('display_order', { ascending: true });

  const hasShowcase = showcaseItems && showcaseItems.length > 0;
  const hasProjects = projects && projects.length > 0;
  const hasSocialLinks = profile.social_links && Object.values(profile.social_links as Record<string, string>).some(Boolean);
  const isEmpty = !hasShowcase && !hasProjects && !profile.bio;

  return (
    <>
      {/* Profile Header */}
      <section className="bg-black text-white py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            {/* Profile Picture */}
            <div className="w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 bg-white/5 flex items-center justify-center overflow-hidden">
              {profile.profile_picture_url ? (
                <img
                  src={profile.profile_picture_url}
                  alt={profile.display_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-heading text-5xl text-white/10">
                  {profile.display_name?.[0]?.toUpperCase() || '?'}
                </span>
              )}
            </div>

            <div className="text-center sm:text-left flex-1">
              <h1 className="text-display-sm mb-3">{profile.display_name}</h1>
              {profile.bio && (
                <p className="font-mono text-white/60 text-body-sm max-w-lg">{profile.bio}</p>
              )}
              {hasSocialLinks && (
                <div className="flex flex-wrap gap-3 mt-4 justify-center sm:justify-start">
                  {Object.entries(profile.social_links as Record<string, string>).map(([platform, url]) => (
                    url && (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-accent hover:text-white transition-colors uppercase tracking-wider inline-flex items-center gap-1"
                      >
                        {platform} <ExternalLink className="w-3 h-3" />
                      </a>
                    )
                  ))}
                </div>
              )}
              {isOwner && (
                <Link
                  href="/dashboard/profile"
                  className="inline-flex items-center gap-2 mt-6 border border-white/20 text-white/60 font-mono text-xs font-bold uppercase tracking-wider px-4 py-2 hover:border-accent hover:text-accent transition-colors no-underline"
                >
                  <Settings className="w-3 h-3" /> Edit Profile
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Owner empty state */}
      {isOwner && isEmpty && (
        <section className="bg-white text-black py-16 sm:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="font-mono text-sm text-black/40 mb-2">Your profile is looking empty.</p>
            <p className="font-mono text-xs text-black/30 max-w-md mx-auto">
              Add a bio, upload a profile photo, and showcase your music from your sessions.
              Once your engineers upload session files, you can select tracks to feature here.
            </p>
            <Link
              href="/dashboard/profile"
              className="inline-block mt-6 bg-accent text-black font-mono text-sm font-bold uppercase tracking-wider px-6 py-3 hover:bg-accent/90 transition-colors no-underline"
            >
              Set Up Your Profile
            </Link>
          </div>
        </section>
      )}

      {/* Music Showcase */}
      {hasShowcase && (
        <section className="bg-white text-black py-16 sm:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-heading-xl mb-8">MUSIC</h2>
            <div className="space-y-4">
              {showcaseItems.map((item) => {
                const deliverable = deliverables[item.deliverable_id];
                const title = item.custom_title || deliverable?.display_name || deliverable?.file_name || 'Untitled';

                return (
                  <div key={item.id} className="border-2 border-black p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                    <Music className="w-8 h-8 text-accent flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-mono text-sm font-bold">{title}</h3>
                      {item.custom_description && (
                        <p className="font-mono text-xs text-black/50 mt-1">{item.custom_description}</p>
                      )}
                    </div>

                    {/* Streaming Links */}
                    <div className="flex flex-wrap gap-2">
                      {item.spotify_link && (
                        <a href={item.spotify_link} target="_blank" rel="noopener noreferrer"
                          className="font-mono text-xs border border-black/20 px-3 py-1 hover:border-accent transition-colors no-underline">
                          Spotify
                        </a>
                      )}
                      {item.apple_music_link && (
                        <a href={item.apple_music_link} target="_blank" rel="noopener noreferrer"
                          className="font-mono text-xs border border-black/20 px-3 py-1 hover:border-accent transition-colors no-underline">
                          Apple Music
                        </a>
                      )}
                      {item.youtube_link && (
                        <a href={item.youtube_link} target="_blank" rel="noopener noreferrer"
                          className="font-mono text-xs border border-black/20 px-3 py-1 hover:border-accent transition-colors no-underline">
                          YouTube
                        </a>
                      )}
                      {item.soundcloud_link && (
                        <a href={item.soundcloud_link} target="_blank" rel="noopener noreferrer"
                          className="font-mono text-xs border border-black/20 px-3 py-1 hover:border-accent transition-colors no-underline">
                          SoundCloud
                        </a>
                      )}
                    </div>

                    {/* Audio player for unreleased tracks */}
                    {deliverable?.file_path && !item.is_released && (
                      <audio controls preload="none" className="w-full sm:w-auto sm:max-w-[200px]">
                        <source
                          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile-audio/${deliverable.file_path}`}
                          type="audio/mpeg"
                        />
                      </audio>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Projects */}
      {hasProjects && (
        <section className="bg-black text-white py-16 sm:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-heading-xl mb-8">PROJECTS</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {projects.map((project) => (
                <div key={project.id} className="border border-white/10 p-6 hover:border-accent/50 transition-colors">
                  {project.cover_image_url && (
                    <img src={project.cover_image_url} alt={project.project_name} className="w-full aspect-square object-cover mb-4" />
                  )}
                  <h3 className="text-heading-sm mb-1">{project.project_name}</h3>
                  {project.project_type && (
                    <p className="font-mono text-xs text-accent uppercase tracking-wider mb-2">{project.project_type}</p>
                  )}
                  {project.description && (
                    <p className="font-mono text-xs text-white/50">{project.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer CTA — only show for visitors, not the profile owner */}
      {!isOwner && (
        <section className="bg-white text-black py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="font-mono text-sm text-black/50 mb-4">
              Want your own profile?
            </p>
            <Link href="/login"
              className="font-mono text-sm font-bold text-accent hover:underline">
              Create an account at Sweet Dreams Music
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
