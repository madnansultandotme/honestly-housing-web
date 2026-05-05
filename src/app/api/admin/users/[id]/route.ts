import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const userDoc = await adminDb.collection('users').doc(id).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      uid: userDoc.id,
      ...userDoc.data(),
    });
  } catch (error: any) {
    console.error('Failed to get user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get user' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate and sanitize update data
    const allowedFields = ['displayName', 'role', 'email'];
    const updateData: any = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'email') {
          updateData[field] = body[field].toLowerCase().trim();
        } else {
          updateData[field] = body[field];
        }
      }
    }

    updateData.updatedAt = new Date().toISOString();

    await adminDb.collection('users').doc(id).update(updateData);

    // If email is being updated, also update in Firebase Auth
    if (updateData.email) {
      try {
        await adminAuth.updateUser(id, {
          email: updateData.email,
        });
      } catch (authError) {
        console.error('Failed to update auth email:', authError);
        // Continue even if auth update fails
      }
    }

    const updatedDoc = await adminDb.collection('users').doc(id).get();

    return NextResponse.json({
      uid: updatedDoc.id,
      ...updatedDoc.data(),
    });
  } catch (error: any) {
    console.error('Failed to update user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete user from Firestore
    await adminDb.collection('users').doc(id).delete();

    // Delete user from Firebase Auth
    try {
      await adminAuth.deleteUser(id);
    } catch (authError) {
      console.error('Failed to delete from auth:', authError);
      // Continue even if auth deletion fails
    }

    // Remove user from all project team members
    const projectsSnapshot = await adminDb.collection('projects').get();
    
    for (const projectDoc of projectsSnapshot.docs) {
      const teamMembersSnapshot = await adminDb
        .collection('projects')
        .doc(projectDoc.id)
        .collection('teamMembers')
        .where('userId', '==', id)
        .get();

      for (const memberDoc of teamMembersSnapshot.docs) {
        await memberDoc.ref.delete();
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}
