import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: subCategoryId } = await params;
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
      .collection('subCategories')
      .doc(subCategoryId)
      .delete();

    return NextResponse.json({
      success: true,
      message: 'Sub-category deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete subCategory error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete subCategory' },
      { status: 500 }
    );
  }
}
