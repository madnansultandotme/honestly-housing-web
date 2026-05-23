'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import CategoryChecklist, { CategoryItem } from '@/components/ui/CategoryChecklist';
import AllowancePrompt, { AllowanceType } from '@/components/ui/AllowancePrompt';
import type { RoomDetail } from '@/components/ui/DynamicRoomBuilder';
import RoomSelectionOptions from '@/components/ui/RoomSelectionOptions';
import PaintBuilder, { PaintDetail } from '@/components/ui/PaintBuilder';
import CabinetryBuilder, { CabinetryDetail } from '@/components/ui/CabinetryBuilder';
import TemplateViewer from '@/components/templates/TemplateViewer';
import { apiClient } from '@/lib/api/client';
import { countRoomsFromDetails } from '@/lib/projects/roomCounts';
import { uploadProjectDocument } from '@/lib/api/upload';

interface CategoryAllowance {
  categoryId: string;
  amount: number;
  type: AllowanceType;
}

const normalizeRoomKey = (value: string) => value.toLowerCase().trim().replace(/\s+/g, '-');

function dedupeRoomDetails(rooms: RoomDetail[]) {
  const mergedRooms = new Map<string, RoomDetail>();

  rooms.forEach((room) => {
    const roomKey = `${normalizeRoomKey(room.name)}|${normalizeRoomKey(room.type)}`;
    const existingRoom = mergedRooms.get(roomKey);

    if (!existingRoom) {
      mergedRooms.set(roomKey, {
        ...room,
        fixtures: [...room.fixtures],
      });
      return;
    }

    const existingFixtureKeys = new Set(
      existingRoom.fixtures.map(
        (fixture) => `${normalizeRoomKey(fixture.category)}|${normalizeRoomKey(fixture.name)}|${fixture.quantity}|${fixture.imageUrl || ''}`
      )
    );

    room.fixtures.forEach((fixture) => {
      const fixtureKey = `${normalizeRoomKey(fixture.category)}|${normalizeRoomKey(fixture.name)}|${fixture.quantity}|${fixture.imageUrl || ''}`;
      if (!existingFixtureKeys.has(fixtureKey)) {
        existingFixtureKeys.add(fixtureKey);
        existingRoom.fixtures.push(fixture);
      }
    });
  });

  return Array.from(mergedRooms.values());
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
  const [paintSelections, setPaintSelections] = useState<PaintDetail[]>([]);
  const [cabinetrySelections, setCabinetrySelections] = useState<CabinetryDetail[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);
  const [notesByRoomCategory, setNotesByRoomCategory] = useState<Record<string, string>>({});

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
  const [viewingTemplate, setViewingTemplate] = useState<any>(null);
  const [showTemplateViewer, setShowTemplateViewer] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [scopeOfWorks, setScopeOfWorks] = useState<Record<string, string>>({});
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocumentFile, setSelectedDocumentFile] = useState<File | null>(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);

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

          setRoomDetails(dedupeRoomDetails(loadedRoomDetails));

          const loadedNotes: Record<string, string> = {};
          if (Array.isArray(itemsData)) {
            itemsData.forEach((item: any) => {
              if (!item.notes) return;
              const key = `${item.roomId}-${normalizeRoomKey(item.categoryName || item.categoryId || '')}`;
              if (!loadedNotes[key]) {
                loadedNotes[key] = item.notes;
              }
            });
          }
          setNotesByRoomCategory(loadedNotes);
        } else if (project.initialRoomDetails && Array.isArray(project.initialRoomDetails)) {
          // If no rooms saved yet, seed from initialRoomDetails provided at project creation (template)
          const seeded: RoomDetail[] = project.initialRoomDetails.map((r: any) => ({
            id: r.id || `init-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
            name: r.name,
            type: r.type || 'other',
            fixtures: (r.fixtures || []).map((f: any) => ({
              id: f.id || `init-fixture-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
              category: f.category || 'Other',
              name: f.name,
              quantity: f.quantity || 0,
              imageUrl: f.imageUrl || undefined,
            })),
          }));
          setRoomDetails(dedupeRoomDetails(seeded));
        }
      } catch (err) {
        console.error('Failed to load rooms and items:', err);
      }

      // Load paint selections from subcollection
      try {
        const paintData = await apiClient.get(`/paint?projectId=${projectId}`);
        console.log('Loaded paint selections:', paintData);
        
        if (Array.isArray(paintData) && paintData.length > 0) {
          setPaintSelections(paintData.map((paint: any) => ({
            id: paint.id,
            colorName: paint.colorName,
            paintCode: paint.paintCode,
            sheen: paint.sheen,
            notes: paint.notes,
            image: paint.image,
            assignmentType: paint.assignmentType,
            areas: paint.areas || [],
            roomIds: paint.roomIds || [],
            roomNames: paint.roomNames || [],
          })));
        }
      } catch (err) {
        console.error('Failed to load paint selections:', err);
      }

      // Load cabinetry selections from subcollection
      try {
        const cabinetryData = await apiClient.get(`/cabinetry?projectId=${projectId}`);
        console.log('Loaded cabinetry selections:', cabinetryData);
        
        if (Array.isArray(cabinetryData) && cabinetryData.length > 0) {
          setCabinetrySelections(cabinetryData.map((cabinetry: any) => ({
            id: cabinetry.id,
            cabinetryType: cabinetry.cabinetryType,
            material: cabinetry.material,
            finish: cabinetry.finish,
            doorStyle: cabinetry.doorStyle,
            constructionType: cabinetry.constructionType,
            hardware: cabinetry.hardware,
            notes: cabinetry.notes,
            image: cabinetry.image,
            assignmentType: cabinetry.assignmentType,
            areas: cabinetry.areas || [],
            roomIds: cabinetry.roomIds || [],
            roomNames: cabinetry.roomNames || [],
          })));
        }
      } catch (err) {
        console.error('Failed to load cabinetry selections:', err);
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

          // Load scope of work
          const loadedScopes: Record<string, string> = {};
          categoriesData.forEach((cat: any) => {
            if (cat.scopeOfWork) loadedScopes[cat.id] = cat.scopeOfWork;
          });
          setScopeOfWorks(loadedScopes);
          
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

      // Apply room details from template
      if (template.roomDetails && Array.isArray(template.roomDetails) && template.roomDetails.length > 0) {
        const seededRooms = template.roomDetails.map((rd: any) => ({
          id: `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: rd.name,
          type: rd.type || 'other',
          fixtures: (rd.fixtures || []).map((f: any) => ({
            id: `tpl-fix-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            category: f.category || 'Other',
            name: f.name,
            quantity: f.quantity || 1,
            imageUrl: f.imageUrl || undefined,
          })),
        }));
        setRoomDetails(seededRooms);
      }

      if (template.squareFootage) {
        setSquareFootage(template.squareFootage);
      }

      if (template.categories?.length) {
        const seenNames = new Set<string>();
        const dedupedCategories = template.categories
          .filter((cat: any) => {
            const key = cat.name.toLowerCase();
            if (seenNames.has(key)) return false;
            seenNames.add(key);
            return true;
          })
          .map((cat: any) => ({
            id: cat.id || cat.name.toLowerCase().replace(/\s+/g, "-"),
            name: cat.name,
            required: cat.required !== false,
            completedCount: 0,
            totalCount: 0,
          }));
        setCategories(dedupedCategories);
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

  const handleViewTemplate = async (templateId: string) => {
    if (!templateId) return;
    try {
      const builderOrgId = profile?.builderOrgId || user?.uid;
      const template = await apiClient.get(`/templates/${templateId}?builderOrgId=${builderOrgId}`);
      setViewingTemplate(template);
      setShowTemplateViewer(true);
    } catch (err) {
      console.error('Failed to load template:', err);
      setError('Failed to load template');
    }
  };

  // Document upload handlers
  const handleDocumentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setSelectedDocumentFile(f);
  };

  const handleUploadDocument = async () => {
    if (!selectedDocumentFile || !user) return;
    try {
      setUploadingDocument(true);
      // Upload to Firebase Storage
      const downloadUrl = await uploadProjectDocument(selectedDocumentFile, projectId, user.uid);
      // Persist metadata via API
      const res = await apiClient.post('/documents', {
        projectId,
        name: selectedDocumentFile.name,
        url: downloadUrl,
        mimeType: selectedDocumentFile.type,
        createdBy: user?.uid,
      });
      const newDoc = { id: res?.id || res?.documentId, name: selectedDocumentFile.name, url: downloadUrl, mimeType: selectedDocumentFile.type, createdAt: new Date().toISOString() };
      setDocuments((prev) => [newDoc, ...prev]);
      setSelectedDocumentFile(null);
    } catch (err) {
      console.error('Failed to upload document:', err);
      setError('Failed to upload document');
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Delete this document?')) return;
    try {
      await apiClient.delete(`/documents?projectId=${projectId}&documentId=${documentId}`);
      setDocuments((prev) => prev.filter(d => d.id !== documentId));
    } catch (err) {
      console.error('Failed to delete document:', err);
      setError('Failed to delete document');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const builderOrgId = profile?.builderOrgId || user?.uid;
      await apiClient.delete(`/templates/${templateId}?builderOrgId=${builderOrgId}`);
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      setShowTemplateViewer(false);
      setViewingTemplate(null);
      if (selectedTemplateId === templateId) setSelectedTemplateId('');
    } catch (err) {
      console.error('Failed to delete template:', err);
      setError('Failed to delete template');
    }
  };

  const handleCategoryToggle = (categoryId: string, required: boolean) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === categoryId ? { ...cat, required } : cat))
    );
  };

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    if (categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('A category with this name already exists');
      return;
    }

    const newCategory: CategoryItem = {
      id: `custom-${Date.now()}`,
      name: trimmed,
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
      const missingScope = requiredCategories.filter(
        category => !scopeOfWorks[category.id] || scopeOfWorks[category.id].trim().length === 0
      );

      if (missingScope.length > 0) {
        setError('Scope of work is required for all required categories.');
        return;
      }

      // Build rooms object from the actual room details that will be saved
      const uniqueRoomDetails = dedupeRoomDetails(roomDetails);
      const roomsObject = countRoomsFromDetails(uniqueRoomDetails);

      // Calculate total fixtures
      const totalFixturesCount = uniqueRoomDetails.reduce((sum, room) => sum + room.fixtures.length, 0);

      // Update project
      await apiClient.patch(`/projects/${projectId}`, {
        rooms: roomsObject,
        fixtureCounts: {
          plumbingFixtures: totalFixturesCount,
          lightingFixtures: uniqueRoomDetails.reduce((sum, room) => sum + room.fixtures.filter(f => f.category === 'Electrical').length, 0),
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

      // Delete existing categories before recreating
      try {
        const existingCategories = await apiClient.get(`/categories?projectId=${projectId}`);
        if (Array.isArray(existingCategories)) {
          for (const category of existingCategories) {
            await apiClient.delete(`/categories?projectId=${projectId}&categoryId=${category.id}`);
          }
        }
      } catch (err) {
        console.error('Failed to delete existing categories:', err);
      }

      // Track created category names to prevent duplicates
      const createdCategoryNames = new Set<string>();
      const createdRoomIdsByPreviousId = new Map<string, string>();
      const createdRoomNamesByPreviousId = new Map<string, string>();

      // Create/update categories (save ALL categories, not just required)
      for (const category of categories) {
        const normalizedName = category.name.toLowerCase();
        if (createdCategoryNames.has(normalizedName)) continue;
        createdCategoryNames.add(normalizedName);
        await apiClient.post('/categories', {
          projectId,
          name: category.name,
          required: category.required,
          scopeOfWork: scopeOfWorks[category.id] || null,
        });
      }

      // Create rooms and fixtures
      for (const room of uniqueRoomDetails) {
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
        if (!roomId) {
          throw new Error(`Failed to create room: ${room.name}`);
        }

        createdRoomIdsByPreviousId.set(room.id, roomId);
        createdRoomNamesByPreviousId.set(room.id, room.name);

        // Create items (fixtures) for this room
        for (const fixture of room.fixtures) {
          // Find matching category by name (use all categories, not just required)
          const matchingCategory = categories.find(
            c => c.name.toLowerCase() === fixture.category.toLowerCase()
          );

          let categoryId = matchingCategory?.id;
          let categoryName = fixture.category;

          // If category doesn't exist, create it (with dedup check)
          if (!matchingCategory) {
            const normalizedFixtureCat = fixture.category.toLowerCase();
            if (!createdCategoryNames.has(normalizedFixtureCat)) {
              createdCategoryNames.add(normalizedFixtureCat);
              const newCategoryResponse = await apiClient.post('/categories', {
                projectId,
                name: fixture.category,
                displayOrder: categories.length,
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
            notes: notesByRoomCategory[`${room.id}-${normalizeRoomKey(fixture.category)}`] || null,
            status: 'notStarted',
            allowance: 0,
            actualCost: 0,
            difference: 0,
            locked: false,
            createdBy: user?.uid,
          });
        }
      }

      const mapPersistedRoomIds = (roomIds: string[] = []) =>
        roomIds.map((roomId) => createdRoomIdsByPreviousId.get(roomId) || roomId);

      const mapPersistedRoomNames = (roomIds: string[] = [], roomNames: string[] = []) =>
        roomIds.length > 0
          ? roomIds.map((roomId, index) => createdRoomNamesByPreviousId.get(roomId) || roomNames[index] || '')
          : roomNames;

      // Delete existing paint selections and recreate them
      try {
        const existingPaint = await apiClient.get(`/paint?projectId=${projectId}`);
        if (Array.isArray(existingPaint)) {
          for (const paint of existingPaint) {
            await apiClient.delete(`/paint/${paint.id}?projectId=${projectId}`);
          }
        }
      } catch (err) {
        console.error('Failed to delete existing paint selections:', err);
      }

      // Create paint selections
      for (const paint of paintSelections) {
        await apiClient.post('/paint', {
          projectId,
          colorName: paint.colorName,
          paintCode: paint.paintCode,
          sheen: paint.sheen,
          notes: paint.notes,
          image: paint.image,
          assignmentType: paint.assignmentType,
          areas: paint.areas || [],
          roomIds: mapPersistedRoomIds(paint.roomIds),
          roomNames: mapPersistedRoomNames(paint.roomIds, paint.roomNames),
          createdBy: user?.uid,
        });
      }

      // Delete existing cabinetry selections and recreate them
      try {
        const existingCabinetry = await apiClient.get(`/cabinetry?projectId=${projectId}`);
        if (Array.isArray(existingCabinetry)) {
          for (const cabinetry of existingCabinetry) {
            await apiClient.delete(`/cabinetry/${cabinetry.id}?projectId=${projectId}`);
          }
        }
      } catch (err) {
        console.error('Failed to delete existing cabinetry selections:', err);
      }

      // Create cabinetry selections
      for (const cabinetry of cabinetrySelections) {
        await apiClient.post('/cabinetry', {
          projectId,
          cabinetryType: cabinetry.cabinetryType,
          material: cabinetry.material,
          finish: cabinetry.finish,
          doorStyle: cabinetry.doorStyle,
          constructionType: cabinetry.constructionType,
          hardware: cabinetry.hardware,
          notes: cabinetry.notes,
          image: cabinetry.image,
          assignmentType: cabinetry.assignmentType,
          areas: cabinetry.areas || [],
          roomIds: mapPersistedRoomIds(cabinetry.roomIds),
          roomNames: mapPersistedRoomNames(cabinetry.roomIds, cabinetry.roomNames),
          createdBy: user?.uid,
        });
      }

        // Load project documents
        try {
          const docsData = await apiClient.get(`/documents?projectId=${projectId}`);
          if (Array.isArray(docsData)) setDocuments(docsData);
        } catch (err) {
          console.error('Failed to load project documents:', err);
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
            lightingFixtures: roomDetails.reduce((sum, room) => sum + room.fixtures.filter(f => f.category === 'Electrical').length, 0),
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
              <Button
                onClick={() => handleViewTemplate(selectedTemplateId)}
                disabled={!selectedTemplateId}
                variant="outline"
              >
                View
              </Button>
              <Button
                onClick={() => {
                  if (selectedTemplateId && confirm('Delete this template?')) handleDeleteTemplate(selectedTemplateId);
                }}
                disabled={!selectedTemplateId}
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Delete
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

            {/* Project Documents */}
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 mb-1">Project Documents</h2>
                  <p className="text-sm text-neutral-600">Upload construction contracts or other project documents</p>
                </div>
              </div>

              <div className="mt-4">
                <input
                  type="file"
                  onChange={handleDocumentFileChange}
                  className="mb-3"
                />
                <div className="flex gap-3">
                  <Button onClick={handleUploadDocument} disabled={!selectedDocumentFile || uploadingDocument}>
                    {uploadingDocument ? 'Uploading...' : 'Upload Document'}
                  </Button>
                  {selectedDocumentFile && (
                    <div className="text-sm text-neutral-600 self-center">{selectedDocumentFile.name}</div>
                  )}
                </div>

                {documents.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 border border-neutral-100 rounded-button bg-white">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium text-neutral-900">{doc.name}</div>
                          <div className="text-xs text-neutral-500">{new Date(doc.createdAt || Date.now()).toLocaleDateString()}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a href={doc.url} target="_blank" rel="noreferrer" className="text-brass-600 hover:underline">Download</a>
                          <button onClick={() => handleDeleteDocument(doc.id)} className="text-red-600">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

            {/* Room Selection Options */}
            <Card>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Room Selection Options</h2>
              <p className="text-sm text-neutral-600 mb-4">
                Choose the predefined selection items needed for each room type. Changes will be saved when you click "Save Configuration".
              </p>
              <RoomSelectionOptions
                rooms={roomDetails}
                onChange={setRoomDetails}
                notesByRoomCategory={notesByRoomCategory}
                onNotesChange={(roomId, category, notes) =>
                  setNotesByRoomCategory((prev) => ({
                    ...prev,
                    [`${roomId}-${normalizeRoomKey(category)}`]: notes,
                  }))
                }
              />
            </Card>

            {/* Paint Selections */}
            <Card>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Paint Selections</h2>
              <p className="text-sm text-neutral-600 mb-4">
                Configure paint colors and assign them to entire home areas or specific rooms. Paint selections are separate from room fixtures.
              </p>
              <PaintBuilder
                paintSelections={paintSelections}
                onChange={setPaintSelections}
                availableRooms={roomDetails.map(r => ({ id: r.id, name: r.name }))}
              />
            </Card>

            {/* Cabinetry Selections */}
            <Card>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Cabinetry Selections</h2>
              <p className="text-sm text-neutral-600 mb-4">
                Configure cabinetry selections and assign them to entire home areas or specific rooms. Cabinetry is separate from room fixtures.
              </p>
              <CabinetryBuilder
                cabinetrySelections={cabinetrySelections}
                onChange={setCabinetrySelections}
                availableRooms={roomDetails.map(r => ({ id: r.id, name: r.name }))}
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
                scopeOfWorks={scopeOfWorks}
                onScopeChange={(id, text) => setScopeOfWorks(prev => ({ ...prev, [id]: text }))}
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

      {/* Template Viewer Modal */}
      <TemplateViewer
        isOpen={showTemplateViewer}
        onClose={() => { setShowTemplateViewer(false); setViewingTemplate(null); }}
        onDelete={handleDeleteTemplate}
        template={viewingTemplate}
      />
      </main>
    </div>
  );
}

const normalizeKey = (value: string) => value.toLowerCase().trim().replace(/\s+/g, '-');
