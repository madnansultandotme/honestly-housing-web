import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// GET rooms for a project (from subcollection)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const roomsSnapshot = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('rooms')
      .orderBy('name', 'asc')
      .get();

    const rooms = roomsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      rooms,
    });
  } catch (error: any) {
    console.error('Get rooms error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get rooms' },
      { status: 500 }
    );
  }
}

// POST - Create room in subcollection
export async function POST(request: NextRequest) {
  try {
    const { projectId, name, type, fixtureCounts } = await request.json();

    if (!projectId || !name || !type) {
      return NextResponse.json(
        { error: 'projectId, name, and type are required' },
        { status: 400 }
      );
    }

    const now = new Date();

    // Create room in subcollection
    const roomRef = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('rooms')
      .add({
        name,
        type,
        floor: null,
        fixtureCounts: fixtureCounts || {
          total: 1,
          assigned: 0,
        },
        notes: null,
        createdAt: now.toISOString(),
      });

    return NextResponse.json({
      success: true,
      id: roomRef.id,
      roomId: roomRef.id,
      message: 'Room created successfully',
    });
  } catch (error: any) {
    console.error('Create room error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create room' },
      { status: 500 }
    );
  }
}
