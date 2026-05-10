import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// GET change requests for a project or item
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const itemId = searchParams.get('itemId');

    if (!projectId && !itemId) {
      return NextResponse.json(
        { error: 'projectId or itemId is required' },
        { status: 400 }
      );
    }

    let query = adminDb.collection('changeRequests');

    if (projectId) {
      query = query.where('projectId', '==', projectId) as any;
    }
    if (itemId) {
      query = query.where('itemId', '==', itemId) as any;
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const changeRequests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      changeRequests,
    });
  } catch (error: any) {
    console.error('Get change requests error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get change requests' },
      { status: 500 }
    );
  }
}

// POST - Create change request and update selection status
export async function POST(request: NextRequest) {
  try {
    const { projectId, itemId, requestedBy, reason } = await request.json();

    if (!projectId || !itemId || !requestedBy || !reason) {
      return NextResponse.json(
        { error: 'projectId, itemId, requestedBy, and reason are required' },
        { status: 400 }
      );
    }

    const changeRequest = {
      projectId,
      itemId,
      requestedBy,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('changeRequests').add(changeRequest);

    // Update item in subcollection
    await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('items')
      .doc(itemId)
      .update({
        status: 'needs_builder_input',
        changeRequestReason: reason,
        changeRequestedBy: requestedBy,
        changeRequestedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

    // Get selection for notification
    const selectionDoc = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('items')
      .doc(itemId)
      .get();
    
    const selection = selectionDoc.exists ? selectionDoc.data() : null;
    const projectDoc = await adminDb.collection('projects').doc(projectId).get();
    const project = projectDoc.exists ? projectDoc.data() : null;
    const builderId = project?.builderId || project?.builderOrgId;

    if (builderId) {
      await adminDb.collection('notifications').add({
        userId: builderId,
        title: 'Change request submitted',
        body: selection?.name || 'A change request was submitted',
        link: `/projects/${projectId}/selections/${itemId}`,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      changeRequestId: docRef.id,
    });
  } catch (error: any) {
    console.error('Create change request error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create change request' },
      { status: 500 }
    );
  }
}
