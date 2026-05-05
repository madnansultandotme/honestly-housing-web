interface ProgressBarProps {
  completed: number;
  total: number;
  showLabel?: boolean;
  className?: string;
}

export default function ProgressBar({ completed, total, showLabel = true, className = '' }: ProgressBarProps) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-neutral-700">
            {completed} / {total} Selections Completed
          </span>
          <span className="text-sm font-medium text-neutral-600">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div className="w-full bg-neutral-100 rounded-full h-3 overflow-hidden">
        <div
          className="bg-gradient-to-r from-brass-500 to-brass-600 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
