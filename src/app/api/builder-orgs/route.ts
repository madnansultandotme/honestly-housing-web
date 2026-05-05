import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// GET builder org by id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const builderOrgId = searchParams.get('builderOrgId');

    if (!builderOrgId) {
      return NextResponse.json(
        { error: 'builderOrgId is required' },
        { status: 400 }
      );
    }

    const doc = await adminDb.collection('builderOrgs').doc(builderOrgId).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Builder org not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      builderOrg: {
        id: doc.id,
        ...doc.data(),
      },
    });
  } catch (error: any) {
    console.error('Get builder org error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get builder org' },
      { status: 500 }
    );
  }
}

// POST create builder org
export async function POST(request: NextRequest) {
  try {
    const { name, ownerId } = await request.json();

    if (!name || !ownerId) {
      return NextResponse.json(
        { error: 'name and ownerId are required' },
        { status: 400 }
      );
    }

    const builderOrg = {
      name,
      ownerId,
      branding: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('builderOrgs').add(builderOrg);

    return NextResponse.json({
      success: true,
      builderOrgId: docRef.id,
      builderOrg: {
        id: docRef.id,
        ...builderOrg,
      },
    });
  } catch (error: any) {
    console.error('Create builder org error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create builder org' },
      { status: 500 }
    );
  }
}
