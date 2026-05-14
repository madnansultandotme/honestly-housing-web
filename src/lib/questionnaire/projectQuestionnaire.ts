import { adminDb } from '@/lib/firebase/admin';
import { DEFAULT_QUESTIONNAIRE } from '@/lib/questionnaire/defaultQuestionnaire';
import type {
  QuestionnaireCategory,
  QuestionnaireDefinition,
  QuestionnaireAnswerType,
  QuestionnaireQuestion,
} from '@/lib/questionnaire/types';

type ProjectCategory = {
  id: string;
  name: string;
  displayOrder?: number;
  required?: boolean;
  scopeOfWork?: string | null;
};

const normalizeSlug = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

type QuestionSpec = {
  suffix: string;
  question: string;
  answerType: QuestionnaireAnswerType;
  options?: string[];
  required?: boolean;
  conditionalLogic?: string | null;
  notes?: string | null;
};

const withScopeNotes = (category: ProjectCategory, notes?: string | null) =>
  category.scopeOfWork || notes || null;

const buildQuestion = (
  category: ProjectCategory,
  questionOrder: number,
  spec: QuestionSpec
): QuestionnaireQuestion => ({
  questionId: `${category.id}-${spec.suffix}`,
  question: spec.question,
  answerType: spec.answerType,
  options: spec.options || [],
  required: spec.required !== false,
  conditionalLogic: spec.conditionalLogic ?? null,
  notes: withScopeNotes(category, spec.notes),
  categorySlug: category.id,
  categoryName: category.name,
  order: questionOrder,
});

const GENERIC_CATEGORY_QUESTIONS = (category: ProjectCategory): QuestionSpec[] => [
  {
    suffix: 'preferences',
    question: `What selections or preferences do you want for ${category.name}?`,
    answerType: 'text',
    required: false,
  },
];

const CATEGORY_QUESTION_BANK: Array<{
  matches: (category: ProjectCategory) => boolean;
  questions: (category: ProjectCategory) => QuestionSpec[];
}> = [
  {
    matches: (category) => /plumb/i.test(category.name) || category.id.includes('plumb'),
    questions: () => [
      {
        suffix: 'fixture-types',
        question: 'Which plumbing fixture types are needed?',
        answerType: 'multiSelect',
        required: true,
        options: [
          'Shower Systems',
          'Free Standing Tub',
          'Alcove Tub',
          'Shower/Tub Faucets',
          'Sink Faucets',
          'Drain + Overflow',
          'Tub Filler',
          'Free Standing Tub Drain',
          'Shower Drain',
          'Other',
        ],
      },
      {
        suffix: 'finish-style',
        question: 'What finish or style should the plumbing fixtures have?',
        answerType: 'dropdown',
        required: false,
        options: ['Chrome', 'Brushed Nickel', 'Matte Black', 'Polished Nickel', 'Brass', 'Custom'],
      },
      {
        suffix: 'plumbing-notes',
        question: 'Any additional plumbing notes or special requirements?',
        answerType: 'text',
        required: false,
      },
    ],
  },
  {
    matches: (category) => /electr/i.test(category.name) || category.id.includes('light'),
    questions: () => [
      {
        suffix: 'fixture-types',
        question: 'Which electrical fixture types are needed?',
        answerType: 'multiSelect',
        required: true,
        options: [
          'Fan',
          'Down Rod',
          'Vanity Light',
          'Ceiling Light',
          'Recessed Light',
          'Chandelier',
          'Pendant Light',
          'Sconce',
          'Under Cabinet Lighting',
          'Other',
        ],
      },
      {
        suffix: 'smart-controls',
        question: 'Do you want dimmers, smart switches, or automation?',
        answerType: 'yesno',
        required: false,
        options: ['Yes', 'No'],
      },
      {
        suffix: 'electrical-notes',
        question: 'Any additional electrical notes or special requirements?',
        answerType: 'text',
        required: false,
      },
    ],
  },
  {
    matches: (category) => /countertop/i.test(category.name) || category.id.includes('countertop'),
    questions: () => [
      {
        suffix: 'material',
        question: 'Which countertop material do you want?',
        answerType: 'dropdown',
        required: true,
        options: ['Granite', 'Quartz', 'Quartzite', 'Marble', 'Custom'],
      },
      {
        suffix: 'color-pattern',
        question: 'What color or pattern direction do you prefer?',
        answerType: 'text',
        required: false,
      },
      {
        suffix: 'countertop-notes',
        question: 'Any additional countertop notes?',
        answerType: 'text',
        required: false,
      },
    ],
  },
  {
    matches: (category) => /paint/i.test(category.name) || category.id.includes('paint'),
    questions: () => [
      {
        suffix: 'paint-swatch',
        question: 'Upload a paint swatch or reference image',
        answerType: 'textImage',
        required: false,
        notes: 'Attach any inspiration image or swatch reference.',
      },
      {
        suffix: 'color-name',
        question: 'What is the paint color name?',
        answerType: 'text',
        required: false,
      },
      {
        suffix: 'paint-code',
        question: 'What is the paint code or color number?',
        answerType: 'text',
        required: false,
      },
      {
        suffix: 'sheen',
        question: 'Which sheen do you want?',
        answerType: 'dropdown',
        required: false,
        options: ['Flat', 'Matte', 'Eggshell', 'Satin', 'Semi-Gloss', 'Gloss'],
      },
      {
        suffix: 'areas',
        question: 'Where should this paint be applied?',
        answerType: 'multiSelect',
        required: false,
        options: [
          'Walls',
          'Trim',
          'Ceiling',
          'Cabinets',
          'Doors',
          'Baseboards',
          'Crown Molding',
          'Window Frames',
          'Specific Room',
        ],
      },
      {
        suffix: 'paint-notes',
        question: 'Any additional paint notes?',
        answerType: 'text',
        required: false,
      },
    ],
  },
  {
    matches: (category) => /cabinet/i.test(category.name) || category.id.includes('cabinet'),
    questions: () => [
      {
        suffix: 'areas',
        question: 'Which cabinetry areas are included?',
        answerType: 'multiSelect',
        required: true,
        options: ['Kitchen', 'Bathroom', 'Laundry', 'Mudroom', 'Office', 'Built-Ins', 'Pantry', 'Other'],
      },
      {
        suffix: 'style',
        question: 'What cabinetry style do you want?',
        answerType: 'dropdown',
        required: false,
        options: ['Shaker', 'Flat Panel', 'Inset', 'Raised Panel', 'Custom'],
      },
      {
        suffix: 'material',
        question: 'What cabinetry material or construction do you prefer?',
        answerType: 'dropdown',
        required: false,
        options: ['Painted Wood', 'Stained Wood', 'Thermofoil', 'Laminate', 'Custom'],
      },
      {
        suffix: 'finish',
        question: 'What finish do you want?',
        answerType: 'dropdown',
        required: false,
        options: ['Painted', 'Stained', 'Natural', 'Two-Tone', 'Custom'],
      },
      {
        suffix: 'cabinetry-notes',
        question: 'Any additional cabinetry notes?',
        answerType: 'text',
        required: false,
      },
    ],
  },
  {
    matches: (category) => /floor/i.test(category.name) || category.id.includes('floor'),
    questions: () => [
      {
        suffix: 'flooring-type',
        question: 'What flooring type do you want?',
        answerType: 'multiSelect',
        required: true,
        options: ['Hardwood', 'Tile', 'Carpet', 'Vinyl', 'Laminate', 'Other'],
      },
      {
        suffix: 'flooring-notes',
        question: 'Any flooring notes or special requirements?',
        answerType: 'text',
        required: false,
      },
    ],
  },
  {
    matches: (category) => /tile/i.test(category.name) || category.id.includes('tile'),
    questions: () => [
      {
        suffix: 'tile-areas',
        question: 'Where is tile needed?',
        answerType: 'multiSelect',
        required: true,
        options: ['Floor', 'Shower', 'Backsplash', 'Accent Wall', 'Fireplace', 'Other'],
      },
      {
        suffix: 'tile-style',
        question: 'What tile style or pattern do you prefer?',
        answerType: 'text',
        required: false,
      },
      {
        suffix: 'tile-notes',
        question: 'Any additional tile notes?',
        answerType: 'text',
        required: false,
      },
    ],
  },
  {
    matches: (category) => /hardware/i.test(category.name) || category.id.includes('hardware'),
    questions: () => [
      {
        suffix: 'hardware-types',
        question: 'Which hardware types are needed?',
        answerType: 'multiSelect',
        required: true,
        options: ['Door Knobs', 'Cabinet Pulls', 'Hinges', 'Towel Bars', 'Hooks', 'Other'],
      },
      {
        suffix: 'hardware-finish',
        question: 'What finish do you want?',
        answerType: 'dropdown',
        required: false,
        options: ['Chrome', 'Brushed Nickel', 'Matte Black', 'Brass', 'Custom'],
      },
      {
        suffix: 'hardware-notes',
        question: 'Any additional hardware notes?',
        answerType: 'text',
        required: false,
      },
    ],
  },
  {
    matches: (category) => /appliance/i.test(category.name) || category.id.includes('appliance'),
    questions: () => [
      {
        suffix: 'appliance-types',
        question: 'Which appliances are included?',
        answerType: 'multiSelect',
        required: true,
        options: ['Range', 'Cooktop', 'Hood', 'Dishwasher', 'Microwave', 'Refrigerator', 'Wine Fridge', 'Washer', 'Dryer', 'Other'],
      },
      {
        suffix: 'appliance-notes',
        question: 'Any appliance notes or brand preferences?',
        answerType: 'text',
        required: false,
      },
    ],
  },
];

export function buildProjectQuestionnaire(categories: ProjectCategory[]): QuestionnaireDefinition {
  const sorted = [...categories].sort((left, right) => {
    const leftOrder = typeof left.displayOrder === 'number' ? left.displayOrder : 0;
    const rightOrder = typeof right.displayOrder === 'number' ? right.displayOrder : 0;
    return leftOrder - rightOrder;
  });

  if (sorted.length === 0) {
    return DEFAULT_QUESTIONNAIRE;
  }

  return {
    version: 1,
    categories: sorted.map((category, categoryOrder): QuestionnaireCategory => {
      const matcher = CATEGORY_QUESTION_BANK.find((entry) => entry.matches(category));
      const questionSpecs = matcher ? matcher.questions(category) : GENERIC_CATEGORY_QUESTIONS(category);
      const questions = questionSpecs.map((spec, questionOrder) =>
        buildQuestion(category, questionOrder, spec)
      );

      return {
        categoryName: category.name,
        slug: category.id || normalizeSlug(category.name),
        order: categoryOrder,
        questions,
      };
    }),
  };
}

export async function loadProjectCategories(projectId: string): Promise<ProjectCategory[]> {
  const snapshot = await adminDb
    .collection('projects')
    .doc(projectId)
    .collection('categories')
    .orderBy('displayOrder', 'asc')
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    name: String(doc.data().name || '').trim(),
    displayOrder: doc.data().displayOrder,
    required: doc.data().required,
    scopeOfWork: doc.data().scopeOfWork || null,
  }));
}

export async function syncProjectQuestionnaire(projectId: string): Promise<QuestionnaireDefinition> {
  const categories = await loadProjectCategories(projectId);
  const questionnaire = buildProjectQuestionnaire(categories);

  const categoriesRef = adminDb
    .collection('projects')
    .doc(projectId)
    .collection('questionnaireCategories');

  const existing = await categoriesRef.get();
  const wantedIds = new Set(questionnaire.categories.map((category) => category.slug));
  const now = new Date().toISOString();
  let batch = adminDb.batch();
  let writes = 0;

  const commit = async () => {
    if (writes === 0) return;
    await batch.commit();
    batch = adminDb.batch();
    writes = 0;
  };

  for (const doc of existing.docs) {
    if (!wantedIds.has(doc.id)) {
      batch.delete(doc.ref);
      writes += 1;
    }
  }

  for (const category of questionnaire.categories) {
    const sourceCategory = categories.find((entry) => entry.id === category.slug);
    const categoryRef = categoriesRef.doc(category.slug);

    batch.set(
      categoryRef,
      {
        name: category.categoryName,
        slug: category.slug,
        order: category.order,
        version: questionnaire.version,
        sourceCategoryId: sourceCategory?.id || null,
        sourceCategoryName: sourceCategory?.name || category.categoryName,
        required: sourceCategory?.required !== false,
        scopeOfWork: sourceCategory?.scopeOfWork || null,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );
    writes += 1;

    const question = category.questions[0];
    batch.set(
      categoryRef.collection('questions').doc(question.questionId),
      {
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
      },
      { merge: true }
    );
    writes += 1;

    if (writes >= 400) {
      await commit();
    }
  }

  await commit();
  return questionnaire;
}

export async function getProjectQuestionCount(projectId: string): Promise<number> {
  const questionnaire = buildProjectQuestionnaire(await loadProjectCategories(projectId));
  return questionnaire.categories.reduce(
    (sum, category) => sum + category.questions.filter((question) => question.required !== false).length,
    0
  );
}
