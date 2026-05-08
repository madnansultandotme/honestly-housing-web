import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// GET single item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await params;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const itemDoc = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('items')
      .doc(itemId)
      .get();

    if (!itemDoc.exists) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      item: {
        id: itemDoc.id,
        ...itemDoc.data(),
      },
    });
  } catch (error: any) {
    console.error('Get item error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get item' },
      { status: 500 }
    );
  }
}

// UPDATE item (PUT or PATCH)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await params;
    const itemData = await request.json();

    if (!itemData.projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const updateData = {
      ...itemData,
      updatedAt: new Date().toISOString(),
    };

    // Remove projectId from update data (it's in the path)
    delete updateData.projectId;

    await adminDb
      .collection('projects')
      .doc(itemData.projectId)
      .collection('items')
      .doc(itemId)
      .update(updateData);

    return NextResponse.json({
      success: true,
      message: 'Item updated successfully',
    });
  } catch (error: any) {
    console.error('Update item error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update item' },
      { status: 500 }
    );
  }
}

// PATCH is an alias for PUT
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(request, { params });
}

// DELETE item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await params;
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
