import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// GET selections for a project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const categoryId = searchParams.get('categoryId');
    const status = searchParams.get('status');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    // Use subcollection structure: projects/{projectId}/items
    let query = adminDb
      .collection('projects')
      .doc(projectId)
      .collection('items');

    // Apply filters if provided
    let queryRef: any = query;
    if (categoryId) {
      queryRef = queryRef.where('categoryId', '==', categoryId);
    }
    if (status) {
      queryRef = queryRef.where('status', '==', status);
    }

    const snapshot = await queryRef.get();
    const selections = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      selections,
    });
  } catch (error: any) {
    console.error('Get selections error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get selections' },
      { status: 500 }
    );
  }
}

// CREATE new selection
export async function POST(request: NextRequest) {
  try {
    const selectionData = await request.json();

    // Validate required fields
    if (!selectionData.projectId || !selectionData.categoryId || !selectionData.name) {
      return NextResponse.json(
        { error: 'projectId, categoryId, and name are required' },
        { status: 400 }
      );
    }

    const { projectId, ...itemData } = selectionData;

    // Create selection in subcollection: projects/{projectId}/items
    const selectionRef = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('items')
      .add({
        ...itemData,
        status: itemData.status || 'not_started',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

    return NextResponse.json({
      success: true,
      selectionId: selectionRef.id,
      message: 'Selection created successfully',
    });
  } catch (error: any) {
    console.error('Create selection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create selection' },
      { status: 500 }
    );
  }
}

// DELETE selection
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const selectionId = searchParams.get('selectionId');
    const projectId = searchParams.get('projectId');

    if (!selectionId || !projectId) {
      return NextResponse.json(
        { error: 'selectionId and projectId are required' },
        { status: 400 }
      );
    }

    // Delete from subcollection: projects/{projectId}/items/{selectionId}
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
