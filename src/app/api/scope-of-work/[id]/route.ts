import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// GET /api/scope-of-work/[id]?projectId={projectId}
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
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const docSnapshot = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('scopeOfWork')
      .doc(id)
      .get();

    if (!docSnapshot.exists) {
      return NextResponse.json(
        { error: 'Scope of work not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: docSnapshot.id,
      ...docSnapshot.data(),
    });
  } catch (error) {
    console.error('Error fetching scope of work:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scope of work' },
      { status: 500 }
    );
  }
}

// PUT /api/scope-of-work/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      projectId,
      status,
      data,
      files,
      notes,
      completedBy,
    } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const updates: any = {
      updatedAt: now,
    };

    if (status !== undefined) updates.status = status;
    if (data !== undefined) updates.data = data;
    if (files !== undefined) updates.files = files;
    if (notes !== undefined) updates.notes = notes;
    if (completedBy !== undefined) updates.completedBy = completedBy;
    
    if (status === 'completed') {
      updates.completedAt = now;
    }

    await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('scopeOfWork')
      .doc(id)
      .update(updates);

    const updatedDoc = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('scopeOfWork')
      .doc(id)
      .get();

    return NextResponse.json({
      id: updatedDoc.id,
      ...updatedDoc.data(),
    });
  } catch (error) {
    console.error('Error updating scope of work:', error);
    return NextResponse.json(
      { error: 'Failed to update scope of work' },
      { status: 500 }
    );
  }
}

// DELETE /api/scope-of-work/[id]?projectId={projectId}
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
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('scopeOfWork')
      .doc(id)
      .delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting scope of work:', error);
    return NextResponse.json(
      { error: 'Failed to delete scope of work' },
      { status: 500 }
    );
  }
}
