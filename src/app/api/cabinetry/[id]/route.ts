import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const doc = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('cabinetry')
      .doc(id)
      .get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Cabinetry selection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: doc.id,
      ...doc.data(),
    });
  } catch (error: any) {
    console.error('Get cabinetry selection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get cabinetry selection' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cabinetryData = await request.json();

    if (!cabinetryData.projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    await adminDb
      .collection('projects')
      .doc(cabinetryData.projectId)
      .collection('cabinetry')
      .doc(id)
      .update({
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
        updatedAt: now,
      });

    return NextResponse.json({
      success: true,
      message: 'Cabinetry selection updated successfully',
    });
  } catch (error: any) {
    console.error('Update cabinetry selection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update cabinetry selection' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('cabinetry')
      .doc(id)
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
