import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmailWithCredentials } from '@/lib/email/resend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, displayName, projectName, builderName, email, password, loginUrl } = body;

    if (!to || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await sendWelcomeEmailWithCredentials({
      to,
      displayName: displayName || 'Client',
      projectName: projectName || 'Your Project',
      builderName: builderName || 'Your Builder',
      email,
      password,
      loginUrl: loginUrl || 'https://honestlyhousing.com/login',
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Welcome email sent successfully',
    });
  } catch (error: any) {
    console.error('Send welcome email error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send welcome email' },
      { status: 500 }
    );
  }
}
