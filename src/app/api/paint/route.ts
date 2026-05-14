import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

/**
 * GET paint selections for a project
 */
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

    const snapshot = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('paint')
      .orderBy('createdAt', 'desc')
      .get();

    const paintSelections = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(paintSelections);
  } catch (error: any) {
    console.error('Get paint selections error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get paint selections' },
      { status: 500 }
    );
  }
}

/**
 * CREATE new paint selection
 */
export async function POST(request: NextRequest) {
  try {
    const paintData = await request.json();

    // Validate required fields
    if (!paintData.projectId || !paintData.colorName) {
      return NextResponse.json(
        { error: 'projectId and colorName are required' },
        { status: 400 }
      );
    }

    if (!paintData.assignmentType || !['wholeHome', 'specificRooms'].includes(paintData.assignmentType)) {
      return NextResponse.json(
        { error: 'assignmentType must be either "wholeHome" or "specificRooms"' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Create paint selection in subcollection
    const paintRef = await adminDb
      .collection('projects')
      .doc(paintData.projectId)
      .collection('paint')
      .add({
        colorName: paintData.colorName,
        paintCode: paintData.paintCode || null,
        sheen: paintData.sheen || null,
        notes: paintData.notes || null,
        image: paintData.image || null,
        assignmentType: paintData.assignmentType,
        areas: paintData.areas || [],
        roomIds: paintData.roomIds || [],
        roomNames: paintData.roomNames || [],
        createdAt: now,
        updatedAt: now,
        createdBy: paintData.createdBy || '',
      });

    return NextResponse.json({
      success: true,
      id: paintRef.id,
      paintId: paintRef.id,
      message: 'Paint selection created successfully',
    });
  } catch (error: any) {
    console.error('Create paint selection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create paint selection' },
      { status: 500 }
    );
  }
}

/**
 * DELETE paint selection
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const paintId = searchParams.get('paintId');

    if (!projectId || !paintId) {
      return NextResponse.json(
        { error: 'projectId and paintId are required' },
        { status: 400 }
      );
    }

    await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('paint')
      .doc(paintId)
      .delete();

    return NextResponse.json({
      success: true,
      message: 'Paint selection deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete paint selection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete paint selection' },
      { status: 500 }
    );
  }
}
