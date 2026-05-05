import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { sendInvitationEmail } from '@/lib/email/resend';

// GET invitations for a project
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    let query = adminDb
      .collection('projects')
      .doc(projectId)
      .collection('invitations');

    if (status) {
      query = query.where('status', '==', status) as any;
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const invitations = snapshot.docs.map(doc => ({
      id: doc.id,
      projectId,
      ...doc.data(),
    }));

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('Get invitations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}

// CREATE invitation for a project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, email, projectName, builderName, builderOrgId, invitedBy } = body;

    if (!projectId || !email || !projectName || !builderOrgId || !invitedBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if invitation already exists for this project and email
    const existingSnapshot = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('invitations')
      .where('email', '==', email.toLowerCase())
      .where('status', '==', 'pending')
      .get();

    if (!existingSnapshot.empty) {
      return NextResponse.json(
        { error: 'Invitation already sent to this email for this project' },
        { status: 400 }
      );
    }

    // Generate invitation token
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);

    const invitationData = {
      email: email.toLowerCase(),
      projectName,
      builderName: builderName || 'Builder',
      builderOrgId,
      invitedBy,
      token,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    };

    const invitationRef = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('invitations')
      .add(invitationData);

    // Generate invitation link
    const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/accept-invitation?token=${token}&projectId=${projectId}`;

    // Send email invitation
    const emailResult = await sendInvitationEmail({
      to: email,
      projectName,
      builderName: builderName || 'Builder',
      invitationLink,
    });

    // Create notification for the invited user (if they have an account)
    try {
      const usersSnapshot = await adminDb
        .collection('users')
        .where('email', '==', email.toLowerCase())
        .limit(1)
        .get();

      if (!usersSnapshot.empty) {
        const userId = usersSnapshot.docs[0].id;
        await adminDb.collection('notifications').add({
          userId,
          type: 'invitation',
          title: 'New Project Invitation',
          message: `${builderName} invited you to ${projectName}`,
          projectId,
          invitationId: invitationRef.id,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
      // Don't fail the invitation if notification fails
    }

    return NextResponse.json({
      invitation: {
        id: invitationRef.id,
        projectId,
        ...invitationData,
      },
      invitationLink,
      emailSent: emailResult.success,
      message: emailResult.success 
        ? 'Invitation sent successfully' 
        : 'Invitation created but email failed to send',
    });
  } catch (error) {
    console.error('Create invitation error:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}
