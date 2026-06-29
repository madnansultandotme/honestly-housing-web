import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { ScopeOfWorkDocument } from '@/lib/scope-of-work/types';

// GET /api/scope-of-work?projectId={id}
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const scopesSnapshot = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('scopeOfWork')
      .get();

    const scopes = scopesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(scopes);
  } catch (error) {
    console.error('Error fetching scopes of work:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scopes of work' },
      { status: 500 }
    );
  }
}

// POST /api/scope-of-work
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projectId,
      categoryId,
      categoryName,
      categoryCode,
      status,
      data,
      files,
      notes,
      completedBy,
    } = body;

    if (!projectId || !categoryId || !categoryName) {
      return NextResponse.json(
        { error: 'projectId, categoryId, and categoryName are required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const scopeData: ScopeOfWorkDocument = {
      projectId,
      categoryId,
      categoryName,
      categoryCode: categoryCode || '',
      status: status || 'incomplete',
      data: data || {},
      files: files || [],
      notes: notes || '',
      completedBy: completedBy || '',
      completedAt: status === 'completed' ? now : undefined,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('scopeOfWork')
      .add(scopeData);

    return NextResponse.json({
      id: docRef.id,
      ...scopeData,
    });
  } catch (error) {
    console.error('Error creating scope of work:', error);
    return NextResponse.json(
      { error: 'Failed to create scope of work' },
      { status: 500 }
    );
  }
}
