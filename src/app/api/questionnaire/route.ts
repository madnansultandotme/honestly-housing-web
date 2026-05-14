import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isAdminInitialized } from '@/lib/firebase/admin';
import { DEFAULT_QUESTIONNAIRE } from '@/lib/questionnaire/defaultQuestionnaire';

async function seedProjectQuestionnaire(projectId: string) {
  const categoriesRef = adminDb
    .collection('projects')
    .doc(projectId)
    .collection('questionnaireCategories');

  const existing = await categoriesRef.limit(1).get();
  if (!existing.empty) return;

  const now = new Date().toISOString();

  // Batch writes (Firestore limit is 500 per batch)
  let batch = adminDb.batch();
  let writesInBatch = 0;

  const commitIfNeeded = async () => {
    if (writesInBatch === 0) return;
    await batch.commit();
    batch = adminDb.batch();
    writesInBatch = 0;
  };

  for (const category of DEFAULT_QUESTIONNAIRE.categories) {
    const categoryDoc = categoriesRef.doc(category.slug);

    batch.set(categoryDoc, {
      name: category.categoryName,
      slug: category.slug,
      order: category.order,
      version: DEFAULT_QUESTIONNAIRE.version,
      createdAt: now,
      updatedAt: now,
    });
    writesInBatch += 1;

    for (const question of category.questions) {
      const questionDoc = categoryDoc.collection('questions').doc(question.questionId);
      batch.set(questionDoc, {
        questionId: question.questionId,
        question: question.question,
        answerType: question.answerType,
        options: question.options,
        conditionalLogic: question.conditionalLogic ?? null,
        notes: question.notes ?? null,
        order: question.order,
        categorySlug: category.slug,
        categoryName: category.categoryName,
        createdAt: now,
        updatedAt: now,
      });
      writesInBatch += 1;

      if (writesInBatch >= 450) {
        await commitIfNeeded();
      }
    }

    if (writesInBatch >= 450) {
      await commitIfNeeded();
    }
  }

  await commitIfNeeded();
}

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

    await seedProjectQuestionnaire(projectId);

    const categoriesSnapshot = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('questionnaireCategories')
      .orderBy('order', 'asc')
      .get();

    const categories = await Promise.all(
      categoriesSnapshot.docs.map(async (catDoc) => {
        const catData = catDoc.data();

        const questionsSnapshot = await catDoc.ref
          .collection('questions')
          .orderBy('order', 'asc')
          .get();

        const questions = questionsSnapshot.docs.map((qDoc) => ({
          id: qDoc.id,
          ...qDoc.data(),
        }));

        return {
          id: catDoc.id,
          ...catData,
          questions,
        };
      })
    );

    return NextResponse.json({
      success: true,
      questionnaire: {
        projectId,
        version: DEFAULT_QUESTIONNAIRE.version,
        categories,
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
