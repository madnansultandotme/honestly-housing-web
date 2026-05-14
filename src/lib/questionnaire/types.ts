export type QuestionnaireAnswerType =
  | 'dropdown'
  | 'yesno'
  | 'multiSelect'
  | 'text'
  | 'number'
  | 'imageSelect'
  | 'textImage'
  | 'unknown';

export interface QuestionnaireQuestion {
  questionId: string;
  question: string;
  answerType: QuestionnaireAnswerType;
  options: string[];
  required?: boolean;
  conditionalLogic?: string | null;
  notes?: string | null;
  categorySlug: string;
  categoryName: string;
  order: number;
}

export interface QuestionnaireCategory {
  categoryName: string;
  slug: string;
  order: number;
  questions: QuestionnaireQuestion[];
}

export interface QuestionnaireDefinition {
  version: number;
  categories: QuestionnaireCategory[];
}

export type QuestionnaireAnswerValue = string | string[] | number | boolean | null;

export interface QuestionnaireAnswer {
  questionId: string;
  value: QuestionnaireAnswerValue;
  customText?: string | null;
  imageUrl?: string | null;
  updatedAt: string;
}

export interface QuestionnaireSubmission {
  projectId: string;
  clientId: string;
  status: 'inProgress' | 'completed';
  startedAt: string;
  updatedAt: string;
  completedAt?: string | null;
  answeredCount: number;
  totalCount: number;
  percentComplete: number;
  requiredQuestionIds?: string[];
}
