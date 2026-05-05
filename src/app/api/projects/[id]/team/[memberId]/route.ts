import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id, memberId } = await params;

    // Get team member data before deleting
    const memberDoc = await adminDb
      .collection('projects')
      .doc(id)
      .collection('teamMembers')
      .doc(memberId)
      .get();

    if (!memberDoc.exists) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    const memberData = memberDoc.data();
    const userId = memberData?.userId;

    // Delete team member
    await adminDb
      .collection('projects')
      .doc(id)
      .collection('teamMembers')
      .doc(memberId)
      .delete();

    // Remove project from user's projectIds array
    if (userId) {
      const userRef = adminDb.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        const projectIds = userData?.projectIds || [];
        
        await userRef.update({
          projectIds: projectIds.filter((pid: string) => pid !== id),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to remove team member:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove team member' },
      { status: 500 }
    );
  }
}
