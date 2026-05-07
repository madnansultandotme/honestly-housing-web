import { useState } from 'react';
import Button from './Button';
import Input from './Input';
import Card from './Card';

interface SubSelection {
  id: string;
  name: string;
  quantity: number;
  subType?: string;
}

interface SubSelectionCreatorProps {
  categoryName: string;
  isPaintCategory?: boolean;
  onAdd: (name: string, quantity: number, subType?: string) => void;
  onRemove: (id: string) => void;
  items: SubSelection[];
  disabled?: boolean;
}

const PAINT_SUBTYPES = [
  { value: 'trim', label: 'Trim' },
  { value: 'ceiling', label: 'Ceiling' },
  { value: 'walls', label: 'Walls' },
  { value: 'cabinets', label: 'Cabinets' },
];

export default function SubSelectionCreator({
  categoryName,
  isPaintCategory = false,
  onAdd,
  onRemove,
  items,
  disabled = false,
}: SubSelectionCreatorProps) {
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [subType, setSubType] = useState('');

  const handleAdd = () => {
    if (!itemName.trim()) return;
    
    onAdd(
      itemName.trim(),
      quantity,
      isPaintCategory && subType ? subType : undefined
    );
    
    setItemName('');
    setQuantity(1);
    setSubType('');
  };

  return (
    <Card>
      <h4 className="text-md font-semibold text-neutral-900 mb-4">
        {categoryName} - Items/Fixtures
      </h4>

      {/* Add New Item Form */}
      <div className="space-y-3 mb-4 p-4 bg-taupe-50 rounded-button">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <Input
              label="Item Name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder={isPaintCategory ? "e.g., Benjamin Moore White Dove" : "e.g., Ceiling Fan"}
              disabled={disabled}
            />
          </div>
          <div>
            <Input
              label="Quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              disabled={disabled}
            />
          </div>
        </div>

        {isPaintCategory && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Paint Type
            </label>
            <select
              value={subType}
              onChange={(e) => setSubType(e.target.value)}
              disabled={disabled}
              className="w-full px-4 py-3 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500 bg-white text-neutral-900"
            >
              <option value="">Select type...</option>
              {PAINT_SUBTYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <Button
          onClick={handleAdd}
          disabled={disabled || !itemName.trim() || (isPaintCategory && !subType)}
          size="sm"
        >
          Add Item
        </Button>
      </div>

      {/* Items List */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-sm text-neutral-500 text-center py-4">
            No items added yet. Add fixtures or items needed for this category.
          </div>
        ) : (
          items.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-white border border-neutral-200 rounded-button"
            >
              <div className="flex-1">
                <div className="font-medium text-neutral-900">{item.name}</div>
                <div className="text-sm text-neutral-600">
                  Quantity: {item.quantity}
                  {item.subType && ` • Type: ${PAINT_SUBTYPES.find(t => t.value === item.subType)?.label}`}
                </div>
              </div>
              <button
                onClick={() => onRemove(item.id)}
                disabled={disabled}
                className="ml-3 text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
