import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Music, FileAudio, Download } from 'lucide-react';
import { getSessionUser } from '@/lib/auth';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { formatCents } from '@/lib/utils';
import DashboardNav from '@/components/layout/DashboardNav';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const supabase = await createClient();

  // Fetch user's bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, start_time, end_time, duration, total_amount, status, created_at')
    .eq('customer_email', user.email)
    .order('created_at', { ascending: false })
    .limit(10);

  // Fetch user's deliverables (files from engineers)
  const { data: deliverables } = await supabase
    .from('deliverables')
    .select('id, file_name, display_name, file_path, file_type, file_size, uploaded_by_name, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Generate signed download URLs using service client (bypasses storage RLS)
  const serviceClient = createServiceClient();
  const filesWithUrls = await Promise.all(
    (deliverables || []).map(async (file) => {
      if (file.file_path) {
        const { data } = await serviceClient.storage
          .from('client-audio-files')
          .createSignedUrl(file.file_path, 3600); // 1 hour
        return { ...file, downloadUrl: data?.signedUrl || null };
      }
      return { ...file, downloadUrl: null };
    })
  );

  return (
    <>
      <DashboardNav
        role={user.role}
        displayName={user.profile?.display_name}
        email={user.email}
        profileSlug={user.profile?.public_profile_slug}
      />

      {/* Quick Actions */}
      <section className="bg-white text-black py-8 border-b-2 border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/book"
              className="bg-accent text-black font-mono text-sm font-bold uppercase tracking-wider px-5 py-3 hover:bg-accent/90 transition-colors no-underline inline-flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Book a Session
            </Link>
            <Link
              href="/beats"
              className="border-2 border-black text-black font-mono text-sm font-bold uppercase tracking-wider px-5 py-3 hover:bg-black hover:text-white transition-colors no-underline inline-flex items-center gap-2"
            >
              <Music className="w-4 h-4" />
              Browse Beats
            </Link>
          </div>
        </div>
      </section>

      {/* Content Grid */}
      <section className="bg-white text-black py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">

            {/* Bookings */}
            <div>
              <h2 className="text-heading-md mb-6 flex items-center gap-3">
                <Calendar className="w-6 h-6 text-accent" />
                YOUR SESSIONS
              </h2>

              {(!bookings || bookings.length === 0) ? (
                <div className="border-2 border-black/10 p-8 text-center">
                  <p className="font-mono text-sm text-black/50 mb-4">No sessions yet</p>
                  <Link
                    href="/book"
                    className="font-mono text-sm font-bold text-accent hover:underline"
                  >
                    Book your first session
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="border-2 border-black/10 p-4 sm:p-5 hover:border-black/30 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-mono text-sm font-semibold">
                            {new Date(booking.start_time).toLocaleDateString('en-US', {
                              weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC'
                            })}
                          </p>
                          <p className="font-mono text-xs text-black/50 mt-1">
                            {booking.duration} hour{booking.duration > 1 ? 's' : ''} — {formatCents(booking.total_amount)}
                          </p>
                        </div>
                        <span className={`font-mono text-xs font-bold uppercase tracking-wider px-2 py-1 ${
                          booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                          booking.status === 'confirmed' ? 'bg-accent/20 text-accent' :
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                          'bg-black/5 text-black/50'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Files / Deliverables */}
            <div>
              <h2 className="text-heading-md mb-6 flex items-center gap-3">
                <FileAudio className="w-6 h-6 text-accent" />
                YOUR FILES
              </h2>

              {filesWithUrls.length === 0 ? (
                <div className="border-2 border-black/10 p-8 text-center">
                  <p className="font-mono text-sm text-black/50">
                    No files yet. Files from your sessions will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filesWithUrls.map((file) => (
                    <div key={file.id} className="border-2 border-black/10 p-4 sm:p-5 hover:border-black/30 transition-colors">
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-sm font-semibold truncate">
                            {file.display_name || file.file_name}
                          </p>
                          <p className="font-mono text-xs text-black/50 mt-1">
                            by {file.uploaded_by_name} — {new Date(file.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-mono text-xs text-black/40 uppercase">
                            {file.file_type?.split('/')[1] || 'file'}
                          </span>
                          {file.downloadUrl && (
                            <a
                              href={file.downloadUrl}
                              download={file.file_name}
                              className="bg-black text-white p-2 hover:bg-black/80 transition-colors"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
