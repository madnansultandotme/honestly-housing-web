import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// GET items for a project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const categoryId = searchParams.get('categoryId');
    const roomId = searchParams.get('roomId');
    const status = searchParams.get('status');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    let query = adminDb
      .collection('projects')
      .doc(projectId)
      .collection('items');

    // Apply filters
    if (categoryId) {
      query = query.where('categoryId', '==', categoryId) as any;
    }
    if (roomId) {
      query = query.where('roomId', '==', roomId) as any;
    }
    if (status) {
      query = query.where('status', '==', status) as any;
    }

    const snapshot = await query.get();
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      items,
    });
  } catch (error: any) {
    console.error('Get items error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get items' },
      { status: 500 }
    );
  }
}

// CREATE new item
export async function POST(request: NextRequest) {
  try {
    const itemData = await request.json();

    // Validate required fields
    if (!itemData.projectId || !itemData.categoryId || !itemData.name) {
      return NextResponse.json(
        { error: 'projectId, categoryId, and name are required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Create item in subcollection
    const itemRef = await adminDb
      .collection('projects')
      .doc(itemData.projectId)
      .collection('items')
      .add({
        categoryId: itemData.categoryId,
        categoryName: itemData.categoryName || '',
        name: itemData.name,
        brand: itemData.brand || null,
        description: itemData.description || null,
        imageUrl: itemData.imageUrl || null,
        linkUrl: itemData.linkUrl || null,
        allowance: itemData.allowance || 0,
        actualCost: itemData.actualCost || 0,
        difference: itemData.difference || 0,
        status: itemData.status || 'notStarted',
        dueDate: itemData.dueDate || null,
        roomId: itemData.roomId || null,
        roomName: itemData.roomName || null,
        quantity: itemData.quantity || 1,
        parentItemId: itemData.parentItemId || null,
        subType: itemData.subType || null,
        notes: itemData.notes || null,
        locked: itemData.locked || false,
        approvedAt: itemData.approvedAt || null,
        approvedBy: itemData.approvedBy || null,
        orderedAt: itemData.orderedAt || null,
        installedAt: itemData.installedAt || null,
        tier: itemData.tier || null,
        createdAt: now,
        updatedAt: now,
        createdBy: itemData.createdBy || '',
      });

    return NextResponse.json({
      success: true,
      id: itemRef.id,
      itemId: itemRef.id,
      message: 'Item created successfully',
    });
  } catch (error: any) {
    console.error('Create item error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create item' },
      { status: 500 }
    );
  }
}

// DELETE item
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const itemId = searchParams.get('itemId');

    if (!projectId || !itemId) {
      return NextResponse.json(
        { error: 'projectId and itemId are required' },
        { status: 400 }
      );
    }

    await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('items')
      .doc(itemId)
      .delete();

    return NextResponse.json({
      success: true,
      message: 'Item deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete item error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete item' },
      { status: 500 }
    );
  }
}
