import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

// GET user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // Get user from Firestore
    const userDoc = await adminDb.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userDoc.id,
        ...userDoc.data(),
      },
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get user' },
      { status: 500 }
    );
  }
}

// UPDATE user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const updates = await request.json();

    // Update user in Firestore
    await adminDb.collection('users').doc(userId).update({
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    // Only update Firebase Auth email if it changed (not displayName)
    // displayName is managed in Firestore only
    if (updates.email) {
      await adminAuth.updateUser(userId, {
        email: updates.email,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // Delete from Firebase Auth
    await adminAuth.deleteUser(userId);

    // Delete from Firestore
    await adminDb.collection('users').doc(userId).delete();

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}
