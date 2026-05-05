import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// POST - Approve a selection
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: selectionId } = await params;
    const { userId, notes } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get current selection
    const selectionDoc = await adminDb.collection('selections').doc(selectionId).get();
    
    if (!selectionDoc.exists) {
      return NextResponse.json(
        { error: 'Selection not found' },
        { status: 404 }
      );
    }

    const selection = selectionDoc.data();

    // Check if already locked
    if (selection?.locked) {
      return NextResponse.json(
        { error: 'Selection is locked. Change order required.' },
        { status: 400 }
      );
    }

    // Update selection with approval
    await adminDb.collection('selections').doc(selectionId).update({
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: userId,
      locked: true,
      approvalNotes: notes || null,
      updatedAt: new Date().toISOString(),
    });

    if (selection?.projectId) {
      const projectDoc = await adminDb.collection('projects').doc(selection.projectId).get();
      const project = projectDoc.exists ? projectDoc.data() : null;
      const builderId = project?.builderId || project?.builderOrgId;

      if (builderId) {
        await adminDb.collection('notifications').add({
          userId: builderId,
          title: 'Selection approved',
          body: selection?.name || 'A selection was approved',
          link: `/projects/${selection.projectId}/selections/${selectionId}`,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Selection approved successfully',
    });
  } catch (error: any) {
    console.error('Approve selection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to approve selection' },
      { status: 500 }
    );
  }
}
