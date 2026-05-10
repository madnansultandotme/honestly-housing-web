import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// GET change orders for a selection or project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const selectionId = searchParams.get('selectionId');
    const projectId = searchParams.get('projectId');

    if (!selectionId && !projectId) {
      return NextResponse.json(
        { error: 'selectionId or projectId is required' },
        { status: 400 }
      );
    }

    let query = adminDb.collection('changeOrders');

    if (selectionId) {
      query = query.where('selectionId', '==', selectionId) as any;
    }
    if (projectId) {
      query = query.where('projectId', '==', projectId) as any;
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const changeOrders = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      changeOrders,
    });
  } catch (error: any) {
    console.error('Get change orders error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get change orders' },
      { status: 500 }
    );
  }
}

// POST create change order
export async function POST(request: NextRequest) {
  try {
    const { projectId, selectionId, createdBy, reason, proposedActualCost } = await request.json();

    if (!projectId || !selectionId || !createdBy || !reason) {
      return NextResponse.json(
        { error: 'projectId, selectionId, createdBy, and reason are required' },
        { status: 400 }
      );
    }

    const changeOrder = {
      projectId,
      selectionId,
      createdBy,
      reason,
      proposedActualCost: proposedActualCost ?? null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('changeOrders').add(changeOrder);

    // Update item in subcollection
    await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('items')
      .doc(selectionId)
      .update({
        changeOrderId: docRef.id,
        changeOrderStatus: 'pending',
        status: 'change_order_pending',
        updatedAt: new Date().toISOString(),
      });

    const projectDoc = await adminDb.collection('projects').doc(projectId).get();
    const project = projectDoc.exists ? projectDoc.data() : null;
    const clientId = project?.clientId;

    if (clientId) {
      await adminDb.collection('notifications').add({
        userId: clientId,
        title: 'Change order requested',
        body: 'Review the change order for your selection',
        link: `/projects/${projectId}/selections/${selectionId}`,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      changeOrderId: docRef.id,
    });
  } catch (error: any) {
    console.error('Create change order error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create change order' },
      { status: 500 }
    );
  }
}
