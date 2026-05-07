import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// GET room-category mappings for a project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const roomId = searchParams.get('roomId');
    const categoryId = searchParams.get('categoryId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    let query = adminDb
      .collection('projects')
      .doc(projectId)
      .collection('roomCategories');

    if (roomId) {
      query = query.where('roomId', '==', roomId) as any;
    }
    if (categoryId) {
      query = query.where('categoryId', '==', categoryId) as any;
    }

    const snapshot = await query.get();
    const roomCategories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      roomCategories,
    });
  } catch (error: any) {
    console.error('Get room-categories error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get room-categories' },
      { status: 500 }
    );
  }
}

// CREATE room-category mapping
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.projectId || !data.roomId || !data.categoryId) {
      return NextResponse.json(
        { error: 'projectId, roomId, and categoryId are required' },
        { status: 400 }
      );
    }

    // Check if mapping already exists
    const existingSnapshot = await adminDb
      .collection('projects')
      .doc(data.projectId)
      .collection('roomCategories')
      .where('roomId', '==', data.roomId)
      .where('categoryId', '==', data.categoryId)
      .get();

    if (!existingSnapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'Mapping already exists',
        roomCategoryId: existingSnapshot.docs[0].id,
      });
    }

    const roomCategoryRef = await adminDb
      .collection('projects')
      .doc(data.projectId)
      .collection('roomCategories')
      .add({
        roomId: data.roomId,
        roomName: data.roomName || '',
        categoryId: data.categoryId,
        categoryName: data.categoryName || '',
        createdAt: new Date().toISOString(),
        createdBy: data.createdBy || '',
      });

    return NextResponse.json({
      success: true,
      roomCategoryId: roomCategoryRef.id,
      message: 'Room-category mapping created successfully',
    });
  } catch (error: any) {
    console.error('Create room-category error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create room-category mapping' },
      { status: 500 }
    );
  }
}

// DELETE room-category mapping
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const roomCategoryId = searchParams.get('roomCategoryId');

    if (!projectId || !roomCategoryId) {
      return NextResponse.json(
        { error: 'projectId and roomCategoryId are required' },
        { status: 400 }
      );
    }

    await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('roomCategories')
      .doc(roomCategoryId)
      .delete();

    return NextResponse.json({
      success: true,
      message: 'Room-category mapping deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete room-category error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete room-category mapping' },
      { status: 500 }
    );
  }
}
