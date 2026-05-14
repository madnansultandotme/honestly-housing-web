'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ClientHeader from '@/components/navigation/ClientHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import { LoadingOverlay } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';
import { uploadFile } from '@/lib/api/upload';

type Condition = {
  dependsOnId: string;
  op: 'equals' | 'includes';
  value: string;
};

type AnswerState = {
  value: any;
  customText?: string | null;
  imageUrl?: string | null;
};

function parseConditionalLogicText(text: string) {
  const trimmed = text.trim();

  // Show only if EX1 includes Brick
  const includesMatch = /^show only if\s+(\w+)\s+includes\s+(.+)$/i.exec(trimmed);
  if (includesMatch) {
    return {
      type: 'condition' as const,
      condition: {
        dependsOnId: includesMatch[1],
        op: 'includes' as const,
        value: includesMatch[2].trim(),
      },
    };
  }

  // Show only if RF1 = Shingle
  const equalsMatch = /^show only if\s+(\w+)\s*=\s*(.+)$/i.exec(trimmed);
  if (equalsMatch) {
    return {
      type: 'condition' as const,
      condition: {
        dependsOnId: equalsMatch[1],
        op: 'equals' as const,
        value: equalsMatch[2].trim(),
      },
    };
  }

  // If Yes, ID5  OR if Yes SW4
  const ifYesMatch = /^if\s+yes,?\s*(\w+)$/i.exec(trimmed);
  if (ifYesMatch) {
    return {
      type: 'followUpIfYes' as const,
      followUpQuestionId: ifYesMatch[1],
    };
  }

  return { type: 'unknown' as const };
}

function isNonEmpty(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export default function QuestionnairePage() {
  const { id: projectId } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, profile, profileLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [questionnaire, setQuestionnaire] = useState<any | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const debouncedSaveTimer = useRef<any>(null);

  useEffect(() => {
    if (!user) {
      router.replace(`/login?redirect=/projects/${projectId}/questionnaire`);
      return;
    }

    if (profileLoading) return;

    // Only gate clients/homeowners here
    const role = profile?.role;
    if (role && role !== 'client' && role !== 'homeowner') {
      router.replace('/builder');
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const q = await apiClient.get(`/questionnaire?projectId=${projectId}`);
        setQuestionnaire(q);

        const submission = await apiClient.get(
          `/questionnaire/submission?projectId=${projectId}&clientId=${user.uid}`
        );

        const initialAnswers: Record<string, AnswerState> = {};
        const submissionAnswers = submission?.answers || {};
        Object.keys(submissionAnswers).forEach((qid) => {
          initialAnswers[qid] = {
            value: submissionAnswers[qid]?.value ?? null,
            customText: submissionAnswers[qid]?.customText ?? null,
            imageUrl: submissionAnswers[qid]?.imageUrl ?? null,
          };
        });
        setAnswers(initialAnswers);
      } catch (e: any) {
        console.error('Failed to load questionnaire:', e);
        setError(e.message || 'Failed to load questionnaire');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, profileLoading, profile?.role, projectId, router]);

  const allQuestions = useMemo(() => {
    if (!questionnaire?.categories) return [];
    const result: any[] = [];
    questionnaire.categories.forEach((cat: any) => {
      (cat.questions || []).forEach((q: any) => {
        result.push({
          ...q,
          categoryName: cat.name || cat.categoryName || cat.slug,
          categorySlug: cat.slug,
        });
      });
    });
    return result;
  }, [questionnaire]);

  const conditionsByQuestionId = useMemo(() => {
    const map: Record<string, Condition[]> = {};
    const add = (targetId: string, condition: Condition) => {
      map[targetId] = map[targetId] || [];
      map[targetId].push(condition);
    };

    allQuestions.forEach((q) => {
      const text = q.conditionalLogic;
      if (!text || typeof text !== 'string') return;

      const parsed = parseConditionalLogicText(text);

      if (parsed.type === 'condition') {
        add(String(q.questionId), parsed.condition);
      } else if (parsed.type === 'followUpIfYes') {
        add(String(parsed.followUpQuestionId), {
          dependsOnId: String(q.questionId),
          op: 'equals',
          value: 'Yes',
        });
      }
    });

    return map;
  }, [allQuestions]);

  const visibleQuestions = useMemo(() => {
    const isVisible = (questionId: string) => {
      const conditions = conditionsByQuestionId[questionId] || [];
      return conditions.every((c) => {
        const dep = answers[c.dependsOnId]?.value;
        if (c.op === 'equals') {
          return String(dep ?? '') === c.value;
        }
        if (c.op === 'includes') {
          if (Array.isArray(dep)) return dep.includes(c.value);
          return String(dep ?? '') === c.value;
        }
        return true;
      });
    };

    const filtered = allQuestions.filter((q) => isVisible(String(q.questionId)));
    // Keep stable ordering (category order is already applied server-side)
    return filtered;
  }, [allQuestions, answers, conditionsByQuestionId]);

  useEffect(() => {
    if (currentIndex >= visibleQuestions.length) {
      setCurrentIndex(Math.max(0, visibleQuestions.length - 1));
    }
  }, [visibleQuestions.length, currentIndex]);

  const progress = useMemo(() => {
    const total = visibleQuestions.length;
    const answered = visibleQuestions.filter((q) => {
      const a = answers[String(q.questionId)];
      return isNonEmpty(a?.value) || isNonEmpty(a?.customText) || isNonEmpty(a?.imageUrl);
    }).length;

    const percent = Math.round((answered / Math.max(1, total)) * 100);
    return { total, answered, percent };
  }, [visibleQuestions, answers]);

  const currentQuestion = visibleQuestions[currentIndex];

  const saveAnswer = async (
    questionId: string,
    next: AnswerState,
    mode: 'immediate' | 'debounced' = 'immediate'
  ) => {
    setSaveError(null);

    const run = async () => {
      try {
        setSaving(true);
        await apiClient.post('/questionnaire/answers', {
          projectId,
          clientId: user?.uid,
          questionId,
          value: next.value ?? null,
          customText: next.customText ?? null,
          imageUrl: next.imageUrl ?? null,
        });
      } catch (e: any) {
        console.error('Failed to save answer:', e);
        setSaveError(e.message || 'Failed to save answer');
      } finally {
        setSaving(false);
      }
    };

    if (mode === 'debounced') {
      if (debouncedSaveTimer.current) clearTimeout(debouncedSaveTimer.current);
      debouncedSaveTimer.current = setTimeout(run, 500);
    } else {
      await run();
    }
  };

  const setAnswer = async (
    questionId: string,
    patch: Partial<AnswerState>,
    saveMode: 'immediate' | 'debounced' = 'immediate'
  ) => {
    let computed: AnswerState | null = null;
    setAnswers((prev) => {
      computed = {
        value: prev[questionId]?.value ?? null,
        customText: prev[questionId]?.customText ?? null,
        imageUrl: prev[questionId]?.imageUrl ?? null,
        ...patch,
      };

      return {
        ...prev,
        [questionId]: computed,
      };
    });

    if (computed) {
      await saveAnswer(questionId, computed, saveMode);
    }
  };

  const handleUpload = async (questionId: string, file: File) => {
    try {
      setSaveError(null);
      setSaving(true);

      if (!user) throw new Error('Not signed in');

      const timestamp = Date.now();
      const path = `questionnaire/${projectId}/${user.uid}/${questionId}/${timestamp}_${file.name}`;
      const imageUrl = await uploadFile(file, path);

      await setAnswer(questionId, { imageUrl }, 'immediate');
    } catch (e: any) {
      console.error('Upload failed:', e);
      setSaveError(e.message || 'Upload failed');
    } finally {
      setSaving(false);
    }
  };

  const canGoNext = () => {
    if (!currentQuestion) return false;
    const a = answers[String(currentQuestion.questionId)];

    // Require an answer for the current visible question
    return isNonEmpty(a?.value) || isNonEmpty(a?.customText) || isNonEmpty(a?.imageUrl);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setSaveError(null);

      const requiredQuestionIds = visibleQuestions.map((q) => String(q.questionId));
      await apiClient.post('/questionnaire/complete', {
        projectId,
        clientId: user?.uid,
        requiredQuestionIds,
      });

      router.replace('/client');
    } catch (e: any) {
      console.error('Failed to submit questionnaire:', e);
      setSaveError(e.message || 'Failed to submit questionnaire');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingOverlay fullScreen message="Loading questionnaire..." />;
  }

  if (error || !questionnaire) {
    return (
      <div className="min-h-screen bg-taupe-50">
        <ClientHeader />
        <main className="max-w-3xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <Card className="p-6">
            <div className="text-lg font-semibold text-neutral-900 mb-2">Questionnaire</div>
            <div className="text-neutral-600 mb-4">{error || 'Unable to load questionnaire.'}</div>
            <Button onClick={() => router.refresh()}>Try Again</Button>
          </Card>
        </main>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-taupe-50">
        <ClientHeader />
        <main className="max-w-3xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <Card className="p-6">
            <div className="text-lg font-semibold text-neutral-900 mb-2">Questionnaire</div>
            <div className="text-neutral-600 mb-4">No questions available.</div>
            <Button onClick={() => router.replace('/client')}>Back to Dashboard</Button>
          </Card>
        </main>
      </div>
    );
  }

  const qid = String(currentQuestion.questionId);
  const a = answers[qid] || { value: null, customText: null, imageUrl: null };
  const answerType = String(currentQuestion.answerType || '').toLowerCase();
  const options: string[] = Array.isArray(currentQuestion.options) ? currentQuestion.options : [];

  const showCustomText =
    answerType === 'textimage' ||
    answerType === 'imageselect' ||
    answerType === 'text' ||
    answerType === 'unknown' ||
    options.length === 0 ||
    String(a.value) === 'Custom';

  return (
    <div className="min-h-screen bg-taupe-50">
      <ClientHeader />

      <main className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-neutral-500">Project Questionnaire</div>
              <div className="text-2xl font-display font-bold text-neutral-900">{currentQuestion.categoryName}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-neutral-600">Progress</div>
              <div className="text-sm font-semibold text-neutral-900">
                {progress.answered} / {progress.total}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <ProgressBar total={progress.total} completed={progress.answered} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-neutral-500 mb-2">
            Question {currentIndex + 1} of {visibleQuestions.length}
          </div>
          <div className="text-xl font-semibold text-neutral-900 mb-4">{currentQuestion.question}</div>

          {saveError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-button text-sm">
              {saveError}
            </div>
          )}

          {/* Answer Inputs */}
          {answerType === 'dropdown' && options.length > 0 && (
            <div className="space-y-3">
              <select
                value={typeof a.value === 'string' ? a.value : ''}
                onChange={(e) => setAnswer(qid, { value: e.target.value }, 'immediate')}
                className="w-full px-4 py-3 border border-neutral-300 rounded-button bg-white text-neutral-900"
              >
                <option value="" disabled>
                  Select an option...
                </option>
                {options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )}

          {answerType === 'yesno' && (
            <div className="flex gap-3">
              {['Yes', 'No'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAnswer(qid, { value: opt }, 'immediate')}
                  className={`px-4 py-2 rounded-button border text-sm font-medium transition-colors ${
                    a.value === opt
                      ? 'bg-brass-600 text-white border-brass-600'
                      : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {answerType === 'multiselect' && (
            <div className="space-y-2">
              {options.map((opt) => {
                const current: string[] = Array.isArray(a.value) ? a.value : [];
                const checked = current.includes(opt);

                return (
                  <label key={opt} className="flex items-center gap-3 text-neutral-800">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...current, opt]
                          : current.filter((x) => x !== opt);
                        setAnswer(qid, { value: next }, 'immediate');
                      }}
                      className="h-4 w-4"
                    />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
          )}

          {(answerType === 'text' || answerType === 'unknown' || options.length === 0) && (
            <div className="space-y-3">
              <input
                type="text"
                value={typeof a.value === 'string' ? a.value : ''}
                onChange={(e) => setAnswer(qid, { value: e.target.value }, 'debounced')}
                placeholder="Type your answer..."
                className="w-full px-4 py-3 border border-neutral-300 rounded-button bg-white text-neutral-900"
              />
            </div>
          )}

          {answerType === 'number' && (
            <div className="space-y-3">
              <input
                type="number"
                value={typeof a.value === 'number' ? a.value : a.value ? Number(a.value) : ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setAnswer(qid, { value: v === '' ? null : Number(v) }, 'debounced');
                }}
                placeholder="Enter a number..."
                className="w-full px-4 py-3 border border-neutral-300 rounded-button bg-white text-neutral-900"
              />
            </div>
          )}

          {(answerType === 'imageselect' || answerType === 'textimage' || showCustomText) && (
            <div className="mt-4 space-y-3">
              {showCustomText && !(answerType === 'text' || answerType === 'unknown' || options.length === 0) && (
                <input
                  type="text"
                  value={typeof a.customText === 'string' ? a.customText : ''}
                  onChange={(e) => setAnswer(qid, { customText: e.target.value }, 'debounced')}
                  placeholder="Not listed? Type your choice..."
                  className="w-full px-4 py-3 border border-neutral-300 rounded-button bg-white text-neutral-900"
                />
              )}

              {(answerType === 'imageselect' || answerType === 'textimage' || answerType === 'unknown') && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Upload an image (optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(qid, file);
                    }}
                    className="w-full"
                  />
                  {a.imageUrl && (
                    <div className="mt-3">
                      <img
                        src={a.imageUrl}
                        alt="Uploaded"
                        className="w-full max-w-sm rounded-card border border-neutral-200"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0 || saving}
            >
              Previous
            </Button>

            <div className="flex items-center gap-3">
              {saving && <div className="text-sm text-neutral-500">Saving…</div>}

              {currentIndex < visibleQuestions.length - 1 ? (
                <Button
                  onClick={() => {
                    if (!canGoNext()) {
                      setSaveError('Please answer this question before continuing.');
                      return;
                    }
                    setCurrentIndex((i) => Math.min(visibleQuestions.length - 1, i + 1));
                  }}
                  disabled={saving}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    if (!canGoNext()) {
                      setSaveError('Please answer this question before submitting.');
                      return;
                    }
                    handleSubmit();
                  }}
                  disabled={saving}
                >
                  Submit
                </Button>
              )}
            </div>
          </div>
        </Card>

        <div className="text-xs text-neutral-500">
          Your answers are saved automatically.
        </div>
      </main>
    </div>
  );
}
