'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import RoomCategoryMatrix from '@/components/ui/RoomCategoryMatrix';
import SubSelectionCreator from '@/components/ui/SubSelectionCreator';
import { apiClient } from '@/lib/api/client';

type Step = 'rooms' | 'categories' | 'items' | 'review';

interface Room {
  id: string;
  name: string;
  type: string;
}

interface Category {
  id: string;
  name: string;
}

interface RoomCategoryMapping {
  roomId: string;
  categoryId: string;
}

interface ItemToCreate {
  id: string;
  roomId: string;
  categoryId: string;
  name: string;
  quantity: number;
  subType?: string;
}

export default function ConfigureRoomsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const { user, profile } = useAuth();
  const router = useRouter();
  const { showSuccess, showError } = useNotification();

  const [currentStep, setCurrentStep] = useState<Step>('rooms');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Data
  const [project, setProject] = useState<any>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [roomCategoryMappings, setRoomCategoryMappings] = useState<RoomCategoryMapping[]>([]);
  const [itemsToCreate, setItemsToCreate] = useState<ItemToCreate[]>([]);
  const [selectedRoomForItems, setSelectedRoomForItems] = useState<string>('');

  const steps = [
    { id: 'rooms' as Step, title: 'Select Rooms', description: 'Choose which rooms exist' },
    { id: 'categories' as Step, title: 'Assign Categories', description: 'Map categories to rooms' },
    { id: 'items' as Step, title: 'Define Items', description: 'Add fixtures and quantities' },
    { id: 'review' as Step, title: 'Review', description: 'Review and save' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Check if user has permission (not client)
    if (profile && profile.role === 'client') {
      router.push(`/projects/${projectId}`);
      return;
    }

    loadData();
  }, [user, profile, projectId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load project
      const projectData = await apiClient.get(`/api/projects/${projectId}`);
      setProject(projectData);

      // Load rooms
      const roomsData = await apiClient.get(`/api/rooms?projectId=${projectId}`);
      setRooms(Array.isArray(roomsData) ? roomsData : []);

      // Load categories
      const categoriesData = await apiClient.get(`/api/categories?projectId=${projectId}`);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);

      // Load existing room-category mappings
      const mappingsData = await apiClient.get(`/api/room-categories?projectId=${projectId}`);
      if (mappingsData.roomCategories) {
        setRoomCategoryMappings(
          mappingsData.roomCategories.map((m: any) => ({
            roomId: m.roomId,
            categoryId: m.categoryId,
          }))
        );
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      showError('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const handleRoomCategoryToggle = (roomId: string, categoryId: string, selected: boolean) => {
    if (selected) {
      setRoomCategoryMappings(prev => [...prev, { roomId, categoryId }]);
    } else {
      setRoomCategoryMappings(prev =>
        prev.filter(m => !(m.roomId === roomId && m.categoryId === categoryId))
      );
      // Remove items for this room-category combination
      setItemsToCreate(prev =>
        prev.filter(item => !(item.roomId === roomId && item.categoryId === categoryId))
      );
    }
  };

  const handleAddItem = (roomId: string, categoryId: string, name: string, quantity: number, subType?: string) => {
    const newItem: ItemToCreate = {
      id: `${Date.now()}-${Math.random()}`,
      roomId,
      categoryId,
      name,
      quantity,
      subType,
    };
    setItemsToCreate(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (itemId: string) => {
    setItemsToCreate(prev => prev.filter(item => item.id !== itemId));
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].id);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Step 1: Save room-category mappings
      for (const mapping of roomCategoryMappings) {
        const room = rooms.find(r => r.id === mapping.roomId);
        const category = categories.find(c => c.id === mapping.categoryId);

        await apiClient.post('/api/room-categories', {
          projectId,
          roomId: mapping.roomId,
          roomName: room?.name || '',
          categoryId: mapping.categoryId,
          categoryName: category?.name || '',
          createdBy: user?.uid,
        });
      }

      // Step 2: Create selection items
      for (const item of itemsToCreate) {
        const room = rooms.find(r => r.id === item.roomId);
        const category = categories.find(c => c.id === item.categoryId);

        await apiClient.post('/api/selections', {
          projectId,
          categoryId: item.categoryId,
          categoryName: category?.name || '',
          name: item.name,
          roomId: item.roomId,
          roomName: room?.name || '',
          quantity: item.quantity,
          subType: item.subType,
          status: 'not_started',
          allowance: 0,
          actualCost: 0,
          difference: 0,
          locked: false,
          createdBy: user?.uid,
        });
      }

      showSuccess('Room configuration saved successfully!');
      router.push(`/projects/${projectId}`);
    } catch (error) {
      console.error('Failed to save configuration:', error);
      showError('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'rooms':
        return rooms.length > 0;
      case 'categories':
        return roomCategoryMappings.length > 0;
      case 'items':
        return true; // Items are optional
      case 'review':
        return true;
      default:
        return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-taupe-50 flex items-center justify-center">
        <div className="text-neutral-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-taupe-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/projects/${projectId}`)}
                className="text-neutral-600 hover:text-neutral-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-display font-bold text-neutral-900">
                Configure Room Selections
              </h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      index < currentStepIndex
                        ? 'bg-brass-600 text-white'
                        : index === currentStepIndex
                        ? 'bg-brass-600 text-white ring-4 ring-brass-100'
                        : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    {index < currentStepIndex ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div className="text-xs font-medium text-neutral-900">{step.title}</div>
                    <div className="text-xs text-neutral-500 hidden sm:block">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-all ${
                      index < currentStepIndex ? 'bg-brass-600' : 'bg-neutral-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-6">
          {/* Step 1: Rooms */}
          {currentStep === 'rooms' && (
            <Card>
              <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">
                Select Rooms
              </h2>
              <p className="text-neutral-600 mb-6">
                These are the rooms configured for this project. You can add or modify rooms in the project setup page.
              </p>

              {rooms.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-neutral-600 mb-4">No rooms configured yet.</p>
                  <Button onClick={() => router.push(`/projects/${projectId}/setup`)}>
                    Go to Project Setup
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {rooms.map(room => (
                    <div
                      key={room.id}
                      className="p-4 bg-brass-50 border-2 border-brass-600 rounded-button"
                    >
                      <div className="font-medium text-neutral-900">{room.name}</div>
                      <div className="text-sm text-neutral-600 capitalize">{room.type}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Step 2: Categories */}
          {currentStep === 'categories' && (
            <RoomCategoryMatrix
              rooms={rooms}
              categories={categories}
              selectedMappings={roomCategoryMappings}
              onToggle={handleRoomCategoryToggle}
            />
          )}

          {/* Step 3: Items */}
          {currentStep === 'items' && (
            <div className="space-y-6">
              <Card>
                <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">
                  Define Items & Fixtures
                </h2>
                <p className="text-neutral-600 mb-4">
                  Add specific items or fixtures needed for each room-category combination.
                </p>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Select Room to Configure
                  </label>
                  <select
                    value={selectedRoomForItems}
                    onChange={(e) => setSelectedRoomForItems(e.target.value)}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500 bg-white text-neutral-900"
                  >
                    <option value="">Choose a room...</option>
                    {rooms.map(room => (
                      <option key={room.id} value={room.id}>
                        {room.name}
                      </option>
                    ))}
                  </select>
                </div>
              </Card>

              {selectedRoomForItems && (
                <div className="space-y-4">
                  {roomCategoryMappings
                    .filter(m => m.roomId === selectedRoomForItems)
                    .map(mapping => {
                      const category = categories.find(c => c.id === mapping.categoryId);
                      const room = rooms.find(r => r.id === mapping.roomId);
                      const items = itemsToCreate.filter(
                        item => item.roomId === mapping.roomId && item.categoryId === mapping.categoryId
                      );

                      return (
                        <SubSelectionCreator
                          key={`${mapping.roomId}-${mapping.categoryId}`}
                          categoryName={`${room?.name} - ${category?.name}`}
                          isPaintCategory={category?.name.toLowerCase() === 'paint'}
                          onAdd={(name, quantity, subType) =>
                            handleAddItem(mapping.roomId, mapping.categoryId, name, quantity, subType)
                          }
                          onRemove={handleRemoveItem}
                          items={items}
                        />
                      );
                    })}

                  {roomCategoryMappings.filter(m => m.roomId === selectedRoomForItems).length === 0 && (
                    <Card>
                      <div className="text-center py-8 text-neutral-500">
                        No categories assigned to this room. Go back to assign categories.
                      </div>
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 'review' && (
            <Card>
              <h2 className="text-2xl font-display font-bold text-neutral-900 mb-6">
                Review Configuration
              </h2>

              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-brass-50 rounded-button">
                    <div className="text-sm text-neutral-600">Rooms</div>
                    <div className="text-2xl font-bold text-neutral-900">{rooms.length}</div>
                  </div>
                  <div className="p-4 bg-brass-50 rounded-button">
                    <div className="text-sm text-neutral-600">Room-Category Mappings</div>
                    <div className="text-2xl font-bold text-neutral-900">{roomCategoryMappings.length}</div>
                  </div>
                  <div className="p-4 bg-brass-50 rounded-button">
                    <div className="text-sm text-neutral-600">Items to Create</div>
                    <div className="text-2xl font-bold text-neutral-900">{itemsToCreate.length}</div>
                  </div>
                </div>

                {/* Detailed Breakdown */}
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4">Configuration Details</h3>
                  <div className="space-y-4">
                    {rooms.map(room => {
                      const roomMappings = roomCategoryMappings.filter(m => m.roomId === room.id);
                      const roomItems = itemsToCreate.filter(item => item.roomId === room.id);

                      return (
                        <div key={room.id} className="p-4 bg-taupe-50 rounded-button">
                          <h4 className="font-semibold text-neutral-900 mb-2">{room.name}</h4>
                          
                          <div className="mb-2">
                            <span className="text-sm text-neutral-600">Categories: </span>
                            <span className="text-sm text-neutral-900">
                              {roomMappings.length === 0
                                ? 'None'
                                : roomMappings
                                    .map(m => categories.find(c => c.id === m.categoryId)?.name)
                                    .join(', ')}
                            </span>
                          </div>

                          {roomItems.length > 0 && (
                            <div>
                              <span className="text-sm text-neutral-600">Items ({roomItems.length}): </span>
                              <ul className="mt-2 space-y-1">
                                {roomItems.map(item => (
                                  <li key={item.id} className="text-sm text-neutral-900 ml-4">
                                    • {item.name} (Qty: {item.quantity})
                                    {item.subType && ` - ${item.subType}`}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStepIndex === 0 || saving}
          >
            Back
          </Button>

          {currentStep === 'review' ? (
            <Button onClick={handleSave} disabled={saving || !canProceed()}>
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Next
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
