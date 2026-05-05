'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import BuilderHeader from '@/components/navigation/BuilderHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { LoadingOverlay } from '@/components/ui/LoadingSpinner';
import { apiClient } from '@/lib/api/client';

interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'builder' | 'designer' | 'client' | 'admin';
  createdAt: string;
  projectIds?: string[];
}

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'builder' | 'designer' | 'client' | 'admin'>('client');
  const [error, setError] = useState('');

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
      loadUser();
    }
  }, [user, profile, router, id]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get(`/admin/users/${id}`);
      setUserData(data);
      setDisplayName(data.displayName || '');
      setEmail(data.email || '');
      setRole(data.role || 'client');
    } catch (error) {
      console.error('Failed to load user:', error);
      setError('Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      await apiClient.patch(`/admin/users/${id}`, {
        displayName,
        email,
        role,
      });

      router.push('/admin/users');
    } catch (err: any) {
      console.error('Failed to update user:', err);
      setError(err.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return <LoadingOverlay fullScreen message="Loading user..." />;
  }

  if (profile.role !== 'admin' || !userData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-taupe-50">
      <BuilderHeader
        title="Edit User"
        subtitle={userData.email}
        showBackButton
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-button text-sm">
                {error}
              </div>
            )}

            {/* User Info */}
            <div className="pb-6 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">User Information</h3>
              <p className="text-sm text-neutral-600">
                User ID: <span className="font-mono text-neutral-900">{userData.uid}</span>
              </p>
              <p className="text-sm text-neutral-600">
                Created: {new Date(userData.createdAt).toLocaleString()}
              </p>
              <p className="text-sm text-neutral-600">
                Projects: {userData.projectIds?.length || 0}
              </p>
            </div>

            {/* Display Name */}
            <Input
              label="Display Name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              placeholder="Enter display name"
            />

            {/* Email */}
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter email address"
            />

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Role
              </label>
              <div className="space-y-2">
                <label className="flex items-center p-3 border-2 border-neutral-200 rounded-button hover:border-brass-500 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="role"
                    value="builder"
                    checked={role === 'builder'}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-neutral-900">Builder</div>
                    <div className="text-xs text-neutral-600">Full project management access</div>
                  </div>
                </label>

                <label className="flex items-center p-3 border-2 border-neutral-200 rounded-button hover:border-brass-500 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="role"
                    value="designer"
                    checked={role === 'designer'}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-neutral-900">Designer</div>
                    <div className="text-xs text-neutral-600">Curate and manage selections</div>
                  </div>
                </label>

                <label className="flex items-center p-3 border-2 border-neutral-200 rounded-button hover:border-brass-500 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="role"
                    value="client"
                    checked={role === 'client'}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-neutral-900">Client</div>
                    <div className="text-xs text-neutral-600">View and approve selections</div>
                  </div>
                </label>

                <label className="flex items-center p-3 border-2 border-neutral-200 rounded-button hover:border-brass-500 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={role === 'admin'}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-neutral-900">Admin</div>
                    <div className="text-xs text-neutral-600">Full system access</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-6 border-t border-neutral-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/admin/users')}
                className="flex-1"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
