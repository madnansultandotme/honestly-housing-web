import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isAdminInitialized } from '@/lib/firebase/admin';
import { syncProjectQuestionnaire } from '@/lib/questionnaire/projectQuestionnaire';

export async function GET(request: NextRequest) {
  try {
    if (!isAdminInitialized()) {
      return NextResponse.json({ error: 'Firebase Admin is not initialized' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const questionnaire = await syncProjectQuestionnaire(projectId);

    return NextResponse.json({
      success: true,
      questionnaire: {
        projectId,
        version: questionnaire.version,
        categories: questionnaire.categories,
      },
    });
  } catch (error: any) {
    console.error('Get questionnaire error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load questionnaire' },
      { status: 500 }
    );
  }
}
