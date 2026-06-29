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
  console.log('========================================');
  console.log('🚀 PROJECT CREATION API CALLED');
  console.log('========================================');
  
  try {
    console.log('📥 Step 1: Parsing request body...');
    
    const projectData = await request.json();
    console.log('✅ Step 1 Complete: Request body parsed');
    console.log('📦 Project data keys:', Object.keys(projectData));

    // Validate required fields
    console.log('📋 Step 2: Validating required fields...');
    if (!projectData.name || !projectData.clientId || !projectData.builderOrgId) {
      console.error('❌ Missing required fields:', {
        name: !!projectData.name,
        clientId: !!projectData.clientId,
        builderOrgId: !!projectData.builderOrgId
      });
      return NextResponse.json(
        { error: 'Name, clientId, and builderOrgId are required', success: false },
        { status: 400 }
      );
    }
    console.log('✅ Step 2 Complete: All required fields present');

    // Validate schema structure
    console.log('📋 Step 3: Validating schema structure...');
    if (!projectData.rooms || typeof projectData.rooms !== 'object') {
      console.error('❌ Invalid rooms object:', projectData.rooms);
      return NextResponse.json(
        { error: 'Rooms object is required with room type counts', success: false },
        { status: 400 }
      );
    }

    if (!projectData.fixtureCounts || typeof projectData.fixtureCounts !== 'object') {
      console.error('❌ Invalid fixtureCounts object:', projectData.fixtureCounts);
      return NextResponse.json(
        { error: 'FixtureCounts object is required', success: false },
        { status: 400 }
      );
    }

    if (!projectData.progress || typeof projectData.progress !== 'object') {
      console.error('❌ Invalid progress object:', projectData.progress);
      return NextResponse.json(
        { error: 'Progress object is required', success: false },
        { status: 400 }
      );
    }
    console.log('✅ Step 3 Complete: Schema validation passed');

    const now = new Date();
    console.log('💾 Step 4: Creating project in Firestore...');

    // Create project in Firestore with schema-compliant structure
    const projectRef = await adminDb.collection('projects').add({
      name: projectData.name,
      builderOrgId: projectData.builderOrgId,
      clientId: projectData.clientId,
      clientEmail: projectData.clientEmail || '', 
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

    console.log('✅ Step 4 Complete: Project created with ID:', projectRef.id);

    // Add project to client's projectIds array
    console.log('📝 Step 5: Updating client projectIds...');
    try {
      const clientRef = adminDb.collection('users').doc(projectData.clientId);
      const clientDoc = await clientRef.get();
      
      if (clientDoc.exists) {
        const clientData = clientDoc.data();
        const projectIds = clientData?.projectIds || [];
        
        if (!projectIds.includes(projectRef.id)) {
          await clientRef.update({
            projectIds: [...projectIds, projectRef.id],
          });
          console.log('✅ Step 5 Complete: Client projectIds updated');
        } else {
          console.log('ℹ️ Step 5: Project already in client projectIds');
        }
      } else {
        console.warn('⚠️ Step 5: Client document not found:', projectData.clientId);
      }
    } catch (clientError) {
      console.error('⚠️ Step 5 Error (non-fatal):', clientError);
      // Continue even if client update fails
    }

    // Add project to creator's projectIds array (if different from client)
    console.log('📝 Step 6: Updating creator projectIds...');
    if (projectData.createdBy && projectData.createdBy !== projectData.clientId) {
      try {
        const creatorRef = adminDb.collection('users').doc(projectData.createdBy);
        const creatorDoc = await creatorRef.get();
        
        if (creatorDoc.exists) {
          const creatorData = creatorDoc.data();
          const projectIds = creatorData?.projectIds || [];
          
          if (!projectIds.includes(projectRef.id)) {
            await creatorRef.update({
              projectIds: [...projectIds, projectRef.id],
            });
            console.log('✅ Step 6 Complete: Creator projectIds updated');
          } else {
            console.log('ℹ️ Step 6: Project already in creator projectIds');
          }
        }
      } catch (creatorError) {
        console.error('⚠️ Step 6 Error (non-fatal):', creatorError);
        // Continue even if creator update fails
      }
    } else {
      console.log('ℹ️ Step 6: Skipped (creator is same as client)');
    }

    console.log('📦 Step 7: Building response object...');
    const responseData = {
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
    };

    console.log('✅ Step 7 Complete: Response object built');
    console.log('📤 Step 8: Sending response...');
    console.log('Response data keys:', Object.keys(responseData));
    
    const response = NextResponse.json(responseData);
    console.log('✅ Step 8 Complete: Response created');
    console.log('========================================');
    console.log('✅ PROJECT CREATION SUCCESSFUL');
    console.log('========================================');
    
    return response;
  } catch (error: any) {
    console.error('========================================');
    console.error('❌ CREATE PROJECT ERROR');
    console.error('========================================');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    const errorResponse = {
      error: error.message || 'Failed to create project',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      success: false,
    };
    
    console.log('Sending error response:', errorResponse);
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
