import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// GET - Get a specific template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params;
    const { searchParams } = new URL(request.url);
    const builderOrgId = searchParams.get('builderOrgId');

    if (!builderOrgId) {
      return NextResponse.json(
        { error: 'builderOrgId is required' },
        { status: 400 }
      );
    }

    const doc = await adminDb
      .collection('builderOrgs')
      .doc(builderOrgId)
      .collection('templates')
      .doc(templateId)
      .get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: doc.id,
      ...doc.data(),
    });
  } catch (error: any) {
    console.error('Get template error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get template' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params;
    const { searchParams } = new URL(request.url);
    const builderOrgId = searchParams.get('builderOrgId');

    if (!builderOrgId) {
      return NextResponse.json(
        { error: 'builderOrgId is required' },
        { status: 400 }
      );
    }

    await adminDb
      .collection('builderOrgs')
      .doc(builderOrgId)
      .collection('templates')
      .doc(templateId)
      .delete();

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete template error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete template' },
      { status: 500 }
    );
  }
}
