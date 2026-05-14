import raw from './builder_questionnaire_structure.json';
import type {
  QuestionnaireAnswerType,
  QuestionnaireCategory,
  QuestionnaireDefinition,
  QuestionnaireQuestion,
} from './types';

function normalizeAnswerType(input: unknown): QuestionnaireAnswerType {
  const value = String(input ?? '').trim().toLowerCase();

  if (value === 'dropdown') return 'dropdown';
  if (value === 'yes/no' || value === 'yesno' || value === 'yes-no' || value === 'yes/no ') return 'yesno';
  if (value === 'multi select' || value === 'multiselect') return 'multiSelect';
  if (value === 'multi dropdown' || value === 'multidropdown') return 'multiSelect';
  if (value === 'text') return 'text';
  if (value === 'number') return 'number';

  const hasImage = value.includes('image');
  const hasText = value.includes('text');
  const hasSelect = value.includes('select');

  if (hasImage && hasText) return 'textImage';
  if (hasImage && hasSelect) return 'imageSelect';
  if (hasImage) return 'textImage';

  return 'unknown';
}

function asStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((x) => String(x ?? '').trim())
    .filter((x) => x.length > 0);
}

export const DEFAULT_QUESTIONNAIRE: QuestionnaireDefinition = {
  version: 1,
  categories: (raw as any).categories
    .map((category: any, categoryIndex: number): QuestionnaireCategory => {
      const slug = String(category.slug ?? '').trim();
      const categoryName = String(category.categoryName ?? '').trim();

      const questions: QuestionnaireQuestion[] = (category.questions ?? [])
        .map((q: any, questionIndex: number): QuestionnaireQuestion | null => {
          const questionId = String(q.questionId ?? '').trim();
          const question = String(q.question ?? '').trim();

          if (!questionId || !question) return null;

          return {
            questionId,
            question,
            answerType: normalizeAnswerType(q.answerType),
            options: asStringArray(q.options),
            conditionalLogic: q.conditionalLogic ?? null,
            notes: q.notes ?? null,
            categorySlug: slug,
            categoryName,
            order: questionIndex,
          };
        })
        .filter(Boolean) as QuestionnaireQuestion[];

      return {
        categoryName,
        slug,
        order: categoryIndex,
        questions,
      };
    })
    .filter((c: QuestionnaireCategory) => c.slug && c.categoryName),
};

export function getDefaultQuestionCount(): number {
  return DEFAULT_QUESTIONNAIRE.categories.reduce((sum, c) => sum + c.questions.length, 0);
}

export function findQuestionById(questionId: string): QuestionnaireQuestion | undefined {
  for (const category of DEFAULT_QUESTIONNAIRE.categories) {
    const found = category.questions.find((q) => q.questionId === questionId);
    if (found) return found;
  }
  return undefined;
}
