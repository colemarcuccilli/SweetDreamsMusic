import { NextRequest, NextResponse } from 'next/server';

// TODO: Configure when Resend is set up
// import { Resend } from 'resend';
// const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
    }

    // TODO: Validate Turnstile token when configured
    // TODO: Send email via Resend when configured
    // await resend.emails.send({
    //   from: 'Sweet Dreams Music <noreply@sweetdreamsmusic.com>',
    //   to: 'info@sweetdreamsmusic.com',
    //   subject: `New Contact: ${name}`,
    //   html: `
    //     <h2>New Contact Form Submission</h2>
    //     <p><strong>Name:</strong> ${name}</p>
    //     <p><strong>Email:</strong> ${email}</p>
    //     <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
    //     <p><strong>Message:</strong></p>
    //     <p>${message}</p>
    //   `,
    // });

    console.log('Contact form submission:', { name, email, phone, message });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
