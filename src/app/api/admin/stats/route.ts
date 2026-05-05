import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    // Get total users
    const usersSnapshot = await adminDb.collection('users').get();
    const totalUsers = usersSnapshot.size;

    // Count users by role
    const usersByRole = {
      builder: 0,
      designer: 0,
      client: 0,
      admin: 0,
    };

    usersSnapshot.docs.forEach((doc) => {
      const role = doc.data().role;
      if (role in usersByRole) {
        usersByRole[role as keyof typeof usersByRole]++;
      }
    });

    // Get total projects
    const projectsSnapshot = await adminDb.collection('projects').get();
    const totalProjects = projectsSnapshot.size;

    // Count active projects
    const activeProjectsSnapshot = await adminDb
      .collection('projects')
      .where('status', '==', 'active')
      .get();
    const activeProjects = activeProjectsSnapshot.size;

    // Count total selections across all projects
    let totalSelections = 0;
    for (const projectDoc of projectsSnapshot.docs) {
      const selectionsSnapshot = await adminDb
        .collection('projects')
        .doc(projectDoc.id)
        .collection('selections')
        .get();
      totalSelections += selectionsSnapshot.size;
    }

    return NextResponse.json({
      totalUsers,
      totalProjects,
      activeProjects,
      totalSelections,
      usersByRole,
    });
  } catch (error: any) {
    console.error('Failed to get admin stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get stats' },
      { status: 500 }
    );
  }
}
