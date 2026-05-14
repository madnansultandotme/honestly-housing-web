import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

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
      .collection('cabinetry')
      .orderBy('createdAt', 'desc')
      .get();

    const cabinetrySelections = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(cabinetrySelections);
  } catch (error: any) {
    console.error('Get cabinetry selections error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get cabinetry selections' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cabinetryData = await request.json();

    if (!cabinetryData.projectId || !cabinetryData.cabinetryType) {
      return NextResponse.json(
        { error: 'projectId and cabinetryType are required' },
        { status: 400 }
      );
    }

    if (!cabinetryData.assignmentType || !['wholeHome', 'specificRooms'].includes(cabinetryData.assignmentType)) {
      return NextResponse.json(
        { error: 'assignmentType must be either "wholeHome" or "specificRooms"' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const cabinetryRef = await adminDb
      .collection('projects')
      .doc(cabinetryData.projectId)
      .collection('cabinetry')
      .add({
        cabinetryType: cabinetryData.cabinetryType,
        material: cabinetryData.material || null,
        finish: cabinetryData.finish || null,
        doorStyle: cabinetryData.doorStyle || null,
        constructionType: cabinetryData.constructionType || null,
        hardware: cabinetryData.hardware || null,
        notes: cabinetryData.notes || null,
        image: cabinetryData.image || null,
        assignmentType: cabinetryData.assignmentType,
        areas: cabinetryData.areas || [],
        roomIds: cabinetryData.roomIds || [],
        roomNames: cabinetryData.roomNames || [],
        createdAt: now,
        updatedAt: now,
        createdBy: cabinetryData.createdBy || '',
      });

    return NextResponse.json({
      success: true,
      id: cabinetryRef.id,
      cabinetryId: cabinetryRef.id,
      message: 'Cabinetry selection created successfully',
    });
  } catch (error: any) {
    console.error('Create cabinetry selection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create cabinetry selection' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const cabinetryId = searchParams.get('cabinetryId');

    if (!projectId || !cabinetryId) {
      return NextResponse.json(
        { error: 'projectId and cabinetryId are required' },
        { status: 400 }
      );
    }

    await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('cabinetry')
      .doc(cabinetryId)
      .delete();

    return NextResponse.json({
      success: true,
      message: 'Cabinetry selection deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete cabinetry selection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete cabinetry selection' },
      { status: 500 }
    );
  }
}
