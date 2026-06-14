'use client';

export interface CategoryItem {
  id: string;
  name: string;
  required: boolean;
  completedCount: number;
  totalCount: number;
}

interface CategoryChecklistProps {
  categories: CategoryItem[];
  onToggleRequired?: (categoryId: string, required: boolean) => void;
  builderMode?: boolean;
  showProgress?: boolean;
  scopeOfWorks?: Record<string, string>;
  onScopeChange?: (categoryId: string, text: string) => void;
}

export default function CategoryChecklist({
  categories,
  onToggleRequired,
  builderMode = false,
  showProgress = true,
  scopeOfWorks = {},
  onScopeChange,
}: CategoryChecklistProps) {
  const handleToggle = (categoryId: string) => {
    if (!builderMode || !onToggleRequired) return;

    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;

    const newRequired = !category.required;
    onToggleRequired(categoryId, newRequired);
  };

  const getCompletionPercent = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  return (
    <div className="space-y-2">
      {categories.map((category) => {
        const percent = getCompletionPercent(category.completedCount, category.totalCount);
        const isComplete = category.completedCount === category.totalCount && category.totalCount > 0;
        const scopeValue = scopeOfWorks[category.id] || '';
        const scopeRequired = category.required;
        const isMissingScope = builderMode && scopeRequired && scopeValue.trim().length === 0;

        return (
          <div key={category.id}>
            <div
              className="flex flex-col gap-3 p-3 bg-white border border-neutral-200 rounded-button hover:border-neutral-300 transition-colors sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => handleToggle(category.id)}
                  disabled={!builderMode}
                  className={`
                    w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                    ${
                      category.required
                        ? 'bg-brass-600 border-brass-600'
                        : 'bg-taupe-100 border-neutral-300'
                    }
                    ${builderMode ? 'cursor-pointer hover:border-brass-500' : 'cursor-default'}
                  `}
                >
                  {category.required && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>

                {/* Category Name */}
                <div className="min-w-0 flex-1">
                  <div className="break-words font-medium text-neutral-900">{category.name}</div>
                  {showProgress && (
                    <div className="text-sm text-neutral-600">
                      {category.completedCount} of {category.totalCount} completed
                      {percent > 0 && ` (${percent}%)`}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                {/* Status Badge */}
                {showProgress && (
                  <div>
                    {isComplete ? (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                        Complete
                      </span>
                    ) : category.completedCount > 0 ? (
                      <span className="text-xs bg-brass-100 text-brass-800 px-2 py-1 rounded-full font-medium">
                        In Progress
                      </span>
                    ) : (
                      <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded-full font-medium">
                        Not Started
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Scope of Work Textarea */}
            {builderMode && onScopeChange && (
              <div className="mt-2 sm:ml-4 sm:mr-4">
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Scope of Work{scopeRequired ? ' *' : ''}
                </label>
                <textarea
                  value={scopeValue}
                  onChange={(e) => onScopeChange(category.id, e.target.value)}
                  placeholder={`Describe the scope of work for ${category.name}...`}
                  rows={3}
                  className={`w-full px-3 py-2 text-sm border rounded-button focus:outline-none focus:ring-2 bg-brass-50 ${
                    isMissingScope
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-brass-200 focus:ring-brass-500'
                  }`}
                  required={scopeRequired}
                />
                {isMissingScope && (
                  <div className="mt-1 text-xs text-red-600">
                    Scope of work is required for required categories.
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
