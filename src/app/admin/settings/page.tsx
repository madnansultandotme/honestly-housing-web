'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import AdminHeader from '@/components/navigation/AdminHeader';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { LoadingOverlay } from '@/components/ui/LoadingSpinner';
import {
  DEFAULT_SETUP_DESIGN,
  DEFAULT_STANDARD_ROOMS,
  SetupDesignConfig,
  SetupDesignOption,
  StandardRoomDefault,
} from '@/lib/setupDesign/defaults';

const cloneConfig = (config: SetupDesignConfig): SetupDesignConfig => JSON.parse(JSON.stringify(config));
const cloneRooms = (rooms: StandardRoomDefault[]): StandardRoomDefault[] => JSON.parse(JSON.stringify(rooms));
const toRoomType = (name: string) => name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function AdminSettingsPage() {
  const { user, profile } = useAuth();
  const { confirm, showError, showSuccess } = useNotification();
  const router = useRouter();
  const [setupDesign, setSetupDesign] = useState<SetupDesignConfig>(() => cloneConfig(DEFAULT_SETUP_DESIGN));
  const [standardRooms, setStandardRooms] = useState<StandardRoomDefault[]>(() => cloneRooms(DEFAULT_STANDARD_ROOMS));
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newOption, setNewOption] = useState({
    groupKey: 'bathroom',
    category: '',
    name: '',
    measureLabel: 'Quantity',
  });

  const loadSetupDesign = useCallback(async () => {
    try {
      setLoadingSettings(true);
      const response = await fetch('/api/setup-design');
      const data = await response.json();
      setSetupDesign(data.config || DEFAULT_SETUP_DESIGN);
      setStandardRooms(Array.isArray(data.standardRooms) ? data.standardRooms : DEFAULT_STANDARD_ROOMS);
    } catch (error) {
      console.error('Failed to load setup design:', error);
      showError('Failed to load setup design settings');
      setSetupDesign(cloneConfig(DEFAULT_SETUP_DESIGN));
      setStandardRooms(cloneRooms(DEFAULT_STANDARD_ROOMS));
    } finally {
      setLoadingSettings(false);
    }
  }, [showError]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (profile && profile.role !== 'admin') {
      router.push('/builder');
      return;
    }

    if (profile?.role === 'admin') {
      void Promise.resolve().then(loadSetupDesign);
    }
  }, [loadSetupDesign, user, profile, router]);

  const handleAddOption = () => {
    const category = newOption.category.trim();
    const name = newOption.name.trim();
    const measureLabel = newOption.measureLabel.trim() || 'Quantity';
    if (!category || !name) return;

    setSetupDesign((current) => {
      const group = current[newOption.groupKey];
      if (!group) return current;

      const alreadyExists = group.options.some(
        (option) =>
          option.category.trim().toLowerCase() === category.toLowerCase() &&
          option.name.trim().toLowerCase() === name.toLowerCase()
      );

      if (alreadyExists) {
        showError('That setup option already exists for this group');
        return current;
      }

      return {
        ...current,
        [newOption.groupKey]: {
          ...group,
          options: [...group.options, { category, name, measureLabel }],
        },
      };
    });

    setNewOption((current) => ({ ...current, category: '', name: '', measureLabel: 'Quantity' }));
  };

  const handleAddRoom = () => {
    const displayName = newRoomName.trim();
    const type = toRoomType(displayName);
    if (!displayName || !type) return;

    if (standardRooms.some((room) => room.type === type)) {
      showError('That standard room already exists');
      return;
    }

    setStandardRooms((current) => [...current, { type, displayName }]);
    setNewRoomName('');
  };

  const handleRemoveRoom = (type: string) => {
    setStandardRooms((current) => current.filter((room) => room.type !== type));
  };

  const handleRemoveOption = (groupKey: string, optionToRemove: SetupDesignOption) => {
    setSetupDesign((current) => ({
      ...current,
      [groupKey]: {
        ...current[groupKey],
        options: current[groupKey].options.filter(
          (option) =>
            !(
              option.category === optionToRemove.category &&
              option.name === optionToRemove.name &&
              option.measureLabel === optionToRemove.measureLabel
            )
        ),
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = await user?.getIdToken();
      const response = await fetch('/api/setup-design', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ config: setupDesign, standardRooms }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save setup design');
      }

      setSetupDesign(data.config || setupDesign);
      setStandardRooms(data.standardRooms || standardRooms);
      showSuccess('Setup design defaults saved');
    } catch (error) {
      console.error('Failed to save setup design:', error);
      showError(error instanceof Error ? error.message : 'Failed to save setup design');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const confirmed = await confirm(
      'Reset setup design defaults back to the built-in list? This affects future project setup screens.',
      'Reset Setup Design'
    );

    if (confirmed) {
      setSetupDesign(cloneConfig(DEFAULT_SETUP_DESIGN));
      setStandardRooms(cloneRooms(DEFAULT_STANDARD_ROOMS));
    }
  };

  if (!profile || loadingSettings) {
    return <LoadingOverlay fullScreen message="Loading settings..." />;
  }

  if (profile.role !== 'admin') {
    return null;
  }

  const groupEntries = Object.entries(setupDesign);

  return (
    <div className="min-h-screen bg-taupe-50">
      <AdminHeader
        title="System Settings"
        subtitle="Configure system-wide setup defaults"
        showBackButton
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold text-neutral-900">Setup Design Defaults</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Manage the room setup options used when creating or configuring new projects.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} disabled={saving}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <h3 className="mb-2 text-lg font-semibold text-neutral-900">Standard Rooms</h3>
          <p className="mb-4 text-sm text-neutral-600">
            These rooms appear in the pre-populated room checklist for new project setup.
          </p>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <input
              type="text"
              value={newRoomName}
              onChange={(event) => setNewRoomName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleAddRoom();
                }
              }}
              placeholder="Room name, e.g. Wine Cellar"
              className="rounded-button border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brass-500"
            />
            <Button onClick={handleAddRoom} disabled={!newRoomName.trim()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Room
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {standardRooms.map((room) => (
              <div
                key={room.type}
                className="flex items-center justify-between gap-3 rounded-button border border-neutral-200 bg-white px-4 py-3"
              >
                <div>
                  <div className="font-medium text-neutral-900">{room.displayName}</div>
                  <div className="text-xs text-neutral-500">{room.type}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveRoom(room.type)}
                  className="rounded-button p-2 text-red-600 transition-colors hover:bg-red-50"
                  title={`Remove ${room.displayName}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="mb-6">
          <h3 className="mb-4 text-lg font-semibold text-neutral-900">Add Setup Option</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <select
              value={newOption.groupKey}
              onChange={(event) => setNewOption((current) => ({ ...current, groupKey: event.target.value }))}
              className="rounded-button border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brass-500"
            >
              {groupEntries.map(([groupKey, group]) => (
                <option key={groupKey} value={groupKey}>
                  {group.title}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={newOption.category}
              onChange={(event) => setNewOption((current) => ({ ...current, category: event.target.value }))}
              placeholder="Category, e.g. Tile"
              className="rounded-button border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brass-500"
            />
            <input
              type="text"
              value={newOption.name}
              onChange={(event) => setNewOption((current) => ({ ...current, name: event.target.value }))}
              placeholder="Option, e.g. Shower Floor Tile"
              className="md:col-span-2 rounded-button border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brass-500"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={newOption.measureLabel}
                onChange={(event) => setNewOption((current) => ({ ...current, measureLabel: event.target.value }))}
                placeholder="Measurement"
                className="min-w-0 flex-1 rounded-button border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brass-500"
              />
              <button
                type="button"
                onClick={handleAddOption}
                disabled={!newOption.category.trim() || !newOption.name.trim()}
                className="inline-flex items-center rounded-button bg-brass-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brass-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          {groupEntries.map(([groupKey, group]) => {
            const categories = Array.from(new Set(group.options.map((option) => option.category)));

            return (
              <Card key={groupKey}>
                <div className="mb-5">
                  <h3 className="text-xl font-display font-semibold text-neutral-900">{group.title}</h3>
                  <p className="mt-1 text-sm text-neutral-600">{group.appliesTo}</p>
                </div>

                <div className="space-y-5">
                  {categories.map((category) => (
                    <div key={category}>
                      <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-600">
                        {category}
                      </h4>
                      <div className="divide-y divide-neutral-100 rounded-button border border-neutral-200 bg-white">
                        {group.options
                          .filter((option) => option.category === category)
                          .map((option) => (
                            <div
                              key={`${groupKey}-${option.category}-${option.name}`}
                              className="flex items-center justify-between gap-3 px-4 py-3"
                            >
                              <div>
                                <div className="font-medium text-neutral-900">{option.name}</div>
                                <div className="text-sm text-neutral-600">{option.measureLabel}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(groupKey, option)}
                                className="rounded-button p-2 text-red-600 transition-colors hover:bg-red-50"
                                title={`Remove ${option.name}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
