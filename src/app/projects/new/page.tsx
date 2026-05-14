'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import CategoryChecklist, { CategoryItem } from '@/components/ui/CategoryChecklist';
import AllowancePrompt, { AllowanceType } from '@/components/ui/AllowancePrompt';
import DynamicRoomBuilder, { RoomDetail } from '@/components/ui/DynamicRoomBuilder';
import PaintBuilder, { PaintDetail } from '@/components/ui/PaintBuilder';
import CredentialsModal from '@/components/ui/CredentialsModal';
import { apiClient } from '@/lib/api/client';

interface CategoryAllowance {
  categoryId: string;
  amount: number;
  type: AllowanceType;
}

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

type Step = 'basic' | 'rooms' | 'paint' | 'categories' | 'budgets' | 'template';

export default function NewProjectPage() {
  const { user, profile } = useAuth();
  const { showSuccess, showError } = useNotification();
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
  const [creatingClient, setCreatingClient] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [newClientCredentials, setNewClientCredentials] = useState<{
    email: string;
    password: string;
    displayName: string;
  } | null>(null);

  // Step 2: Rooms (Dynamic)
  const [roomDetails, setRoomDetails] = useState<RoomDetail[]>([]);
  const [squareFootage, setSquareFootage] = useState(2500);

  // Step 3: Paint
  const [paintSelections, setPaintSelections] = useState<PaintDetail[]>([]);

  // Step 4: Categories
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);

  // Step 5: Budgets
  const [allowances, setAllowances] = useState<CategoryAllowance[]>([]);

  // Step 6: Template
  const [templateName, setTemplateName] = useState('');
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const steps: { id: Step; title: string; description: string }[] = [
    { id: 'basic', title: 'Basic Info', description: 'Project name and client' },
    { id: 'rooms', title: 'Rooms & Fixtures', description: 'Define rooms and their fixtures' },
    { id: 'paint', title: 'Paint', description: 'Paint selections and assignments' },
    { id: 'categories', title: 'Categories', description: 'Required selection categories' },
    { id: 'budgets', title: 'Budgets', description: 'Set allowances per category' },
    { id: 'template', title: 'Save Template', description: 'Optional: Save for reuse' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const searchClients = async (email: string) => {
    if (!email.trim()) {
      setClientSearchResults([]);
      setShowCreateClient(false);
      return;
    }

    try {
      setSearchingClient(true);
      const response = await fetch(`/api/users/search?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (data.users && data.users.length > 0) {
        setClientSearchResults(data.users);
        setShowCreateClient(false);
      } else {
        // No users found - show create option
        setClientSearchResults([]);
        setShowCreateClient(true);
      }
    } catch (err) {
      console.error('Failed to search clients:', err);
      setClientSearchResults([]);
      setShowCreateClient(false);
    } finally {
      setSearchingClient(false);
    }
  };

  const handleClientSelect = (client: any) => {
    setSelectedClient(client);
    setClientEmail(client.email);
    setClientSearchResults([]);
    setShowCreateClient(false);
  };

  const handleCreateNewClient = async () => {
    if (!clientEmail.trim() || !newClientName.trim()) {
      setError('Email and name are required to create a new client');
      return;
    }

    try {
      setCreatingClient(true);
      setError('');

      // Create the client account
      const response = await fetch('/api/users/create-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: clientEmail,
          displayName: newClientName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create client');
      }

      // Send welcome email with credentials
      const loginUrl = `${window.location.origin}/login`;
      
      try {
        await fetch('/api/email/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: data.credentials.email,
            displayName: newClientName,
            projectName: projectName || 'Your New Project',
            builderName: profile?.displayName || 'Your Builder',
            email: data.credentials.email,
            password: data.credentials.password,
            loginUrl,
          }),
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the whole operation if email fails
      }

      // Select the newly created client
      setSelectedClient(data.user);
      setClientEmail(data.user.email);
      setShowCreateClient(false);
      setNewClientName('');
      
      // Store credentials and show modal
      setNewClientCredentials({
        email: data.credentials.email,
        password: data.credentials.password,
        displayName: newClientName,
      });
      setShowCredentialsModal(true);
    } catch (err) {
      console.error('Failed to create client:', err);
      setError(err instanceof Error ? err.message : 'Failed to create client');
    } finally {
      setCreatingClient(false);
    }
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

  const handleCategoryToggle = (categoryId: string, required: boolean) => {
    setCategories(prev =>
      prev.map(cat => (cat.id === categoryId ? { ...cat, required } : cat))
    );
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;

    const newCategory: CategoryItem = {
      id: `custom-${Date.now()}`,
      name: newCategoryName.trim(),
      required: true,
      completedCount: 0,
      totalCount: 0,
    };

    setCategories(prev => [...prev, newCategory]);
    setNewCategoryName('');
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

      // Build rooms object matching schema from roomDetails
      const roomsObject: Record<string, number> = {
        bedrooms: 0,
        bathrooms: 0,
        offices: 0,
        kitchens: 0,
        livingRooms: 0,
        diningRooms: 0,
        laundryRooms: 0,
        garages: 0,
        other: 0,
      };

      // Count room types from roomDetails
      roomDetails.forEach(room => {
        const type = room.type.toLowerCase();
        if (type.includes('bedroom')) roomsObject.bedrooms += 1;
        else if (type.includes('bathroom')) roomsObject.bathrooms += 1;
        else if (type.includes('kitchen')) roomsObject.kitchens += 1;
        else if (type.includes('living')) roomsObject.livingRooms += 1;
        else if (type.includes('dining')) roomsObject.diningRooms += 1;
        else if (type.includes('laundry')) roomsObject.laundryRooms += 1;
        else if (type.includes('garage')) roomsObject.garages += 1;
        else if (type.includes('office')) roomsObject.offices += 1;
        else roomsObject.other += 1;
      });

      // Calculate total fixtures
      const totalFixturesCount = roomDetails.reduce((sum, room) => sum + room.fixtures.length, 0);

      // Step 1: Create project with schema-compliant structure
      const projectResponse: any = await apiClient.post('/api/projects', {
        name: projectName,
        builderOrgId: profile?.builderOrgId || user?.uid,
        clientId: selectedClient.uid,
        clientEmail: selectedClient.email, // Store email for easy access
        status: 'active', // Project is active immediately after creation
        address: address || '',
        startDate: new Date().toISOString(),
        rooms: roomsObject,
        fixtureCounts: {
          plumbingFixtures: totalFixturesCount,
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

      // Step 3: Create rooms and fixtures as subcollections
      for (const room of roomDetails) {
        // Create room
        const roomResponse = await apiClient.post('/api/rooms', {
          projectId,
          name: room.name,
          type: room.type.toLowerCase().replace(' ', '-'),
          fixtureCounts: {
            total: room.fixtures.length,
            assigned: 0,
          },
        });

        const roomId = roomResponse?.id || roomResponse?.roomId;

        // Find or create categories for fixtures and create items
        for (const fixture of room.fixtures) {
          // Find matching category by name
          const matchingCategory = requiredCategories.find(
            c => c.name.toLowerCase() === fixture.category.toLowerCase()
          );

          let categoryId = matchingCategory?.id;
          let categoryName = fixture.category;

          // If category doesn't exist, create it
          if (!matchingCategory) {
            const newCategoryResponse = await apiClient.post('/api/categories', {
              projectId,
              name: fixture.category,
              displayOrder: requiredCategories.length,
              required: false,
              allowanceType: 'fixed',
              allowanceAmount: 0,
              progress: {
                totalItems: 0,
                completedItems: 0,
              },
            });
            categoryId = newCategoryResponse?.id || newCategoryResponse?.categoryId;
          }

          // Create item (selection) as subcollection
          await apiClient.post('/api/items', {
            projectId,
            categoryId,
            categoryName,
            roomId,
            roomName: room.name,
            name: fixture.name,
            quantity: fixture.quantity,
            imageUrl: fixture.imageUrl || null,
            status: 'notStarted',
            allowance: 0,
            actualCost: 0,
            difference: 0,
            locked: false,
            createdBy: user?.uid,
          });
        }
      }

      // Step 4: Create paint selections as subcollection
      for (const paint of paintSelections) {
        await apiClient.post('/api/paint', {
          projectId,
          colorName: paint.colorName,
          paintCode: paint.paintCode,
          sheen: paint.sheen,
          notes: paint.notes,
          image: paint.image,
          assignmentType: paint.assignmentType,
          areas: paint.areas || [],
          roomIds: paint.roomIds || [],
          roomNames: paint.roomNames || [],
          createdBy: user?.uid,
        });
      }

      // Step 5: Save as template if requested
      if (saveAsTemplate && templateName.trim()) {
        const builderOrgId = profile?.builderOrgId || user?.uid;
        await apiClient.post('/api/templates', {
          name: templateName,
          builderOrgId,
          rooms: roomsObject,
          fixtureCounts: {
            plumbingFixtures: totalFixturesCount,
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
        return roomDetails.length > 0;
      case 'paint':
        return true; // Paint is optional
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
                      setSelectedClient(null); // Clear selection when typing
                      searchClients(e.target.value);
                    }}
                    placeholder="Search client by email"
                    required
                  />
                  
                  {/* Search Results Dropdown */}
                  {clientSearchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-300 rounded-button shadow-lg z-10 max-h-60 overflow-y-auto">
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
                  
                  {/* Searching Indicator */}
                  {searchingClient && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-300 rounded-button shadow-lg z-10 p-3">
                      <div className="text-sm text-neutral-600">Searching...</div>
                    </div>
                  )}
                  
                  {/* Create New Client Option */}
                  {showCreateClient && !searchingClient && clientEmail.trim() && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-300 rounded-button shadow-lg z-10 p-4">
                      <div className="mb-3">
                        <div className="text-sm font-medium text-neutral-900 mb-1">No client found with this email</div>
                        <div className="text-xs text-neutral-600">Create a new client account?</div>
                      </div>
                      
                      <Input
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        placeholder="Enter client's full name"
                        className="mb-3"
                      />
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={handleCreateNewClient}
                          disabled={creatingClient || !newClientName.trim()}
                          className="flex-1"
                        >
                          {creatingClient ? 'Creating...' : 'Create Client'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowCreateClient(false);
                            setNewClientName('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                      
                      <div className="mt-3 p-2 bg-brass-50 border border-brass-200 rounded text-xs text-neutral-600">
                        <strong>Note:</strong> A random password will be generated and sent to the client's email.
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Selected Client Display */}
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

          {/* Step 2: Rooms & Fixtures */}
          {currentStep === 'rooms' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">
                  Rooms & Fixtures
                </h2>
                <p className="text-neutral-600">
                  Add rooms to your project and specify which fixtures are needed in each room.
                </p>
              </div>

              <DynamicRoomBuilder
                rooms={roomDetails}
                onChange={setRoomDetails}
              />
            </div>
          )}

          {/* Step 3: Paint */}
          {currentStep === 'paint' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">
                  Paint Selections
                </h2>
                <p className="text-neutral-600">
                  Configure paint colors and assign them to entire home areas or specific rooms. Paint selections are optional and can be added later.
                </p>
              </div>

              <PaintBuilder
                paintSelections={paintSelections}
                onChange={setPaintSelections}
                availableRooms={roomDetails.map(r => ({ id: r.id, name: r.name }))}
              />
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
                  Choose which categories are required for this project. You can also add custom categories.
                </p>
              </div>

              <CategoryChecklist
                categories={categories}
                onToggleRequired={handleCategoryToggle}
                builderMode={true}
                showProgress={false}
              />

              {/* Add Custom Category */}
              <Card className="bg-brass-50 border-brass-200">
                <h3 className="text-md font-semibold text-neutral-900 mb-3">
                  Add Custom Category
                </h3>
                <div className="flex gap-3">
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g., Window Treatments, Landscaping"
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAddCategory}
                    disabled={!newCategoryName.trim()}
                    variant="outline"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Category
                  </Button>
                </div>
              </Card>
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
                    <span className="text-neutral-600">Rooms Added:</span>
                    <span className="font-medium text-neutral-900">
                      {roomDetails.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Total Fixtures:</span>
                    <span className="font-medium text-neutral-900">
                      {roomDetails.reduce((sum, room) => sum + room.fixtures.length, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Paint Selections:</span>
                    <span className="font-medium text-neutral-900">
                      {paintSelections.length}
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

      {/* Credentials Modal */}
      {showCredentialsModal && newClientCredentials && (
        <CredentialsModal
          isOpen={showCredentialsModal}
          onClose={() => setShowCredentialsModal(false)}
          credentials={newClientCredentials}
          projectName={projectName}
        />
      )}
    </div>
  );
}
