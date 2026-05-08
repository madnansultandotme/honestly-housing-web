import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete all subcollections
    const subcollections = [
      'selections',
      'items',
      'categories',
      'rooms',
      'photos',
      'messages',
      'teamMembers',
      'invitations',
      'changeRequests',
      'changeOrders',
    ];

    for (const subcollection of subcollections) {
      const snapshot = await adminDb
        .collection('projects')
        .doc(id)
        .collection(subcollection)
        .get();

      const batch = adminDb.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    // Delete the project document
    await adminDb.collection('projects').doc(id).delete();

    // Delete all notifications related to this project
    const notificationsSnapshot = await adminDb
      .collection('notifications')
      .where('projectId', '==', id)
      .get();

    const notificationsBatch = adminDb.batch();
    notificationsSnapshot.docs.forEach((doc) => {
      notificationsBatch.delete(doc.ref);
    });
    await notificationsBatch.commit();

    // Remove project from all users' projectIds
    const usersSnapshot = await adminDb
      .collection('users')
      .where('projectIds', 'array-contains', id)
      .get();

    const userBatch = adminDb.batch();
    usersSnapshot.docs.forEach((doc) => {
      const projectIds = doc.data().projectIds || [];
      userBatch.update(doc.ref, {
        projectIds: projectIds.filter((pid: string) => pid !== id),
      });
    });
    await userBatch.commit();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete project:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete project' },
      { status: 500 }
    );
  }
}
