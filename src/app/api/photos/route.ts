import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// GET photos for a project (from subcollection)
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
      .collection('photos')
      .orderBy('createdAt', 'desc')
      .get();

    const photos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      photos,
    });
  } catch (error: any) {
    console.error('Get photos error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get photos' },
      { status: 500 }
    );
  }
}

// CREATE new photo entry in subcollection
export async function POST(request: NextRequest) {
  try {
    const photoData = await request.json();

    // Validate required fields
    if (!photoData.projectId || !photoData.imageUrl || !photoData.uploadedBy) {
      return NextResponse.json(
        { error: 'projectId, imageUrl, and uploadedBy are required' },
        { status: 400 }
      );
    }

    const now = new Date();

    // Create photo entry in subcollection
    const photoRef = await adminDb
      .collection('projects')
      .doc(photoData.projectId)
      .collection('photos')
      .add({
        imageUrl: photoData.imageUrl,
        thumbnailUrl: photoData.thumbnailUrl || null,
        caption: photoData.caption || null,
        uploadedBy: photoData.uploadedBy,
        uploaderName: photoData.uploaderName || 'Unknown',
        uploaderRole: photoData.uploaderRole || 'builder',
        category: photoData.category || null,
        createdAt: now.toISOString(),
      });

    return NextResponse.json({
      success: true,
      id: photoRef.id,
      photoId: photoRef.id,
      message: 'Photo uploaded successfully',
    });
  } catch (error: any) {
    console.error('Create photo error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload photo' },
      { status: 500 }
    );
  }
}

