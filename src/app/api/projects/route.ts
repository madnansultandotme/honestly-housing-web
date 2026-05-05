import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// GET all projects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const builderOrgId = searchParams.get('builderOrgId');
    const builderId = searchParams.get('builderId');
    const status = searchParams.get('status');

    let query = adminDb.collection('projects');

    // Apply filters
    if (clientId) {
      query = query.where('clientId', '==', clientId) as any;
    }
    if (builderOrgId) {
      query = query.where('builderOrgId', '==', builderOrgId) as any;
    }
    if (builderId) {
      query = query.where('builderId', '==', builderId) as any;
    }
    if (status) {
      query = query.where('status', '==', status) as any;
    }

    const snapshot = await query.get();
    const projects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      projects,
    });
  } catch (error: any) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get projects' },
      { status: 500 }
    );
  }
}

// CREATE new project
export async function POST(request: NextRequest) {
  try {
    const projectData = await request.json();

    // Validate required fields
    if (!projectData.name || !projectData.clientId || !projectData.builderOrgId) {
      return NextResponse.json(
        { error: 'Name, clientId, and builderOrgId are required' },
        { status: 400 }
      );
    }

    // Validate schema structure
    if (!projectData.rooms || typeof projectData.rooms !== 'object') {
      return NextResponse.json(
        { error: 'Rooms object is required with room type counts' },
        { status: 400 }
      );
    }

    if (!projectData.fixtureCounts || typeof projectData.fixtureCounts !== 'object') {
      return NextResponse.json(
        { error: 'FixtureCounts object is required' },
        { status: 400 }
      );
    }

    if (!projectData.progress || typeof projectData.progress !== 'object') {
      return NextResponse.json(
        { error: 'Progress object is required' },
        { status: 400 }
      );
    }

    const now = new Date();

    // Create project in Firestore with schema-compliant structure
    const projectRef = await adminDb.collection('projects').add({
      name: projectData.name,
      builderOrgId: projectData.builderOrgId,
      clientId: projectData.clientId,
      clientEmail: projectData.clientEmail || '', // Store email for easy access
      status: projectData.status || 'setup',
      address: projectData.address || '',
      startDate: projectData.startDate || now.toISOString(),
      targetCompletionDate: projectData.targetCompletionDate || null,
      rooms: projectData.rooms,
      fixtureCounts: projectData.fixtureCounts,
      squareFootage: projectData.squareFootage || null,
      progress: projectData.progress,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy: projectData.createdBy,
    });

    return NextResponse.json({
      success: true,
      id: projectRef.id,
      projectId: projectRef.id,
      project: {
        id: projectRef.id,
        name: projectData.name,
        builderOrgId: projectData.builderOrgId,
        clientId: projectData.clientId,
        clientEmail: projectData.clientEmail || '',
        status: projectData.status || 'setup',
        address: projectData.address || '',
        startDate: projectData.startDate || now.toISOString(),
        rooms: projectData.rooms,
        fixtureCounts: projectData.fixtureCounts,
        squareFootage: projectData.squareFootage || null,
        progress: projectData.progress,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        createdBy: projectData.createdBy,
      },
      message: 'Project created successfully',
    });
  } catch (error: any) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create project' },
      { status: 500 }
    );
  }
}
