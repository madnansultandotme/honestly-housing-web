import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// PATCH update change order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: changeOrderId } = await params;
    const { status } = await request.json();

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be approved or rejected' },
        { status: 400 }
      );
    }

    const changeOrderDoc = await adminDb.collection('changeOrders').doc(changeOrderId).get();
    if (!changeOrderDoc.exists) {
      return NextResponse.json(
        { error: 'Change order not found' },
        { status: 404 }
      );
    }

    const changeOrder = changeOrderDoc.data() as any;

    await changeOrderDoc.ref.update({
      status,
      updatedAt: new Date().toISOString(),
    });

    if (changeOrder?.selectionId) {
      const selectionUpdates: Record<string, any> = {
        changeOrderStatus: status,
        updatedAt: new Date().toISOString(),
      };

      if (status === 'approved') {
        selectionUpdates.status = 'approved';
        if (changeOrder.proposedActualCost !== null && changeOrder.proposedActualCost !== undefined) {
          selectionUpdates.actualCost = changeOrder.proposedActualCost;
        }
      } else {
        selectionUpdates.status = 'approved';
      }

      await adminDb.collection('selections').doc(changeOrder.selectionId).update(selectionUpdates);
    }

    if (changeOrder?.projectId) {
      const projectDoc = await adminDb.collection('projects').doc(changeOrder.projectId).get();
      const project = projectDoc.exists ? projectDoc.data() : null;
      const builderId = project?.builderId || project?.builderOrgId;

      if (builderId) {
        await adminDb.collection('notifications').add({
          userId: builderId,
          title: `Change order ${status}`,
          body: 'Client responded to the change order',
          link: `/projects/${changeOrder.projectId}/selections/${changeOrder.selectionId}`,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Change order updated',
    });
  } catch (error: any) {
    console.error('Update change order error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update change order' },
      { status: 500 }
    );
  }
}
