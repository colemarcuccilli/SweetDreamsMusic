import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminAccess } from '@/lib/admin-auth';

export async function GET() {
  const supabase = await createClient();
  const isAdmin = await verifyAdminAccess(supabase);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch beat license agreements from purchases
  const { data: beatPurchases, error: purchasesError } = await supabase
    .from('beat_purchases')
    .select('id, buyer_email, license_type, amount_paid, license_text, created_at, beats(title, producer)')
    .order('created_at', { ascending: false });

  // Fetch producer agreements
  const { data: producerAgreements, error: agreementsError } = await supabase
    .from('beat_agreements')
    .select('id, producer_name, beat_title, agreement_text, agreed_at, agreement_version, ip_address, status')
    .order('agreed_at', { ascending: false });

  // Fetch private sale agreements
  const { data: privateSales, error: privateSalesError } = await supabase
    .from('private_beat_sales')
    .select('id, buyer_name, buyer_email, beat_title, license_type, amount, agreement_text, signed_at, agreement_ip, status')
    .order('signed_at', { ascending: false });

  // Return whatever succeeded, with empty arrays for tables that may not exist yet
  return NextResponse.json({
    beatPurchases: purchasesError ? [] : (beatPurchases || []),
    producerAgreements: agreementsError ? [] : (producerAgreements || []),
    privateSales: privateSalesError ? [] : (privateSales || []),
  });
}
