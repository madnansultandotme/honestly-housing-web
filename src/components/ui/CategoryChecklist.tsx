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
}

export default function CategoryChecklist({
  categories,
  onToggleRequired,
  builderMode = false,
  showProgress = true,
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

        return (
          <div
            key={category.id}
            className="flex items-center justify-between p-3 bg-white border border-neutral-200 rounded-button hover:border-neutral-300 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
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
              <div className="flex-1">
                <div className="font-medium text-neutral-900">{category.name}</div>
                {showProgress && (
                  <div className="text-sm text-neutral-600">
                    {category.completedCount} of {category.totalCount} completed
                    {percent > 0 && ` (${percent}%)`}
                  </div>
                )}
              </div>
            </div>

            {/* Status Badge */}
            {showProgress && (
              <div className="flex items-center gap-2">
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
        );
      })}
    </div>
  );
}
