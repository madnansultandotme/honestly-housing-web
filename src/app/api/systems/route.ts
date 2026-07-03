import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// GET /api/systems?projectId={id}
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

    const docSnapshot = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('systems')
      .doc('configuration')
      .get();

    if (!docSnapshot.exists) {
      return NextResponse.json({
        hvac: { tonnage: '', brand: '', location: '' },
        septic: { isAerobic: false, aerobicType: '', hasTank: false },
        propane: { size: '', otherSize: '' },
        waterHeater: { fuelType: '', type: '', tankSize: '' },
      });
    }

    return NextResponse.json(docSnapshot.data());
  } catch (error) {
    console.error('Error fetching systems:', error);
    return NextResponse.json(
      { error: 'Failed to fetch systems' },
      { status: 500 }
    );
  }
}

// POST /api/systems
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, ...systemsData } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const data = {
      ...systemsData,
      updatedAt: now,
      createdAt: now,
    };

    await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('systems')
      .doc('configuration')
      .set(data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error saving systems:', error);
    return NextResponse.json(
      { error: 'Failed to save systems' },
      { status: 500 }
    );
  }
}

// PUT /api/systems (Update)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, ...systemsData } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const data = {
      ...systemsData,
      updatedAt: now,
    };

    await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('systems')
      .doc('configuration')
      .update(data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating systems:', error);
    return NextResponse.json(
      { error: 'Failed to update systems' },
      { status: 500 }
    );
  }
}
