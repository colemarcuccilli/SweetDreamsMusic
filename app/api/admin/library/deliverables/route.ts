import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyEngineerAccess } from '@/lib/admin-auth';
import { sendSessionFilesDelivered } from '@/lib/email';

// GET - fetch deliverables for a user
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const hasAccess = await verifyEngineerAccess(supabase);
  if (!hasAccess) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = new URL(request.url).searchParams.get('user_id');
  if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

  const { data, error } = await supabase
    .from('deliverables')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deliverables: data });
}

// POST - upload a deliverable for a user
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const hasAccess = await verifyEngineerAccess(supabase);
  if (!hasAccess) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: { user } } = await supabase.auth.getUser();

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const userId = formData.get('user_id') as string;
  const displayName = formData.get('display_name') as string;
  const description = formData.get('description') as string;

  if (!file || !userId) {
    return NextResponse.json({ error: 'file and user_id required' }, { status: 400 });
  }

  // Upload to Supabase Storage
  const timestamp = Date.now();
  const filePath = `${userId}/${timestamp}_${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from('client-audio-files')
    .upload(filePath, file);

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Get engineer's profile for the name
  const { data: engineerProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('user_id', user?.id)
    .single();

  // Create deliverable record
  const { data: deliverable, error: dbError } = await supabase
    .from('deliverables')
    .insert({
      user_id: userId,
      file_name: file.name,
      display_name: displayName || file.name,
      file_path: filePath,
      file_size: file.size,
      file_type: file.type,
      uploaded_by: user?.id,
      uploaded_by_name: engineerProfile?.display_name || user?.email || 'Engineer',
      description: description || null,
    })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  // Send thank-you email if sendEmail flag is set (from session completion flow)
  const sendEmail = formData.get('send_email') as string;
  const bookingRoom = formData.get('booking_room') as string;
  const bookingDate = formData.get('booking_date') as string;
  const customerName = formData.get('customer_name') as string;
  const engineerDisplayName = engineerProfile?.display_name || user?.email || 'Your Engineer';

  if (sendEmail === 'true') {
    // Get client's email
    const { data: clientProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('user_id', userId)
      .single();

    // Also check auth.users if profile email is empty
    let clientEmail = clientProfile?.email;
    if (!clientEmail) {
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      clientEmail = authUser?.user?.email;
    }

    if (clientEmail) {
      // Count total files for this client
      const { count } = await supabase
        .from('deliverables')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      await sendSessionFilesDelivered(clientEmail, {
        customerName: customerName || 'there',
        engineerName: engineerDisplayName,
        fileCount: count || 1,
        date: bookingDate || new Date().toLocaleDateString(),
        room: bookingRoom || '',
      });
    }
  }

  return NextResponse.json({ deliverable });
}

// DELETE - remove a deliverable
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const hasAccess = await verifyEngineerAccess(supabase);
  if (!hasAccess) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  // Get file path first
  const { data: deliverable } = await supabase
    .from('deliverables')
    .select('file_path')
    .eq('id', id)
    .single();

  if (deliverable?.file_path) {
    await supabase.storage.from('client-audio-files').remove([deliverable.file_path]);
  }

  const { error } = await supabase.from('deliverables').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
