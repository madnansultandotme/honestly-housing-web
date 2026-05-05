import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// GET options for a builder org or category
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const builderOrgId = searchParams.get('builderOrgId');

    if (!builderOrgId) {
      return NextResponse.json(
        { error: 'builderOrgId is required' },
        { status: 400 }
      );
    }

    // Query from subcollection: builderOrgs/{orgId}/options
    let query = adminDb
      .collection('builderOrgs')
      .doc(builderOrgId)
      .collection('options');

    if (categoryId) {
      query = query.where('categoryId', '==', categoryId) as any;
    }

    const snapshot = await query.get();
    const options = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      options,
    });
  } catch (error: any) {
    console.error('Get options error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get options' },
      { status: 500 }
    );
  }
}

// CREATE new option (Builder only)
export async function POST(request: NextRequest) {
  try {
    const optionData = await request.json();

    // Validate required fields
    if (!optionData.builderOrgId || !optionData.categoryId || !optionData.name) {
      return NextResponse.json(
        { error: 'builderOrgId, categoryId, and name are required' },
        { status: 400 }
      );
    }

    // Create option in subcollection: builderOrgs/{orgId}/options
    const optionRef = await adminDb
      .collection('builderOrgs')
      .doc(optionData.builderOrgId)
      .collection('options')
      .add({
        categoryId: optionData.categoryId,
        categoryName: optionData.categoryName || '',
        name: optionData.name,
        brand: optionData.brand || null,
        description: optionData.description || null,
        imageUrl: optionData.imageUrl || '',
        linkUrl: optionData.linkUrl || null,
        price: optionData.price || 0,
        tier: optionData.tier || 'good', // good, better, best
        isActive: optionData.isActive !== false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: optionData.createdBy || '',
      });

    return NextResponse.json({
      success: true,
      optionId: optionRef.id,
      message: 'Option created successfully',
    });
  } catch (error: any) {
    console.error('Create option error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create option' },
      { status: 500 }
    );
  }
}
