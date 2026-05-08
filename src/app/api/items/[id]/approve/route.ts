import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// POST - Approve item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await params;
    const body = await request.json();
    const { projectId, userId } = body;

    if (!projectId || !userId) {
      return NextResponse.json(
        { error: 'projectId and userId are required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update item status to approved
    await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('items')
      .doc(itemId)
      .update({
        status: 'approved',
        approvedAt: now,
        approvedBy: userId,
        locked: true,
        updatedAt: now,
      });

    return NextResponse.json({
      success: true,
      message: 'Item approved successfully',
    });
  } catch (error: any) {
    console.error('Approve item error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to approve item' },
      { status: 500 }
    );
  }
}
