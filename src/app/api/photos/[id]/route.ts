import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// DELETE a photo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId || !id) {
      return NextResponse.json(
        { error: 'projectId and photo id are required' },
        { status: 400 }
      );
    }

    // Delete photo from subcollection
    await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('photos')
      .doc(id)
      .delete();

    return NextResponse.json({
      success: true,
      message: 'Photo deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete photo error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete photo' },
      { status: 500 }
    );
  }
}
