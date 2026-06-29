'use client';

import { useState } from 'react';
import { HierarchicalBudgetCategory, calculateCategoryTotal } from '@/lib/constants/hierarchical-budget-categories';
import { ScopeStatus } from '@/lib/scope-of-work/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ChevronDownIcon, ChevronUpIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

// Import scope templates
import DefaultScope from './DefaultScope';
import RoofingScope from './RoofingScope';
import InsulationScope from './InsulationScope';
import HVACScope from './HVACScope';
import PlumbingScope from './PlumbingScope';
import ElectricalScope from './ElectricalScope';
import MasonryScope from './MasonryScope';
import CabinetryScope from './CabinetryScope';
import { generatePlumbingScope, generateElectricalScope } from '@/lib/scope-of-work/integration';

interface RoomFixture {
  category: string;
  name: string;
  quantity: number;
  imageUrl?: string;
  value?: string;
}

interface RoomDetail {
  id: string;
  name: string;
  type: string;
  fixtures: RoomFixture[];
}

interface ScopeOfWorkStepProps {
  hierarchicalBudget: HierarchicalBudgetCategory[];
  scopeOfWorkData: Record<string, {
    status: ScopeStatus;
    data: any;
    notes: string;
    files: string[];
  }>;
  onScopeChange: (categoryId: string, scope: {
    status: ScopeStatus;
    data: any;
    notes: string;
    files: string[];
  }) => void;
  projectId?: string;
  roomDetails?: RoomDetail[]; // Optional: for auto-populating plumbing/electrical
}

export default function ScopeOfWorkStep({
  hierarchicalBudget,
  scopeOfWorkData,
  onScopeChange,
  projectId = 'temp',
  roomDetails = [],
}: ScopeOfWorkStepProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Filter to only show categories with budgets
  const categoriesWithBudget = hierarchicalBudget.filter(cat => {
    const total = calculateCategoryTotal(cat);
    return total > 0;
  });

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const getScopeComponent = (categoryId: string, categoryName: string) => {
    const scope = scopeOfWorkData[categoryId] || {
      status: 'incomplete' as ScopeStatus,
      data: {},
      notes: '',
      files: [],
    };

    // Auto-populate plumbing and electrical data if not already populated
    let initialData = scope.data;
    const lowerName = categoryName.toLowerCase();
    
    if (lowerName.includes('plumbing') && roomDetails.length > 0 && !scope.data?.roomSummary) {
      initialData = generatePlumbingScope(roomDetails);
    } else if (lowerName.includes('electrical') && roomDetails.length > 0 && !scope.data?.roomSummary) {
      initialData = generateElectricalScope(roomDetails);
    }

    const commonProps = {
      categoryId,
      categoryName,
      data: initialData,
      onChange: (data: any) => onScopeChange(categoryId, { ...scope, data, status: 'completed' }),
      onStatusChange: (status: ScopeStatus) => onScopeChange(categoryId, { ...scope, status }),
      status: scope.status,
      notes: scope.notes,
      onNotesChange: (notes: string) => onScopeChange(categoryId, { ...scope, notes }),
      files: scope.files,
      onFilesChange: (files: string[]) => onScopeChange(categoryId, { ...scope, files }),
      projectId,
    };

    // Map specific categories to their custom templates
    
    if (lowerName.includes('roofing')) {
      return <RoofingScope {...commonProps} />;
    }
    
    if (lowerName.includes('insulation')) {
      return <InsulationScope {...commonProps} />;
    }
    
    if (lowerName.includes('hvac')) {
      return <HVACScope {...commonProps} />;
    }
    
    if (lowerName.includes('plumbing')) {
      return <PlumbingScope {...commonProps} />;
    }
    
    if (lowerName.includes('electrical')) {
      return <ElectricalScope {...commonProps} />;
    }
    
    if (lowerName.includes('masonry') || lowerName.includes('brick')) {
      return <MasonryScope {...commonProps} />;
    }
    
    if (lowerName.includes('cabinetry')) {
      return <CabinetryScope {...commonProps} />;
    }
    
    // Default template for all other categories
    return <DefaultScope {...commonProps} />;
  };

  const getStatusIcon = (categoryId: string) => {
    const scope = scopeOfWorkData[categoryId];
    if (!scope) {
      return <ClockIcon className="w-5 h-5 text-neutral-400" />;
    }
    
    switch (scope.status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'skipped':
        return <XCircleIcon className="w-5 h-5 text-amber-600" />;
      default:
        return <ClockIcon className="w-5 h-5 text-neutral-400" />;
    }
  };

  const getStatusBadge = (categoryId: string) => {
    const scope = scopeOfWorkData[categoryId];
    if (!scope || scope.status === 'incomplete') {
      return <span className="text-xs px-2 py-1 bg-neutral-100 text-neutral-600 rounded-full">Not Started</span>;
    }
    
    if (scope.status === 'completed') {
      return <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Completed</span>;
    }
    
    return <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">Skipped</span>;
  };

  if (categoriesWithBudget.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-neutral-600">
          No budget categories have been configured yet. Please go back and add budget amounts to the categories that need scope of work documentation.
        </p>
      </Card>
    );
  }

  const completedCount = categoriesWithBudget.filter(cat => {
    const scope = scopeOfWorkData[cat.id];
    return scope && (scope.status === 'completed' || scope.status === 'skipped');
  }).length;

  return (
    <div className="space-y-6">
      {/* Progress Summary */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-neutral-800">
            Scope of Work Progress
          </h3>
          <span className="text-sm text-neutral-600">
            {completedCount} of {categoriesWithBudget.length} completed
          </span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-3">
          <div
            className="bg-brass-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${(completedCount / categoriesWithBudget.length) * 100}%` }}
          />
        </div>
      </Card>

      {/* Category List */}
      <div className="space-y-4">
        {categoriesWithBudget.map((category) => {
          const isExpanded = expandedCategories.has(category.id);
          const total = calculateCategoryTotal(category);

          return (
            <Card key={category.id} className="overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  {getStatusIcon(category.id)}
                  <div className="text-left">
                    <h4 className="font-semibold text-neutral-800">
                      {category.code}. {category.name}
                    </h4>
                    <p className="text-sm text-neutral-600">
                      Budget: ${total.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusBadge(category.id)}
                  {isExpanded ? (
                    <ChevronUpIcon className="w-5 h-5 text-neutral-400" />
                  ) : (
                    <ChevronDownIcon className="w-5 h-5 text-neutral-400" />
                  )}
                </div>
              </button>

              {/* Category Content */}
              {isExpanded && (
                <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50">
                  {getScopeComponent(category.id, category.name)}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Instructions */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Complete or skip the scope of work for each category that has a budget allocated. 
          You can complete these later if needed by checking "Complete this category later".
        </p>
      </Card>
    </div>
  );
}
