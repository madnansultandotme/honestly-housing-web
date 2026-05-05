import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messageId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const body = await request.json();
    const { userId } = body;

    if (!projectId || !userId) {
      return NextResponse.json(
        { error: 'projectId and userId are required' },
        { status: 400 }
      );
    }

    const messageRef = adminDb
      .collection('projects')
      .doc(projectId)
      .collection('messages')
      .doc(messageId);

    const messageDoc = await messageRef.get();
    if (!messageDoc.exists) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    const messageData = messageDoc.data();
    const readBy = messageData?.readBy || [];

    if (!readBy.includes(userId)) {
      await messageRef.update({
        readBy: [...readBy, userId],
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark message as read error:', error);
    return NextResponse.json(
      { error: 'Failed to mark message as read' },
      { status: 500 }
    );
  }
}
