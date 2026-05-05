'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function BuilderOrgPage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [orgId, setOrgId] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadOrg();
  }, [user, profile]);

  const loadOrg = async () => {
    try {
      setLoading(true);
      const existingOrgId = profile?.builderOrgId || '';
      setOrgId(existingOrgId);

      if (!existingOrgId) {
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/builder-orgs?builderOrgId=${existingOrgId}`);
      const data = await response.json();
      setName(data.builderOrg?.name || '');
    } catch (err) {
      console.error('Failed to load builder org:', err);
      setError('Failed to load organization');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);
      setError('');

      if (!orgId) {
        const response = await fetch('/api/builder-orgs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, ownerId: user.uid }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to create organization');
        }

        setOrgId(data.builderOrgId);

        await fetch(`/api/users/${user.uid}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ builderOrgId: data.builderOrgId }),
        });
      } else {
        const response = await fetch(`/api/builder-orgs/${orgId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update organization');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save organization');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-taupe-50 flex items-center justify-center">
        <div className="text-neutral-600">Loading organization...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-taupe-50">
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">Organization</h1>
          <p className="text-neutral-600">Manage your builder organization details.</p>
        </div>

        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            {orgId ? 'Edit Organization' : 'Create Organization'}
          </h2>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-button text-red-700 text-sm">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <Input
              label="Organization Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your company name"
            />
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : orgId ? 'Update Organization' : 'Create Organization'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
