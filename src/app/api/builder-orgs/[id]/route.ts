import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// PATCH update builder org
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: builderOrgId } = await params;
    const updates = await request.json();

    // Use set with merge to create if doesn't exist, or update if it does
    await adminDb.collection('builderOrgs').doc(builderOrgId).set({
      ...updates,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    return NextResponse.json({
      success: true,
      message: 'Builder org updated successfully',
    });
  } catch (error: any) {
    console.error('Update builder org error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update builder org' },
      { status: 500 }
    );
  }
}
