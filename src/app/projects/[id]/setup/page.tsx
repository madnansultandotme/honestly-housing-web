'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import CategoryChecklist, { CategoryItem } from '@/components/ui/CategoryChecklist';
import AllowancePrompt, { AllowanceType } from '@/components/ui/AllowancePrompt';
import DynamicRoomBuilder, { RoomDetail } from '@/components/ui/DynamicRoomBuilder';
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

export default function BuilderProjectSetup() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Project data
  const [projectName, setProjectName] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [roomDetails, setRoomDetails] = useState<RoomDetail[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);

  // Square footage
  const [squareFootage, setSquareFootage] = useState(2500);

  // Category allowances
  const [allowances, setAllowances] = useState<CategoryAllowance[]>([]);

  // Template
  const [templateName, setTemplateName] = useState('');
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Check if user has permission to edit (not client)
    if (profile && profile.role === 'client') {
      router.push(`/projects/${projectId}`);
      return;
    }
    
    loadProject();
  }, [user, profile, projectId]);

  useEffect(() => {
    if (!user) return;
    loadTemplates();
  }, [user]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const project = await apiClient.get(`/projects/${projectId}`);
      setProjectName(project.name || '');
      setClientId(project.clientId || '');
      
      // Use clientEmail from project if available, otherwise fetch from users collection
      if (project.clientEmail) {
        setClientEmail(project.clientEmail);
      } else if (project.clientId) {
        try {
          const clientUser = await apiClient.get(`/users/${project.clientId}`);
          console.log('Client user data:', clientUser);
          setClientEmail(clientUser?.email || '');
        } catch (err) {
          console.error('Failed to load client email:', err);
        }
      }

      // Load rooms and items from subcollections
      try {
        const roomsData = await apiClient.get(`/rooms?projectId=${projectId}`);
        const itemsData = await apiClient.get(`/items?projectId=${projectId}`);
        
        console.log('Loaded rooms:', roomsData);
        console.log('Loaded items:', itemsData);
        
        if (Array.isArray(roomsData) && roomsData.length > 0) {
          // Convert rooms and items to RoomDetail format
          const loadedRoomDetails: RoomDetail[] = roomsData.map((room: any) => {
            // Find all items for this room
            const roomItems = Array.isArray(itemsData) 
              ? itemsData.filter((item: any) => item.roomId === room.id)
              : [];
            
            // Convert items to fixtures
            const fixtures = roomItems.map((item: any) => ({
              id: item.id,
              category: item.categoryName || 'Other',
              name: item.name,
              quantity: item.quantity || 1,
              imageUrl: item.imageUrl || undefined,
            }));
            
            return {
              id: room.id,
              name: room.name,
              type: room.type || 'other',
              fixtures,
            };
          });
          
          setRoomDetails(loadedRoomDetails);
        }
      } catch (err) {
        console.error('Failed to load rooms and items:', err);
      }

      if (project.squareFootage) {
        setSquareFootage(project.squareFootage);
      }

      // Load categories from subcollection
      try {
        const categoriesData = await apiClient.get(`/categories?projectId=${projectId}`);
        
        console.log('Loaded categories:', categoriesData);
        
        if (Array.isArray(categoriesData) && categoriesData.length > 0) {
          // Map categories to CategoryItem format
          const mappedCategories = categoriesData.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            required: cat.required !== false,
            completedCount: cat.progress?.completedItems || 0,
            totalCount: cat.progress?.totalItems || 0,
          }));
          setCategories(mappedCategories);
          
          // Initialize allowances from categories
          const initialAllowances = categoriesData.map((cat: any) => ({
            categoryId: cat.id,
            amount: cat.allowanceAmount || 0,
            type: (cat.allowanceType || 'fixed') as AllowanceType,
          }));
          setAllowances(initialAllowances);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    } catch (err) {
      console.error('Failed to load project:', err);
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const builderOrgId = profile?.builderOrgId || user?.uid;
      const data = await apiClient.get(`/templates?builderOrgId=${builderOrgId}`);
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const applyTemplate = async (templateId: string) => {
    if (!templateId) return;

    try {
      const builderOrgId = profile?.builderOrgId || user?.uid;
      const template = await apiClient.get(`/templates/${templateId}?builderOrgId=${builderOrgId}`);

      // Note: Templates don't store room details, only room counts
      // User will need to manually add rooms after applying template

      if (template.squareFootage) {
        setSquareFootage(template.squareFootage);
      }

      if (template.categories?.length) {
        setCategories(
          template.categories.map((cat: any) => ({
            id: cat.id || normalizeKey(cat.name),
            name: cat.name,
            required: cat.required !== false,
            completedCount: 0,
            totalCount: 0,
          }))
        );
      }

      if (template.allowances) {
        const templateAllowances = Object.entries(template.allowances).map(
          ([categoryId, value]) => ({
            categoryId,
            amount: (value as any).amount ?? 0,
            type: ((value as any).type as AllowanceType) || 'fixed',
          })
        );
        setAllowances(templateAllowances);
      }
    } catch (err) {
      console.error('Failed to apply template:', err);
      setError('Failed to apply template');
    }
  };

  const handleCategoryToggle = (categoryId: string, required: boolean) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === categoryId ? { ...cat, required } : cat))
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
    setAllowances((prev) => {
      const existing = prev.find((a) => a.categoryId === categoryId);
      if (existing) {
        return prev.map((a) =>
          a.categoryId === categoryId ? { ...a, amount, type } : a
        );
      }
      return [...prev, { categoryId, amount, type }];
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      const requiredCategories = categories.filter((c) => c.required);

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

      // Update project
      await apiClient.patch(`/projects/${projectId}`, {
        rooms: roomsObject,
        fixtureCounts: {
          plumbingFixtures: totalFixturesCount,
          lightingFixtures: 0,
        },
        squareFootage,
        allowances: allowances.reduce((acc, a) => {
          acc[a.categoryId] = { amount: a.amount, type: a.type };
          return acc;
        }, {} as Record<string, { amount: number; type: AllowanceType }>),
      });

      // Delete existing rooms and items (we'll recreate them)
      try {
        const existingRooms = await apiClient.get(`/rooms?projectId=${projectId}`);
        if (Array.isArray(existingRooms)) {
          for (const room of existingRooms) {
            await apiClient.delete(`/rooms/${room.id}?projectId=${projectId}`);
          }
        }
      } catch (err) {
        console.error('Failed to delete existing rooms:', err);
      }

      try {
        const existingItems = await apiClient.get(`/items?projectId=${projectId}`);
        if (Array.isArray(existingItems)) {
          for (const item of existingItems) {
            await apiClient.delete(`/items/${item.id}?projectId=${projectId}`);
          }
        }
      } catch (err) {
        console.error('Failed to delete existing items:', err);
      }

      // Create/update categories
      for (const category of requiredCategories) {
        await apiClient.post('/categories', {
          projectId,
          name: category.name,
          required: category.required,
        });
      }

      // Create rooms and fixtures
      for (const room of roomDetails) {
        // Create room
        const roomResponse = await apiClient.post('/rooms', {
          projectId,
          name: room.name,
          type: room.type.toLowerCase().replace(' ', '-'),
          fixtureCounts: {
            total: room.fixtures.length,
            assigned: 0,
          },
        });

        const roomId = roomResponse?.id || roomResponse?.roomId;

        // Create items (fixtures) for this room
        for (const fixture of room.fixtures) {
          // Find matching category by name
          const matchingCategory = requiredCategories.find(
            c => c.name.toLowerCase() === fixture.category.toLowerCase()
          );

          let categoryId = matchingCategory?.id;
          let categoryName = fixture.category;

          // If category doesn't exist, create it
          if (!matchingCategory) {
            const newCategoryResponse = await apiClient.post('/categories', {
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

          // Create item (selection)
          await apiClient.post('/items', {
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
            subType: fixture.category.toLowerCase() === 'paint colors' ? fixture.name.toLowerCase() : undefined,
            createdBy: user?.uid,
          });
        }
      }

      // Save as template if requested
      if (saveAsTemplate && templateName.trim()) {
        const builderOrgId = profile?.builderOrgId || user?.uid;
        await apiClient.post('/templates', {
          name: templateName,
          builderOrgId,
          rooms: roomsObject,
          fixtureCounts: {
            plumbingFixtures: totalFixturesCount,
            lightingFixtures: 0,
          },
          squareFootage,
          categories: requiredCategories.map(c => ({
            id: c.id,
            name: c.name,
            required: c.required,
          })),
          allowances: allowances.reduce((acc, a) => {
            acc[a.categoryId] = { amount: a.amount, type: a.type };
            return acc;
          }, {} as Record<string, { amount: number; type: AllowanceType }>),
        });
      }

      router.push(`/projects/${projectId}`);
    } catch (err) {
      console.error('Failed to save project setup:', err);
      setError('Failed to save project setup');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-taupe-50 flex items-center justify-center">
        <div className="text-neutral-600">Loading project...</div>
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
                onClick={() => router.back()}
                className="text-neutral-600 hover:text-neutral-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-display font-bold text-neutral-900">
                Edit Project Configuration: {projectName}
              </h1>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-button text-red-700">
            {error}
          </div>
        )}

        <Card className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Start from a template</h2>
              <p className="text-sm text-neutral-600">Apply a saved configuration to this project.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="px-4 py-2 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500"
              >
                <option value="">Select a template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <Button
                onClick={() => applyTemplate(selectedTemplateId)}
                disabled={!selectedTemplateId || templatesLoading}
                variant="outline"
              >
                {templatesLoading ? 'Loading...' : 'Apply Template'}
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Client Selection */}
            <Card>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Client</h2>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Client Email
                </label>
                <Input
                  type="email"
                  value={clientEmail}
                  placeholder="Client email address"
                  disabled
                />
                <p className="mt-2 text-xs text-neutral-500">
                  Client is set when the project is created and cannot be changed here.
                </p>
              </div>
            </Card>

            {/* Photos Link */}
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 mb-1">Project Photos</h2>
                  <p className="text-sm text-neutral-600">Upload and manage project photos</p>
                </div>
                <Button
                  onClick={() => router.push(`/projects/${projectId}/photos`)}
                  variant="outline"
                  size="sm"
                >
                  Manage Photos
                </Button>
              </div>
            </Card>

            {/* Rooms & Fixtures */}
            <Card>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Rooms & Fixtures</h2>
              <p className="text-sm text-neutral-600 mb-4">
                Add, edit, or remove rooms and their fixtures. Changes will be saved when you click "Save Configuration".
              </p>
              <DynamicRoomBuilder
                rooms={roomDetails}
                onChange={setRoomDetails}
              />
            </Card>

            {/* Square Footage */}
            <Card>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Square Footage</h2>
              <Input
                type="number"
                min="0"
                value={squareFootage}
                onChange={(e) => setSquareFootage(parseInt(e.target.value) || 0)}
                label="Total Square Footage"
              />
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Categories */}
            <Card>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                Required Categories
              </h2>
              <CategoryChecklist
                categories={categories}
                onToggleRequired={handleCategoryToggle}
                builderMode={true}
                showProgress={false}
              />
              
              {/* Add Custom Category */}
              <div className="mt-4 p-4 bg-brass-50 border border-brass-200 rounded-button">
                <h3 className="text-sm font-semibold text-neutral-900 mb-3">
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
                    size="sm"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add
                  </Button>
                </div>
              </div>
            </Card>

            {/* Category Allowances */}
            <Card>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                Category Budgets
              </h2>
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
            </Card>

            {/* Save as Template */}
            <Card>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                Save as Template
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="saveTemplate"
                    checked={saveAsTemplate}
                    onChange={(e) => setSaveAsTemplate(e.target.checked)}
                    className="w-4 h-4 text-brass-600 border-neutral-300 rounded focus:ring-brass-500"
                  />
                  <label htmlFor="saveTemplate" className="text-sm text-neutral-700">
                    Save this configuration as a reusable template
                  </label>
                </div>
                {saveAsTemplate && (
                  <Input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Template name (e.g., Standard 4BR Home)"
                  />
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

const normalizeKey = (value: string) => value.toLowerCase().trim().replace(/\s+/g, '-');
