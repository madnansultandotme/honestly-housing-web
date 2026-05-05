import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const messagesSnapshot = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const messages = messagesSnapshot.docs.map(doc => ({
      id: doc.id,
      projectId, // Include projectId for isolation verification
      ...doc.data(),
    }));

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, senderId, senderName, senderRole, text, attachments } = body;

    if (!projectId || !senderId || !senderName || !senderRole || !text) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const messageData = {
      senderId,
      senderName,
      senderRole,
      text,
      attachments: attachments || [],
      readBy: [senderId],
      createdAt: new Date().toISOString(),
    };

    const messageRef = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('messages')
      .add(messageData);

    return NextResponse.json({
      message: {
        id: messageRef.id,
        ...messageData,
      },
    });
  } catch (error) {
    console.error('Create message error:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}
