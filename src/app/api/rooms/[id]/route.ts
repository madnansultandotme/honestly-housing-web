import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// DELETE room
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    // Delete all items in this room first
    const itemsSnapshot = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('items')
      .where('roomId', '==', id)
      .get();

    const batch = adminDb.batch();
    itemsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete the room
    const roomRef = adminDb
      .collection('projects')
      .doc(projectId)
      .collection('rooms')
      .doc(id);
    
    batch.delete(roomRef);
    await batch.commit();

    return NextResponse.json({
      success: true,
      message: 'Room and associated items deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete room error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete room' },
      { status: 500 }
    );
  }
}
