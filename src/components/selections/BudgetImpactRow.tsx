interface BudgetImpactRowProps {
  allowance: number;
  actualCost: number;
  className?: string;
}

export default function BudgetImpactRow({ allowance, actualCost, className = '' }: BudgetImpactRowProps) {
  const difference = actualCost - allowance;
  const isUpgrade = difference > 0;
  const isSavings = difference < 0;

  return (
    <div className={`bg-taupe-50 rounded-button p-4 ${className}`}>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-xs text-neutral-600 mb-1">Allowance</div>
          <div className="text-lg font-semibold text-neutral-900">
            ${allowance.toLocaleString()}
          </div>
        </div>
        
        <div>
          <div className="text-xs text-neutral-600 mb-1">Chosen Cost</div>
          <div className="text-lg font-semibold text-neutral-900">
            ${actualCost.toLocaleString()}
          </div>
        </div>
        
        <div>
          <div className="text-xs text-neutral-600 mb-1">Difference</div>
          <div className={`text-lg font-semibold ${
            isUpgrade ? 'text-red-600' : isSavings ? 'text-green-600' : 'text-neutral-900'
          }`}>
            {difference === 0 ? '$0' : `${isUpgrade ? '+' : ''}$${Math.abs(difference).toLocaleString()}`}
          </div>
          {isUpgrade && (
            <div className="text-xs text-red-600 mt-1">Upgrade</div>
          )}
          {isSavings && (
            <div className="text-xs text-green-600 mt-1">Savings</div>
          )}
        </div>
      </div>
    </div>
  );
}
