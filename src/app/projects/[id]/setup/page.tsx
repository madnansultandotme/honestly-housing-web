'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  const [rooms, setRooms] = useState<RoomConfig[]>(DEFAULT_ROOMS);
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);

  // Fixture counts
  const [bedroomCount, setBedroomCount] = useState(4);
  const [bathroomCount, setBathroomCount] = useState(3);
  const [officeCount, setOfficeCount] = useState(1);
  const [totalFixtures, setTotalFixtures] = useState(0);

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
      const project = await apiClient.get(`/api/projects/${projectId}`);
      setProjectName(project.name || '');
      setClientId(project.clientId || '');
      
      // Use clientEmail from project if available, otherwise fetch from users collection
      if (project.clientEmail) {
        setClientEmail(project.clientEmail);
      } else if (project.clientId) {
        try {
          const clientUser = await apiClient.get(`/api/users/${project.clientId}`);
          console.log('Client user data:', clientUser);
          setClientEmail(clientUser?.email || '');
        } catch (err) {
          console.error('Failed to load client email:', err);
        }
      }

      // Load existing configuration if available
      if (project.rooms && typeof project.rooms === 'object') {
        // project.rooms is an object like { bedrooms: 3, bathrooms: 2, ... }
        // We need to check the rooms subcollection instead
        const roomsData = await apiClient.get(`/rooms?projectId=${projectId}`);
        if (roomsData && roomsData.length > 0) {
          setRooms((prev) =>
            prev.map((room) => {
              const storedRoom = roomsData.find((item: any) => item.roomKey === room.id);
              if (!storedRoom) return room;
              return {
                ...room,
                selected: true,
                requiredFixtures: storedRoom.requiredFixtures ?? room.requiredFixtures,
              };
            })
          );
        }
      } else {
        // Fallback: load from rooms API
        const roomsData = await apiClient.get(`/rooms?projectId=${projectId}`);
        if (roomsData && roomsData.length > 0) {
          setRooms((prev) =>
            prev.map((room) => {
              const storedRoom = roomsData.find((item: any) => item.roomKey === room.id);
              if (!storedRoom) return room;
              return {
                ...room,
                selected: true,
                requiredFixtures: storedRoom.requiredFixtures ?? room.requiredFixtures,
              };
            })
          );
        }
      }

      if (project.counts) {
        setBedroomCount(project.counts.bedrooms || 4);
        setBathroomCount(project.counts.bathrooms || 3);
        setOfficeCount(project.counts.offices || 1);
        setTotalFixtures(project.counts.fixtures || 0);
      }

      if (project.squareFootage) {
        setSquareFootage(project.squareFootage);
      }

      // Load categories
      const categoriesData = await apiClient.get(`/api/categories?projectId=${projectId}`);
      if (categoriesData.length > 0) {
        setCategories(categoriesData);
      }

      // Initialize allowances
      const initialAllowances = categories.map((cat) => ({
        categoryId: cat.id,
        amount: 0,
        type: 'fixed' as AllowanceType,
      }));
      setAllowances(initialAllowances);
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
      const data = await apiClient.get(`/api/templates?builderOrgId=${builderOrgId}`);
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
      const template = await apiClient.get(`/api/templates/${templateId}?builderOrgId=${builderOrgId}`);

      if (template.rooms?.length) {
        setRooms((prev) =>
          prev.map((room) => ({
            ...room,
            selected: template.rooms.includes(room.id),
          }))
        );
      }

      if (template.counts) {
        setBedroomCount(template.counts.bedrooms || 0);
        setBathroomCount(template.counts.bathrooms || 0);
        setOfficeCount(template.counts.offices || 0);
        setTotalFixtures(template.counts.fixtures || 0);
      }

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

  const handleRoomToggle = (roomId: string) => {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId ? { ...room, selected: !room.selected } : room
      )
    );
  };

  const handleRoomFixturesChange = (roomId: string, value: number) => {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId
          ? { ...room, requiredFixtures: value < 1 ? 1 : value }
          : room
      )
    );
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

      const selectedRooms = rooms.filter((r) => r.selected).map((r) => r.id);
      const requiredCategories = categories.filter((c) => c.required);

      // Update project
      await apiClient.patch(`/api/projects/${projectId}`, {
        rooms: selectedRooms,
        counts: {
          bedrooms: bedroomCount,
          bathrooms: bathroomCount,
          offices: officeCount,
          fixtures: totalFixtures,
        },
        squareFootage,
        allowances: allowances.reduce((acc, a) => {
          acc[a.categoryId] = { amount: a.amount, type: a.type };
          return acc;
        }, {} as Record<string, { amount: number; type: AllowanceType }>),
      });

      // Create/update categories
      for (const category of requiredCategories) {
        await apiClient.post('/api/categories', {
          projectId,
          name: category.name,
          required: category.required,
        });
      }

      // Create/update rooms
      for (const room of rooms.filter((r) => r.selected)) {
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

      // Save as template if requested
      if (saveAsTemplate && templateName.trim()) {
        const builderOrgId = profile?.builderOrgId || user?.uid;
        await apiClient.post('/api/templates', {
          name: templateName,
          builderOrgId,
          rooms: selectedRooms,
          counts: {
            bedrooms: bedroomCount,
            bathrooms: bathroomCount,
            offices: officeCount,
            fixtures: totalFixtures,
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

            {/* Room Selection */}
            <Card>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Select Rooms</h2>
              <div className="grid grid-cols-2 gap-2">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className={`
                      p-3 rounded-button border-2 text-left transition-all
                      ${
                        room.selected
                          ? 'border-brass-600 bg-brass-50'
                          : 'border-neutral-200 bg-taupe-50 hover:border-neutral-300'
                      }
                    `}
                  >
                    <button
                      onClick={() => handleRoomToggle(room.id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`
                          w-4 h-4 rounded border-2 flex items-center justify-center
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
                    {room.selected && (
                      <div className="mt-2">
                        <label className="block text-xs text-neutral-600 mb-1">
                          Required fixtures
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={room.requiredFixtures}
                          onChange={(e) =>
                            handleRoomFixturesChange(room.id, parseInt(e.target.value, 10) || 1)
                          }
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Counts */}
            <Card>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Room & Fixture Counts</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Bedrooms
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={bedroomCount}
                    onChange={(e) => setBedroomCount(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Bathrooms
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={bathroomCount}
                    onChange={(e) => setBathroomCount(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Offices
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={officeCount}
                    onChange={(e) => setOfficeCount(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Total Fixtures
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={totalFixtures}
                    onChange={(e) => setTotalFixtures(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Square Footage
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={squareFootage}
                    onChange={(e) => setSquareFootage(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
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
