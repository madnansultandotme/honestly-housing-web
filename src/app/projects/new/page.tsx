'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import CategoryChecklist, { CategoryItem } from '@/components/ui/CategoryChecklist';
import AllowancePrompt, { AllowanceType } from '@/components/ui/AllowancePrompt';
import { apiClient } from '@/lib/api/client';

interface RoomConfig {
  id: string;
  name: string;
  selected: boolean;
  requiredFixtures: number;
}

interface CategoryAllowance {
  categoryId: string;
  amount: number;
  type: AllowanceType;
}

const DEFAULT_ROOMS: RoomConfig[] = [
  { id: 'primary-bedroom', name: 'Primary Bedroom', selected: false, requiredFixtures: 1 },
  { id: 'bedroom-2', name: 'Bedroom 2', selected: false, requiredFixtures: 1 },
  { id: 'bedroom-3', name: 'Bedroom 3', selected: false, requiredFixtures: 1 },
  { id: 'bedroom-4', name: 'Bedroom 4', selected: false, requiredFixtures: 1 },
  { id: 'kitchen', name: 'Kitchen', selected: false, requiredFixtures: 1 },
  { id: 'dining', name: 'Dining Room', selected: false, requiredFixtures: 1 },
  { id: 'living', name: 'Living Room', selected: false, requiredFixtures: 1 },
  { id: 'family', name: 'Family Room', selected: false, requiredFixtures: 1 },
  { id: 'primary-bath', name: 'Primary Bathroom', selected: false, requiredFixtures: 1 },
  { id: 'bath-2', name: 'Bathroom 2', selected: false, requiredFixtures: 1 },
  { id: 'bath-3', name: 'Bathroom 3', selected: false, requiredFixtures: 1 },
  { id: 'powder', name: 'Powder Room', selected: false, requiredFixtures: 1 },
  { id: 'laundry', name: 'Laundry Room', selected: false, requiredFixtures: 1 },
  { id: 'office', name: 'Office', selected: false, requiredFixtures: 1 },
  { id: 'bonus', name: 'Bonus Room', selected: false, requiredFixtures: 1 },
  { id: 'exterior', name: 'Exterior', selected: false, requiredFixtures: 1 },
];

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'flooring', name: 'Flooring', required: true, completedCount: 0, totalCount: 0 },
  { id: 'lighting', name: 'Lighting', required: true, completedCount: 0, totalCount: 0 },
  { id: 'plumbing', name: 'Plumbing', required: true, completedCount: 0, totalCount: 0 },
  { id: 'paint', name: 'Paint', required: true, completedCount: 0, totalCount: 0 },
  { id: 'tile', name: 'Tile', required: true, completedCount: 0, totalCount: 0 },
  { id: 'countertops', name: 'Countertops', required: true, completedCount: 0, totalCount: 0 },
  { id: 'hardware', name: 'Hardware', required: true, completedCount: 0, totalCount: 0 },
  { id: 'appliances', name: 'Appliances', required: false, completedCount: 0, totalCount: 0 },
  { id: 'cabinetry', name: 'Cabinetry', required: false, completedCount: 0, totalCount: 0 },
];

type Step = 'basic' | 'rooms' | 'counts' | 'categories' | 'budgets' | 'template';

export default function NewProjectPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Basic Info
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [budget, setBudget] = useState('');
  const [address, setAddress] = useState('');
  const [clientSearchResults, setClientSearchResults] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [searchingClient, setSearchingClient] = useState(false);

  // Step 2: Rooms
  const [rooms, setRooms] = useState<RoomConfig[]>(DEFAULT_ROOMS);

  // Step 3: Counts
  const [bedroomCount, setBedroomCount] = useState(4);
  const [bathroomCount, setBathroomCount] = useState(3);
  const [officeCount, setOfficeCount] = useState(1);
  const [totalFixtures, setTotalFixtures] = useState(0);
  const [squareFootage, setSquareFootage] = useState(2500);

  // Step 4: Categories
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);

  // Step 5: Budgets
  const [allowances, setAllowances] = useState<CategoryAllowance[]>([]);

  // Step 6: Template
  const [templateName, setTemplateName] = useState('');
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

  const steps: { id: Step; title: string; description: string }[] = [
    { id: 'basic', title: 'Basic Info', description: 'Project name and client' },
    { id: 'rooms', title: 'Select Rooms', description: 'Choose which rooms exist' },
    { id: 'counts', title: 'Room Counts', description: 'Bedrooms, bathrooms, fixtures' },
    { id: 'categories', title: 'Categories', description: 'Required selection categories' },
    { id: 'budgets', title: 'Budgets', description: 'Set allowances per category' },
    { id: 'template', title: 'Save Template', description: 'Optional: Save for reuse' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const searchClients = async (email: string) => {
    if (!email.trim()) {
      setClientSearchResults([]);
      return;
    }

    try {
      setSearchingClient(true);
      const response = await fetch(`/api/users/search?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      setClientSearchResults(data.users || []);
    } catch (err) {
      console.error('Failed to search clients:', err);
      setClientSearchResults([]);
    } finally {
      setSearchingClient(false);
    }
  };

  const handleClientSelect = (client: any) => {
    setSelectedClient(client);
    setClientEmail(client.email);
    setClientSearchResults([]);
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

  const handleRoomToggle = (roomId: string) => {
    setRooms(prev =>
      prev.map(room =>
        room.id === roomId ? { ...room, selected: !room.selected } : room
      )
    );
  };

  const handleRoomFixturesChange = (roomId: string, value: number) => {
    setRooms(prev =>
      prev.map(room =>
        room.id === roomId ? { ...room, requiredFixtures: value < 1 ? 1 : value } : room
      )
    );
  };

  const handleCategoryToggle = (categoryId: string, required: boolean) => {
    setCategories(prev =>
      prev.map(cat => (cat.id === categoryId ? { ...cat, required } : cat))
    );
  };

  const handleAllowanceChange = (categoryId: string, amount: number, type: AllowanceType) => {
    setAllowances(prev => {
      const existing = prev.find(a => a.categoryId === categoryId);
      if (existing) {
        return prev.map(a =>
          a.categoryId === categoryId ? { ...a, amount, type } : a
        );
      }
      return [...prev, { categoryId, amount, type }];
    });
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError('');

      // Validate required fields
      if (!projectName.trim() || !selectedClient) {
        throw new Error('Project name and client are required');
      }

      // Build rooms object matching schema
      const roomsObject: Record<string, number> = {
        bedrooms: bedroomCount,
        bathrooms: bathroomCount,
        offices: officeCount,
        kitchens: 0,
        livingRooms: 0,
        diningRooms: 0,
        laundryRooms: 0,
        garages: 0,
        other: 0,
      };

      // Count room types from selected rooms
      rooms.filter(r => r.selected).forEach(room => {
        if (room.id.includes('bedroom')) roomsObject.bedrooms = Math.max(roomsObject.bedrooms, bedroomCount);
        if (room.id.includes('bath')) roomsObject.bathrooms = Math.max(roomsObject.bathrooms, bathroomCount);
        if (room.id.includes('kitchen')) roomsObject.kitchens = (roomsObject.kitchens || 0) + 1;
        if (room.id.includes('living')) roomsObject.livingRooms = (roomsObject.livingRooms || 0) + 1;
        if (room.id.includes('dining')) roomsObject.diningRooms = (roomsObject.diningRooms || 0) + 1;
        if (room.id.includes('laundry')) roomsObject.laundryRooms = (roomsObject.laundryRooms || 0) + 1;
        if (room.id.includes('garage')) roomsObject.garages = (roomsObject.garages || 0) + 1;
        if (room.id.includes('office')) roomsObject.offices = Math.max(roomsObject.offices, officeCount);
        if (room.id.includes('other') || room.id.includes('bonus') || room.id.includes('exterior')) {
          roomsObject.other = (roomsObject.other || 0) + 1;
        }
      });

      // Step 1: Create project with schema-compliant structure
      const projectResponse: any = await apiClient.post('/api/projects', {
        name: projectName,
        builderOrgId: profile?.builderOrgId || user?.uid,
        clientId: selectedClient.uid,
        clientEmail: selectedClient.email, // Store email for easy access
        status: 'setup',
        address: address || '',
        startDate: new Date().toISOString(),
        rooms: roomsObject,
        fixtureCounts: {
          plumbingFixtures: totalFixtures,
          lightingFixtures: 0,
        },
        squareFootage: squareFootage || null,
        progress: {
          totalItems: 0,
          completedItems: 0,
          approvedItems: 0,
          pendingItems: 0,
          installedItems: 0,
        },
        createdBy: user?.uid,
      });

      const projectId = projectResponse?.id || projectResponse?.projectId;

      if (!projectId) {
        throw new Error('Failed to create project');
      }

      // Step 2: Create categories as subcollection
      const requiredCategories = categories.filter(c => c.required);
      for (let i = 0; i < requiredCategories.length; i++) {
        const category = requiredCategories[i];
        const allowance = allowances.find(a => a.categoryId === category.id);

        await apiClient.post('/api/categories', {
          projectId,
          name: category.name,
          displayOrder: i,
          required: true,
          allowanceType: allowance?.type || 'fixed',
          allowanceAmount: allowance?.amount || 0,
          progress: {
            totalItems: 0,
            completedItems: 0,
          },
        });
      }

      // Step 3: Create rooms as subcollection
      const roomTypeMap: Record<string, string> = {
        'primary-bedroom': 'bedroom',
        'bedroom-2': 'bedroom',
        'bedroom-3': 'bedroom',
        'bedroom-4': 'bedroom',
        'kitchen': 'kitchen',
        'dining': 'dining',
        'living': 'living',
        'family': 'living',
        'primary-bath': 'bathroom',
        'bath-2': 'bathroom',
        'bath-3': 'bathroom',
        'powder': 'bathroom',
        'laundry': 'laundry',
        'office': 'office',
        'bonus': 'other',
        'exterior': 'other',
      };

      for (const room of rooms.filter(r => r.selected)) {
        await apiClient.post('/api/rooms', {
          projectId,
          name: room.name,
          type: roomTypeMap[room.id] || 'other',
          fixtureCounts: {
            total: room.requiredFixtures || 1,
            assigned: 0,
          },
        });
      }

      // Step 4: Save as template if requested
      if (saveAsTemplate && templateName.trim()) {
        const builderOrgId = profile?.builderOrgId || user?.uid;
        await apiClient.post('/api/templates', {
          name: templateName,
          builderOrgId,
          rooms: roomsObject,
          fixtureCounts: {
            plumbingFixtures: totalFixtures,
            lightingFixtures: 0,
          },
          squareFootage: squareFootage || null,
          categories: requiredCategories.map((c, i) => {
            const allowance = allowances.find(a => a.categoryId === c.id);
            return {
              name: c.name,
              allowanceType: allowance?.type || 'fixed',
              allowanceAmount: allowance?.amount || 0,
              required: true,
            };
          }),
          createdBy: user?.uid,
        });
      }

      // Redirect to project detail
      router.push(`/projects/${projectId}`);
    } catch (err) {
      console.error('Failed to create project:', err);
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'basic':
        return projectName.trim() && selectedClient;
      case 'rooms':
        return rooms.some(r => r.selected);
      case 'counts':
        return true;
      case 'categories':
        return categories.some(c => c.required);
      case 'budgets':
        return true;
      case 'template':
        return true;
      default:
        return false;
    }
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-taupe-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/projects')}
                className="text-neutral-600 hover:text-neutral-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-display font-bold text-neutral-900">
                Create New Project
              </h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-button text-red-700">
            {error}
          </div>
        )}

        {/* Step Content */}
        <Card className="mb-6">
          {/* Step 1: Basic Info */}
          {currentStep === 'basic' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">
                  Project Information
                </h2>
                <p className="text-neutral-600">
                  Let's start with the basic details about this project.
                </p>
              </div>

              <Input
                label="Project Name *"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., Smith Residence"
                required
              />

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Description
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500 bg-white text-neutral-900"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the project"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Address
                </label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Project address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Select Client *
                </label>
                <div className="relative">
                  <Input
                    value={clientEmail}
                    onChange={(e) => {
                      setClientEmail(e.target.value);
                      searchClients(e.target.value);
                    }}
                    placeholder="Search client by email"
                    required
                  />
                  {clientSearchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-300 rounded-button shadow-lg z-10">
                      {clientSearchResults.map((client) => (
                        <button
                          key={client.uid}
                          onClick={() => handleClientSelect(client)}
                          className="w-full text-left px-4 py-2 hover:bg-brass-50 border-b border-neutral-200 last:border-b-0"
                        >
                          <div className="font-medium text-neutral-900">{client.displayName || 'Unknown'}</div>
                          <div className="text-sm text-neutral-600">{client.email}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchingClient && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-300 rounded-button shadow-lg z-10 p-3">
                      <div className="text-sm text-neutral-600">Searching...</div>
                    </div>
                  )}
                </div>
                {selectedClient && (
                  <div className="mt-2 p-3 bg-brass-50 border border-brass-200 rounded-button">
                    <div className="text-sm font-medium text-neutral-900">Selected: {selectedClient.displayName || selectedClient.email}</div>
                  </div>
                )}
              </div>

              <Input
                label="Total Budget (optional)"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="0.00"
              />
            </div>
          )}

          {/* Step 2: Rooms */}
          {currentStep === 'rooms' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">
                  Select Rooms
                </h2>
                <p className="text-neutral-600">
                  Choose which rooms exist in this project. You can set fixture counts in the next step.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {rooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => handleRoomToggle(room.id)}
                    className={`
                      p-4 rounded-button border-2 text-left transition-all
                      ${
                        room.selected
                          ? 'border-brass-600 bg-brass-50'
                          : 'border-neutral-200 bg-white hover:border-neutral-300'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`
                          w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                          ${room.selected ? 'bg-brass-600 border-brass-600' : 'bg-white border-neutral-300'}
                        `}
                      >
                        {room.selected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-medium text-neutral-900">{room.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Counts */}
          {currentStep === 'counts' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">
                  Room & Fixture Counts
                </h2>
                <p className="text-neutral-600">
                  Provide counts for bedrooms, bathrooms, and fixtures.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Bedrooms"
                  type="number"
                  min="0"
                  value={bedroomCount}
                  onChange={(e) => setBedroomCount(parseInt(e.target.value) || 0)}
                />

                <Input
                  label="Bathrooms"
                  type="number"
                  min="0"
                  value={bathroomCount}
                  onChange={(e) => setBathroomCount(parseInt(e.target.value) || 0)}
                />

                <Input
                  label="Offices"
                  type="number"
                  min="0"
                  value={officeCount}
                  onChange={(e) => setOfficeCount(parseInt(e.target.value) || 0)}
                />

                <Input
                  label="Total Fixtures"
                  type="number"
                  min="0"
                  value={totalFixtures}
                  onChange={(e) => setTotalFixtures(parseInt(e.target.value) || 0)}
                />

                <Input
                  label="Square Footage"
                  type="number"
                  min="0"
                  value={squareFootage}
                  onChange={(e) => setSquareFootage(parseInt(e.target.value) || 0)}
                  className="md:col-span-2"
                />
              </div>

              {/* Fixture counts per room */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Fixtures Per Room
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rooms.filter(r => r.selected).map((room) => (
                    <div key={room.id} className="flex items-center gap-3">
                      <label className="flex-1 text-sm font-medium text-neutral-700">
                        {room.name}
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={room.requiredFixtures}
                        onChange={(e) =>
                          handleRoomFixturesChange(room.id, parseInt(e.target.value, 10) || 1)
                        }
                        className="w-24"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Categories */}
          {currentStep === 'categories' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">
                  Selection Categories
                </h2>
                <p className="text-neutral-600">
                  Choose which categories are required for this project.
                </p>
              </div>

              <CategoryChecklist
                categories={categories}
                onToggleRequired={handleCategoryToggle}
                builderMode={true}
                showProgress={false}
              />
            </div>
          )}

          {/* Step 5: Budgets */}
          {currentStep === 'budgets' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">
                  Category Budgets
                </h2>
                <p className="text-neutral-600">
                  Set allowances for each required category. You can use a fixed amount or price per square foot.
                </p>
              </div>

              <div className="space-y-6">
                {categories
                  .filter((cat) => cat.required)
                  .map((category) => {
                    const allowance = allowances.find((a) => a.categoryId === category.id) || {
                      amount: 0,
                      type: 'fixed' as AllowanceType,
                    };
                    return (
                      <AllowancePrompt
                        key={category.id}
                        label={category.name}
                        value={allowance.amount}
                        type={allowance.type}
                        onValueChange={(amount) =>
                          handleAllowanceChange(category.id, amount, allowance.type)
                        }
                        onTypeChange={(type) =>
                          handleAllowanceChange(category.id, allowance.amount, type)
                        }
                        sqFt={squareFootage}
                      />
                    );
                  })}
              </div>
            </div>
          )}

          {/* Step 6: Template */}
          {currentStep === 'template' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">
                  Save as Template
                </h2>
                <p className="text-neutral-600">
                  Optionally save this configuration as a template to reuse for future projects.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="saveTemplate"
                    checked={saveAsTemplate}
                    onChange={(e) => setSaveAsTemplate(e.target.checked)}
                    className="w-5 h-5 text-brass-600 border-neutral-300 rounded focus:ring-brass-500"
                  />
                  <label htmlFor="saveTemplate" className="text-sm font-medium text-neutral-700">
                    Save this configuration as a reusable template
                  </label>
                </div>

                {saveAsTemplate && (
                  <Input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Template name (e.g., Standard 4BR Home)"
                    label="Template Name"
                  />
                )}
              </div>

              {/* Summary */}
              <div className="mt-8 p-6 bg-taupe-50 rounded-button">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Project Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Project Name:</span>
                    <span className="font-medium text-neutral-900">{projectName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Rooms Selected:</span>
                    <span className="font-medium text-neutral-900">
                      {rooms.filter(r => r.selected).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Required Categories:</span>
                    <span className="font-medium text-neutral-900">
                      {categories.filter(c => c.required).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Square Footage:</span>
                    <span className="font-medium text-neutral-900">
                      {squareFootage.toLocaleString()} sq ft
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStepIndex === 0 || saving}
          >
            Back
          </Button>

          {currentStepIndex < steps.length - 1 ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={saving || !canProceed()}>
              {saving ? 'Creating Project...' : 'Create Project'}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
