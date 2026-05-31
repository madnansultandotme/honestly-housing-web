import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isAdminInitialized } from '@/lib/firebase/admin';
import { getProjectQuestionCount, syncProjectQuestionnaire } from '@/lib/questionnaire/projectQuestionnaire';

function isNonEmptyAnswer(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function isAnsweredAnswerDoc(data: any): boolean {
  return isNonEmptyAnswer(data?.value) || isNonEmptyAnswer(data?.customText) || isNonEmptyAnswer(data?.imageUrl);
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

    if (requiredIds.length > 0) {
      const answerRefs = requiredIds.map((qid) => submissionRef.collection('answers').doc(qid));
      const answerSnaps = await adminDb.getAll(...answerRefs);

      const missing: string[] = [];
      answerSnaps.forEach((snap, idx) => {
        if (!snap.exists || !isAnsweredAnswerDoc(snap.data())) {
          missing.push(requiredIds[idx]);
        }
      });

      if (missing.length > 0) {
        console.warn('Questionnaire complete: missing required answers', {
          requiredIds: requiredIds,
          missing,
        });

        // Log which answer docs actually exist for debugging
        try {
          const answerDocs = await submissionRef.collection('answers').get();
          const existingIds = answerDocs.docs.map((d) => d.id);
          console.warn('Existing answer doc ids:', existingIds);
        } catch (logErr) {
          console.error('Failed to list answer docs for debugging:', logErr);
        }

        // Attempt to map missing ids to question text for a friendlier error
        let missingFriendly: string[] = missing;
        try {
          const questionnaire = await syncProjectQuestionnaire(projectId);
          missingFriendly = missing.map((id) => {
            for (const cat of questionnaire.categories) {
              for (const q of cat.questions || []) {
                if (String(q.questionId) === id) return `${q.question} (${id})`;
              }
            }
            return id;
          });
        } catch (mapErr) {
          console.warn('Failed to map missing question ids to text:', mapErr);
        }

        return NextResponse.json(
          { error: `Missing answers for: ${missingFriendly.join(', ')}`, missing: missing, missingFriendly },
          { status: 400 }
        );
      }
    }

    const now = new Date().toISOString();
    const totalCount = await getProjectQuestionCount(projectId);

    const answersSnap = await submissionRef.collection('answers').get();
    const answeredCount = answersSnap.docs.filter((d) => isAnsweredAnswerDoc(d.data())).length;
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
