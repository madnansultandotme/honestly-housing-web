import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

// Generate a random password
function generateRandomPassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  const allChars = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// CREATE new client user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, displayName } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUserSnapshot = await adminDb
      .collection('users')
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get();

    if (!existingUserSnapshot.empty) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Generate random password
    const password = generateRandomPassword();

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email: normalizedEmail,
      password: password,
      displayName: displayName || normalizedEmail.split('@')[0],
    });

    // Create user profile in Firestore
    await adminDb.collection('users').doc(userRecord.uid).set({
      email: normalizedEmail,
      displayName: displayName || normalizedEmail.split('@')[0],
      role: 'client',
      hasBuilder: true, // They're being added by a builder
      createdAt: new Date().toISOString(),
      projectIds: [],
      createdBy: 'builder', // Indicates this was created by a builder
    });

    console.log('Created new client user:', userRecord.uid);

    return NextResponse.json({
      success: true,
      user: {
        uid: userRecord.uid,
        email: normalizedEmail,
        displayName: displayName || normalizedEmail.split('@')[0],
        role: 'client',
      },
      credentials: {
        email: normalizedEmail,
        password: password,
      },
    });
  } catch (error: any) {
    console.error('Create client error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create client' },
      { status: 500 }
    );
  }
}
