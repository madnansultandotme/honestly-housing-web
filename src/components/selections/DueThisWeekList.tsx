import Link from 'next/link';

interface DueItem {
  id: string;
  category: string;
  itemName: string;
  dueDate: string;
  projectId: string;
}

interface DueThisWeekListProps {
  items: DueItem[];
  className?: string;
}

export default function DueThisWeekList({ items, className = '' }: DueThisWeekListProps) {
  if (items.length === 0) {
    return (
      <div className={`text-center py-8 text-neutral-500 ${className}`}>
        No selections due this week
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/projects/${item.projectId}/selections/${item.id}`}
          className="block"
        >
          <div className="bg-white rounded-button border border-neutral-200 p-4 hover:border-brass-300 hover:shadow-sm transition-all">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="text-sm text-neutral-600 mb-1">{item.category}</div>
                <div className="font-medium text-neutral-900">{item.itemName}</div>
              </div>
              <div className="text-right ml-4">
                <div className="text-sm font-medium text-brass-700">
                  {new Date(item.dueDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="text-xs text-neutral-500">
                  {Math.ceil((new Date(item.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
