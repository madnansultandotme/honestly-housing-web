'use client';

import { use, useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import Link from 'next/link';

export default function DueDatesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [selections, setSelections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSelections();
  }, [id]);

  const fetchSelections = async () => {
    try {
      const response = await fetch(`/api/selections?projectId=${id}`);
      const data = await response.json();
      setSelections(data.selections || []);
    } catch (error) {
      console.error('Error fetching selections:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupByDate = () => {
    const grouped: { [key: string]: any[] } = {};
    
    selections
      .filter(s => s.dueDate)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .forEach(selection => {
        const date = new Date(selection.dueDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(selection);
      });
    
    return grouped;
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getDaysUntil = (dueDate: string) => {
    const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading due dates...</p>
      </div>
    );
  }

  const groupedSelections = groupByDate();

  return (
    <div className="min-h-screen bg-taupe-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href={`/projects/${id}`} className="text-brass-700 hover:text-brass-800 mb-4 inline-block">
            ← Back to Project
          </Link>
          <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
            Due Dates
          </h1>
          <p className="text-neutral-600">
            Chronological list of upcoming selection due dates
          </p>
        </div>

        {Object.keys(groupedSelections).length === 0 ? (
          <Card>
            <p className="text-center text-neutral-500 py-8">
              No due dates set for selections yet
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSelections).map(([date, items]) => (
              <Card key={date}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900">{date}</h3>
                  <span className="text-sm text-neutral-600">{items.length} items</span>
                </div>
                
                <div className="space-y-3">
                  {items.map((selection) => {
                    const daysUntil = getDaysUntil(selection.dueDate);
                    const overdue = isOverdue(selection.dueDate);
                    
                    return (
                      <Link
                        key={selection.id}
                        href={`/projects/${id}/selections/${selection.id}`}
                        className="block"
                      >
                        <div className={`p-4 rounded-button border-2 transition-all hover:shadow-sm ${
                          overdue 
                            ? 'border-red-200 bg-red-50' 
                            : daysUntil <= 3 
                            ? 'border-brass-200 bg-brass-50' 
                            : 'border-neutral-200 bg-white'
                        }`}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-neutral-900">
                                  {selection.name}
                                </h4>
                                <StatusBadge status={selection.status} />
                              </div>
                              <div className="text-sm text-neutral-600 mb-1">
                                {selection.categoryName}
                              </div>
                              {selection.brand && (
                                <div className="text-sm text-neutral-500">
                                  {selection.brand}
                                </div>
                              )}
                            </div>
                            
                            <div className="text-right ml-4">
                              {overdue ? (
                                <div className="text-red-600 font-semibold text-sm">
                                  Overdue
                                </div>
                              ) : daysUntil === 0 ? (
                                <div className="text-brass-700 font-semibold text-sm">
                                  Due Today
                                </div>
                              ) : daysUntil === 1 ? (
                                <div className="text-brass-700 font-semibold text-sm">
                                  Due Tomorrow
                                </div>
                              ) : (
                                <div className="text-neutral-600 text-sm">
                                  {daysUntil} days
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
