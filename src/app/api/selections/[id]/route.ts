import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// GET selection by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: selectionId } = await params;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const selectionDoc = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('items')
      .doc(selectionId)
      .get();

    if (!selectionDoc.exists) {
      return NextResponse.json(
        { error: 'Selection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      selection: {
        id: selectionDoc.id,
        ...selectionDoc.data(),
      },
    });
  } catch (error: any) {
    console.error('Get selection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get selection' },
      { status: 500 }
    );
  }
}

// UPDATE selection (including approval)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: selectionId } = await params;
    const updates = await request.json();

    if (!updates.projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const { projectId, ...updateData } = updates;

    // If approving, add timestamp and lock
    if (updateData.status === 'approved' && !updateData.approvedAt) {
      updateData.approvedAt = new Date().toISOString();
      updateData.locked = true;
    }

    await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('items')
      .doc(selectionId)
      .update({
        ...updateData,
        updatedAt: new Date().toISOString(),
      });

    return NextResponse.json({
      success: true,
      message: 'Selection updated successfully',
    });
  } catch (error: any) {
    console.error('Update selection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update selection' },
      { status: 500 }
    );
  }
}

// DELETE selection
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: selectionId } = await params;
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
      .collection('items')
      .doc(selectionId)
      .delete();

    return NextResponse.json({
      success: true,
      message: 'Selection deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete selection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete selection' },
      { status: 500 }
    );
  }
}
