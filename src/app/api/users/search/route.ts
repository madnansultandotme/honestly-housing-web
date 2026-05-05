import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// SEARCH users by email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'email parameter is required' },
        { status: 400 }
      );
    }

    // Normalize email to lowercase for consistent searching
    const normalizedEmail = email.toLowerCase().trim();

    // Search for users with matching email
    const snapshot = await adminDb
      .collection('users')
      .where('email', '==', normalizedEmail)
      .limit(10)
      .get();

    if (snapshot.empty) {
      // If no exact match, try to get all users and filter (for development/debugging)
      // In production, you should have proper indexes
      console.log('No users found with email:', normalizedEmail);
      return NextResponse.json({
        success: true,
        users: [],
        message: 'No users found with that email',
      });
    }

    const users = snapshot.docs.map((doc) => ({
      uid: doc.id,
      id: doc.id, // Include both uid and id for compatibility
      ...doc.data(),
    }));

    console.log('Found users:', users.length);

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error: any) {
    console.error('Search users error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search users' },
      { status: 500 }
    );
  }
}
