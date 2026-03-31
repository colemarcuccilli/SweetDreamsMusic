import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { verifyAdminAccess } from '@/lib/admin-auth';

// GET - list all payouts
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const isAdmin = await verifyAdminAccess(supabase);
  if (!isAdmin) return NextResponse.json({ error: 'Admins only' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const person = searchParams.get('person');

  const serviceClient = createServiceClient();
  let query = serviceClient.from('payroll_payouts').select('*').order('created_at', { ascending: false });
  if (person) query = query.eq('person_name', person);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ payouts: data });
}

// POST - record a payout
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const isAdmin = await verifyAdminAccess(supabase);
  if (!isAdmin) return NextResponse.json({ error: 'Admins only' }, { status: 401 });

  const { data: { user } } = await supabase.auth.getUser();
  const body = await request.json();
  const { personName, amount, method, note, periodLabel } = body;

  if (!personName || !amount) {
    return NextResponse.json({ error: 'personName and amount required' }, { status: 400 });
  }

  const serviceClient = createServiceClient();
  const { data, error } = await serviceClient
    .from('payroll_payouts')
    .insert({
      person_name: personName,
      amount: Math.round(amount * 100), // dollars to cents
      method: method || 'cash',
      note: note || null,
      period_label: periodLabel || null,
      created_by: user?.email || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ payout: data, success: true });
}
