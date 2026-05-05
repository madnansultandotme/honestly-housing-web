import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// DELETE an option
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const builderOrgId = searchParams.get('builderOrgId');

    if (!id || !builderOrgId) {
      return NextResponse.json(
        { error: 'Option ID and builderOrgId are required' },
        { status: 400 }
      );
    }

    // Delete the option from subcollection: builderOrgs/{orgId}/options/{id}
    await adminDb
      .collection('builderOrgs')
      .doc(builderOrgId)
      .collection('options')
      .doc(id)
      .delete();

    return NextResponse.json({
      success: true,
      message: 'Option deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete option error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete option' },
      { status: 500 }
    );
  }
}
