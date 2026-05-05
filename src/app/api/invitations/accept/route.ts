import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, projectId, userId } = body;

    if (!token || !projectId || !userId) {
      return NextResponse.json(
        { error: 'Token, projectId, and userId are required' },
        { status: 400 }
      );
    }

    // Find invitation by token in project's invitations subcollection
    const invitationsSnapshot = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('invitations')
      .where('token', '==', token)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (invitationsSnapshot.empty) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      );
    }

    const invitationDoc = invitationsSnapshot.docs[0];
    const invitation = invitationDoc.data();

    // Check if expired
    if (new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    // Update project with client
    await adminDb.collection('projects').doc(projectId).update({
      clientId: userId,
      clientEmail: invitation.email,
      updatedAt: new Date().toISOString(),
    });

    // Mark invitation as accepted
    await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('invitations')
      .doc(invitationDoc.id)
      .update({
        status: 'accepted',
        acceptedBy: userId,
        acceptedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

    return NextResponse.json({
      success: true,
      projectId: projectId,
      projectName: invitation.projectName,
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}
