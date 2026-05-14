import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isAdminInitialized } from '@/lib/firebase/admin';
import { getDefaultQuestionCount } from '@/lib/questionnaire/defaultQuestionnaire';

export async function GET(request: NextRequest) {
  try {
    if (!isAdminInitialized()) {
      return NextResponse.json({ error: 'Firebase Admin is not initialized' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const clientId = searchParams.get('clientId');

    if (!projectId || !clientId) {
      return NextResponse.json({ error: 'projectId and clientId are required' }, { status: 400 });
    }

    const submissionRef = adminDb
      .collection('projects')
      .doc(projectId)
      .collection('questionnaireSubmissions')
      .doc(clientId);

    const submissionSnap = await submissionRef.get();
    const submission = submissionSnap.exists ? ({ id: submissionSnap.id, ...submissionSnap.data() } as any) : null;

    const answersSnap = await submissionRef.collection('answers').get();
    const answers: Record<string, any> = {};
    answersSnap.docs.forEach((doc) => {
      answers[doc.id] = doc.data();
    });

    // If the submission doc doesn't exist but answers do (rare), we can return a synthesized status
    const synthesizedSubmission =
      !submission && answersSnap.size > 0
        ? {
            projectId,
            clientId,
            status: 'inProgress',
            startedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            completedAt: null,
            answeredCount: answersSnap.size,
            totalCount: getDefaultQuestionCount(),
            percentComplete: Math.round((answersSnap.size / Math.max(1, getDefaultQuestionCount())) * 100),
          }
        : null;

    return NextResponse.json({
      success: true,
      questionnaireSubmission: {
        submission: submission ?? synthesizedSubmission,
        answers,
      },
    });
  } catch (error: any) {
    console.error('Get questionnaire submission error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load submission' },
      { status: 500 }
    );
  }
}
