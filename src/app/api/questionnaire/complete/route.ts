import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isAdminInitialized } from '@/lib/firebase/admin';
import { getDefaultQuestionCount } from '@/lib/questionnaire/defaultQuestionnaire';

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
    const { projectId, clientId, requiredQuestionIds } = body ?? {};

    if (!projectId || !clientId) {
      return NextResponse.json(
        { error: 'projectId and clientId are required' },
        { status: 400 }
      );
    }

    const requiredIds: string[] = Array.isArray(requiredQuestionIds)
      ? requiredQuestionIds.map((x) => String(x))
      : [];

    if (requiredIds.length === 0) {
      return NextResponse.json(
        { error: 'requiredQuestionIds must be a non-empty array' },
        { status: 400 }
      );
    }

    const submissionRef = adminDb
      .collection('projects')
      .doc(projectId)
      .collection('questionnaireSubmissions')
      .doc(clientId);

    const submissionSnap = await submissionRef.get();
    if (submissionSnap.exists && submissionSnap.data()?.status === 'completed') {
      return NextResponse.json(
        { success: true, questionnaireSubmission: { submission: { id: submissionSnap.id, ...submissionSnap.data() } } },
        { status: 200 }
      );
    }

    const answerRefs = requiredIds.map((qid) => submissionRef.collection('answers').doc(qid));
    const answerSnaps = await adminDb.getAll(...answerRefs);

    const missing: string[] = [];
    answerSnaps.forEach((snap, idx) => {
      if (!snap.exists || !isNonEmptyAnswer(snap.data()?.value)) {
        missing.push(requiredIds[idx]);
      }
    });

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing answers for: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const totalCount = getDefaultQuestionCount();

    const answersSnap = await submissionRef.collection('answers').get();
    const answeredCount = answersSnap.docs.filter((d) => isNonEmptyAnswer(d.data()?.value)).length;
    const percentComplete = Math.round((answeredCount / Math.max(1, totalCount)) * 100);

    await submissionRef.set(
      {
        projectId,
        clientId,
        status: 'completed',
        updatedAt: now,
        completedAt: now,
        requiredQuestionIds: requiredIds,
        answeredCount,
        totalCount,
        percentComplete,
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
    console.error('Complete questionnaire error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete submission' },
      { status: 500 }
    );
  }
}
