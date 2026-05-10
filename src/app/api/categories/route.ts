import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// GET categories for a project (from subcollection)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const snapshot = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('categories')
      .orderBy('displayOrder', 'asc')
      .get();

    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(categories);
  } catch (error: any) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get categories' },
      { status: 500 }
    );
  }
}

// CREATE new category in subcollection
export async function POST(request: NextRequest) {
  try {
    const categoryData = await request.json();

    // Validate required fields
    if (!categoryData.projectId || !categoryData.name) {
      return NextResponse.json(
        { error: 'projectId and name are required' },
        { status: 400 }
      );
    }

    const now = new Date();

    // Create category in subcollection
    const categoryRef = await adminDb
      .collection('projects')
      .doc(categoryData.projectId)
      .collection('categories')
      .add({
        name: categoryData.name,
        displayOrder: categoryData.displayOrder || 0,
        required: categoryData.required !== false,
        allowanceType: categoryData.allowanceType || 'fixed',
        allowanceAmount: categoryData.allowanceAmount || 0,
        progress: categoryData.progress || {
          totalItems: 0,
          completedItems: 0,
        },
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });

    return NextResponse.json({
      success: true,
      id: categoryRef.id,
      categoryId: categoryRef.id,
      message: 'Category created successfully',
    });
  } catch (error: any) {
    console.error('Create category error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create category' },
      { status: 500 }
    );
  }
}
