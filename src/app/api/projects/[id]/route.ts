import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { countRoomsFromDetails } from '@/lib/projects/roomCounts';

// GET project by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const projectDoc = await adminDb.collection('projects').doc(projectId).get();

    if (!projectDoc.exists) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const roomsSnapshot = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('rooms')
      .get();

    const rooms = roomsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const projectData = projectDoc.data() || {};
    const subcollectionRoomCounts = countRoomsFromDetails(rooms as Array<{ type?: string }>);
    const roomCounts = rooms.length > 0
      ? subcollectionRoomCounts
      : projectData.rooms || subcollectionRoomCounts;

    return NextResponse.json({
      success: true,
      project: {
        id: projectDoc.id,
        ...projectData,
        rooms: roomCounts,
        roomCounts,
        roomCountTotal: rooms.length,
      },
    });
  } catch (error) {
    console.error('Get project error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get project' },
      { status: 500 }
    );
  }
}

// UPDATE project
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const updates = await request.json();

    await adminDb.collection('projects').doc(projectId).update({
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Project updated successfully',
    });
  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

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
      'paint',
      'cabinetry',
      'roomCategories',
      'budget',
      'budgetRows',
      'drawInvoices',
    ];

    for (const subcollection of subcollections) {
      const snapshot = await adminDb
        .collection('projects')
        .doc(projectId)
        .collection(subcollection)
        .get();

      if (snapshot.empty) {
        continue;
      }

      const batch = adminDb.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    await adminDb.collection('projects').doc(projectId).delete();

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete project' },
      { status: 500 }
    );
  }
}
