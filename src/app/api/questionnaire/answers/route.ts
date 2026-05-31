import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isAdminInitialized } from '@/lib/firebase/admin';

function isNonEmptyAnswer(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    if (!isAdminInitialized()) {
      return NextResponse.json({ error: 'Firebase Admin is not initialized' }, { status: 500 });
    }

    const body = await request.json();
    const { projectId, clientId, questionId, value, customText, imageUrl } = body ?? {};

    if (!projectId || !clientId || !questionId) {
      return NextResponse.json(
        { error: 'projectId, clientId, and questionId are required' },
        { status: 400 }
      );
    }

    const submissionRef = adminDb
      .collection('projects')
      .doc(projectId)
      .collection('questionnaireSubmissions')
      .doc(clientId);

    const answerRef = submissionRef.collection('answers').doc(String(questionId));

    const now = new Date().toISOString();

    const submissionSnap = await submissionRef.get();
    if (!submissionSnap.exists) {
      await submissionRef.set({
        projectId,
        clientId,
        status: 'inProgress',
        startedAt: now,
        updatedAt: now,
        completedAt: null,
        answeredCount: 0,
        totalCount: 0,
        percentComplete: 0,
      });
    } else {
      // If already completed, don't allow edits
      const status = submissionSnap.data()?.status;
      if (status === 'completed') {
        return NextResponse.json(
          { error: 'Submission is already completed and cannot be edited' },
          { status: 409 }
        );
      }
    }

    await answerRef.set(
      {
        questionId: String(questionId),
        value: value ?? null,
        customText: customText ?? null,
        imageUrl: imageUrl ?? null,
        updatedAt: now,
      },
      { merge: true }
    );

    await submissionRef.set(
      {
        updatedAt: now,
        status: 'inProgress',
      },
      { merge: true }
    );

    const updated = await submissionRef.get();

    return NextResponse.json({
      success: true,
      questionnaireSubmission: {
        submission: { id: updated.id, ...updated.data() },
      },
    });
  } catch (error: any) {
    console.error('Save questionnaire answer error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save answer' },
      { status: 500 }
    );
  }
}
