import { useState } from 'react';
import Card from './Card';

interface Room {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface RoomCategoryMatrixProps {
  rooms: Room[];
  categories: Category[];
  selectedMappings: { roomId: string; categoryId: string }[];
  onToggle: (roomId: string, categoryId: string, selected: boolean) => void;
  disabled?: boolean;
}

export default function RoomCategoryMatrix({
  rooms,
  categories,
  selectedMappings,
  onToggle,
  disabled = false,
}: RoomCategoryMatrixProps) {
  const isSelected = (roomId: string, categoryId: string) => {
    return selectedMappings.some(
      m => m.roomId === roomId && m.categoryId === categoryId
    );
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">
        Assign Categories to Rooms
      </h3>
      <p className="text-sm text-neutral-600 mb-6">
        Select which categories apply to each room. For example, a Living Room might need Electrical, Flooring, and Paint.
      </p>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-neutral-200">
              <th className="text-left p-3 font-semibold text-neutral-900 min-w-[150px]">Room</th>
              {categories.map(category => (
                <th key={category.id} className="text-center p-3 font-semibold text-neutral-900 min-w-[100px]">
                  <div className="text-sm whitespace-normal break-words">
                    {category.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rooms.map(room => (
              <tr key={room.id} className="border-b border-neutral-200 hover:bg-taupe-50">
                <td className="p-3 font-medium text-neutral-900">{room.name}</td>
                {categories.map(category => {
                  const selected = isSelected(room.id, category.id);
                  return (
                    <td key={category.id} className="p-3 text-center">
                      <button
                        onClick={() => onToggle(room.id, category.id, !selected)}
                        disabled={disabled}
                        className={`
                          w-6 h-6 rounded border-2 flex items-center justify-center transition-all mx-auto
                          ${selected 
                            ? 'bg-brass-600 border-brass-600' 
                            : 'bg-white border-neutral-300 hover:border-brass-400'
                          }
                          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                      >
                        {selected && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {rooms.map(room => (
          <div key={room.id} className="border border-neutral-200 rounded-button p-4 bg-white">
            <h4 className="font-semibold text-neutral-900 mb-3">{room.name}</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map(category => {
                const selected = isSelected(room.id, category.id);
                return (
                  <button
                    key={category.id}
                    onClick={() => onToggle(room.id, category.id, !selected)}
                    disabled={disabled}
                    className={`
                      p-3 rounded-button border-2 text-sm font-medium transition-all text-left
                      ${selected 
                        ? 'bg-brass-50 border-brass-600 text-brass-900' 
                        : 'bg-white border-neutral-300 text-neutral-700 hover:border-brass-400'
                      }
                      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`
                        w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                        ${selected 
                          ? 'bg-brass-600 border-brass-600' 
                          : 'bg-white border-neutral-300'
                        }
                      `}>
                        {selected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="truncate">{category.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {rooms.length === 0 && (
        <div className="text-center py-8 text-neutral-500">
          No rooms available. Please add rooms first.
        </div>
      )}
    </Card>
  );
}
