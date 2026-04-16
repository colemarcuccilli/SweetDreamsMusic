import { NextRequest, NextResponse } from 'next/server';
import { sendContactForm } from '@/lib/email';

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY;

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, message, turnstileToken } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
    }

    // Verify Cloudflare Turnstile token
    if (!turnstileToken) {
      return NextResponse.json({ error: 'Verification required' }, { status: 400 });
    }

    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: TURNSTILE_SECRET,
        response: turnstileToken,
      }),
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.success) {
      console.error('Turnstile verification failed:', verifyData);
      return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
    }

    await sendContactForm({
      name,
      email,
      subject: phone ? `${name} (${phone})` : name,
      message,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
