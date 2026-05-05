import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// GET - Get all templates for a builder org (from subcollection)
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

    const snapshot = await adminDb
      .collection('builderOrgs')
      .doc(builderOrgId)
      .collection('templates')
      .orderBy('createdAt', 'desc')
      .get();

    const templates = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (error: any) {
    console.error('Get templates error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get templates' },
      { status: 500 }
    );
  }
}

// POST - Create a new template in subcollection
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const {
      name,
      builderOrgId,
      rooms,
      fixtureCounts,
      squareFootage,
      categories,
      createdBy,
    } = data;

    if (!name || !builderOrgId) {
      return NextResponse.json(
        { error: 'name and builderOrgId are required' },
        { status: 400 }
      );
    }

    const now = new Date();

    const template = {
      name,
      description: null,
      rooms: rooms || {},
      fixtureCounts: fixtureCounts || {
        plumbingFixtures: 0,
        lightingFixtures: 0,
      },
      squareFootage: squareFootage || null,
      categories: categories || [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy: createdBy || null,
      usageCount: 0,
    };

    const docRef = await adminDb
      .collection('builderOrgs')
      .doc(builderOrgId)
      .collection('templates')
      .add(template);

    return NextResponse.json({
      success: true,
      id: docRef.id,
      templateId: docRef.id,
      ...template,
      message: 'Template created successfully',
    });
  } catch (error: any) {
    console.error('Create template error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create template' },
      { status: 500 }
    );
  }
}
