'use client';

import { useState } from 'react';
import Input from './Input';

export type AllowanceType = 'fixed' | 'perSqFt';

interface AllowancePromptProps {
  value: number;
  type: AllowanceType;
  onValueChange: (value: number) => void;
  onTypeChange: (type: AllowanceType) => void;
  disabled?: boolean;
  label?: string;
  sqFt?: number;
}

export default function AllowancePrompt({
  value,
  type,
  onValueChange,
  onTypeChange,
  disabled = false,
  label = 'Budget',
  sqFt,
}: AllowancePromptProps) {
  const [localValue, setLocalValue] = useState(value.toString());

  const handleValueChange = (newValue: string) => {
    setLocalValue(newValue);
    const numValue = parseFloat(newValue.replace(/[^0-9.]/g, ''));
    if (!isNaN(numValue)) {
      onValueChange(numValue);
    }
  };

  const handleTypeToggle = () => {
    const newType = type === 'fixed' ? 'perSqFt' : 'fixed';
    onTypeChange(newType);
  };

  const formatCurrency = (val: string) => {
    const num = parseFloat(val.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return '';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const totalAllowance = type === 'perSqFt' && sqFt ? value * sqFt : value;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-neutral-700">{label}</label>

      {/* Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleTypeToggle}
          disabled={disabled}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${type === 'fixed' ? 'bg-neutral-300' : 'bg-brass-600'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${type === 'fixed' ? 'translate-x-1' : 'translate-x-6'}
            `}
          />
        </button>
        <span className="text-sm text-neutral-700">
          {type === 'fixed' ? 'Fixed Allowance' : 'Price per Sq Ft'}
        </span>
      </div>

      {/* Amount Input */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            type="text"
            value={localValue}
            onChange={(e) => handleValueChange(e.target.value)}
            onBlur={() => setLocalValue(formatCurrency(localValue))}
            disabled={disabled}
            placeholder="0.00"
            className="text-right"
          />
        </div>
        <span className="text-sm text-neutral-600 sm:w-20">
          {type === 'fixed' ? 'total' : '/ sq ft'}
        </span>
      </div>

      {/* Calculated Total (for per sq ft) */}
      {type === 'perSqFt' && sqFt && (
        <div className="flex flex-col gap-1 p-3 bg-taupe-50 rounded-button sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-neutral-700">Total Allowance ({sqFt} sq ft)</span>
          <span className="text-sm font-semibold text-neutral-900">
            ${totalAllowance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      )}
    </div>
  );
}
