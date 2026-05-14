import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

/**
 * GET single paint selection
 */
export async function GET(
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

    const doc = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('paint')
      .doc(id)
      .get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Paint selection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: doc.id,
      ...doc.data(),
    });
  } catch (error: any) {
    console.error('Get paint selection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get paint selection' },
      { status: 500 }
    );
  }
}

/**
 * UPDATE paint selection
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const paintData = await request.json();

    if (!paintData.projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update paint selection
    await adminDb
      .collection('projects')
      .doc(paintData.projectId)
      .collection('paint')
      .doc(id)
      .update({
        colorName: paintData.colorName,
        paintCode: paintData.paintCode || null,
        sheen: paintData.sheen || null,
        notes: paintData.notes || null,
        image: paintData.image || null,
        assignmentType: paintData.assignmentType,
        areas: paintData.areas || [],
        roomIds: paintData.roomIds || [],
        roomNames: paintData.roomNames || [],
        updatedAt: now,
      });

    return NextResponse.json({
      success: true,
      message: 'Paint selection updated successfully',
    });
  } catch (error: any) {
    console.error('Update paint selection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update paint selection' },
      { status: 500 }
    );
  }
}

/**
 * DELETE paint selection
 */
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

    await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('paint')
      .doc(id)
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
