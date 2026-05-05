import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get team members from subcollection
    const teamSnapshot = await adminDb
      .collection('projects')
      .doc(id)
      .collection('teamMembers')
      .orderBy('addedAt', 'desc')
      .get();

    const teamMembers = teamSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ teamMembers });
  } catch (error: any) {
    console.error('Failed to get team members:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get team members' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, email, displayName, role } = body;

    if (!userId || !email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate role (cannot add admin)
    if (role === 'admin') {
      return NextResponse.json(
        { error: 'Cannot add admin users to projects' },
        { status: 400 }
      );
    }

    // Check if user is already a team member
    const existingMember = await adminDb
      .collection('projects')
      .doc(id)
      .collection('teamMembers')
      .where('userId', '==', userId)
      .get();

    if (!existingMember.empty) {
      return NextResponse.json(
        { error: 'User is already a team member' },
        { status: 400 }
      );
    }

    // Add team member
    const teamMemberRef = await adminDb
      .collection('projects')
      .doc(id)
      .collection('teamMembers')
      .add({
        userId,
        email,
        displayName: displayName || email.split('@')[0],
        role,
        addedAt: new Date().toISOString(),
        addedBy: request.headers.get('x-user-id') || 'unknown',
      });

    // Update user's projectIds array
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      const projectIds = userData?.projectIds || [];
      
      if (!projectIds.includes(id)) {
        await userRef.update({
          projectIds: [...projectIds, id],
        });
      }
    }

    const teamMember = {
      id: teamMemberRef.id,
      userId,
      email,
      displayName: displayName || email.split('@')[0],
      role,
      addedAt: new Date().toISOString(),
    };

    return NextResponse.json({ teamMember }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to add team member:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add team member' },
      { status: 500 }
    );
  }
}
