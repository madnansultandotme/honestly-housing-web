import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// GET documents for a project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const snapshot = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('documents')
      .orderBy('createdAt', 'desc')
      .get();

    const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(Array.isArray(docs) ? docs : []);
  } catch (error: any) {
    console.error('Get documents error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get documents' }, { status: 500 });
  }
}

// CREATE new document metadata
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { projectId, name, url, mimeType, createdBy } = data;

    if (!projectId || !name || !url) {
      return NextResponse.json(
        { error: 'projectId, name and url are required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const docRef = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('documents')
      .add({
        name,
        url,
        mimeType: mimeType || null,
        createdBy: createdBy || null,
        createdAt: now,
        updatedAt: now,
      });

    return NextResponse.json({ success: true, id: docRef.id, documentId: docRef.id });
  } catch (error: any) {
    console.error('Create document error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create document' }, { status: 500 });
  }
}

// DELETE document metadata
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const documentId = searchParams.get('documentId');

    if (!projectId || !documentId) {
      return NextResponse.json(
        { error: 'projectId and documentId are required' },
        { status: 400 }
      );
    }

    await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('documents')
      .doc(documentId)
      .delete();

    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (error: any) {
    console.error('Delete document error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete document' }, { status: 500 });
  }
}
