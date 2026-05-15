import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const builderOrgId = searchParams.get('builderOrgId');
    const categoryId = searchParams.get('categoryId');

    if (!builderOrgId) {
      return NextResponse.json(
        { error: 'builderOrgId is required' },
        { status: 400 }
      );
    }

    let query = adminDb
      .collection('builderOrgs')
      .doc(builderOrgId)
      .collection('subCategories')
      .orderBy('displayOrder', 'asc');

    if (categoryId) {
      query = query.where('parentCategoryId', '==', categoryId);
    }

    const snapshot = await query.get();

    const subCategories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(subCategories);
  } catch (error: any) {
    console.error('Get subCategories error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get subCategories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const {
      builderOrgId,
      parentCategoryId,
      parentCategoryName,
      name,
      displayOrder,
      createdBy,
    } = data;

    if (!builderOrgId || !parentCategoryId || !parentCategoryName || !name) {
      return NextResponse.json(
        { error: 'builderOrgId, parentCategoryId, parentCategoryName, and name are required' },
        { status: 400 }
      );
    }

    // Check for duplicate name within same parent category
    const existingSnap = await adminDb
      .collection('builderOrgs')
      .doc(builderOrgId)
      .collection('subCategories')
      .where('parentCategoryId', '==', parentCategoryId)
      .where('name', '==', name.trim())
      .get();

    if (!existingSnap.empty) {
      return NextResponse.json(
        { error: 'A sub-category with this name already exists' },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();

    const subCategory = {
      builderOrgId,
      parentCategoryId,
      parentCategoryName,
      name: name.trim(),
      displayOrder: displayOrder || 0,
      createdBy: createdBy || null,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb
      .collection('builderOrgs')
      .doc(builderOrgId)
      .collection('subCategories')
      .add(subCategory);

    return NextResponse.json({
      success: true,
      id: docRef.id,
      ...subCategory,
    });
  } catch (error: any) {
    console.error('Create subCategory error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create subCategory' },
      { status: 500 }
    );
  }
}
