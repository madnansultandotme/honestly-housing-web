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

    let query = adminDb.collection('selections').where('projectId', '==', projectId);

    if (categoryId) {
      query = query.where('categoryId', '==', categoryId) as any;
    }
    if (status) {
      query = query.where('status', '==', status) as any;
    }

    const snapshot = await query.get();
    const selections = snapshot.docs.map(doc => ({
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

    // Create selection in Firestore
    const selectionRef = await adminDb.collection('selections').add({
      ...selectionData,
      status: selectionData.status || 'not_started',
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
