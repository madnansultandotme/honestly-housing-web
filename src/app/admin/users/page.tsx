'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import AdminHeader from '@/components/navigation/AdminHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { LoadingOverlay, LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { apiClient } from '@/lib/api/client';
import { Trash2, Edit, Search, UserPlus } from 'lucide-react';

interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'builder' | 'designer' | 'client' | 'admin';
  createdAt: string;
  projectIds?: string[];
}

export default function UserManagementPage() {
  const { user, profile } = useAuth();
  const { confirm, showError } = useNotification();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [deleting, setDeleting] = useState<string | null>(null);

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
      loadUsers();
    }
  }, [user, profile, router]);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, roleFilter, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/admin/users');
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.email.toLowerCase().includes(query) ||
          u.displayName?.toLowerCase().includes(query) ||
          u.uid.toLowerCase().includes(query)
      );
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    const confirmed = await confirm(
      `Are you sure you want to delete user ${userEmail}? This action cannot be undone.`,
      'Delete User'
    );
    
    if (!confirmed) {
      return;
    }

    try {
      setDeleting(userId);
      await apiClient.delete(`/admin/users/${userId}`);
      await loadUsers();
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      showError(error.message || 'Failed to delete user');
    } finally {
      setDeleting(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'builder':
        return 'bg-brass-100 text-brass-800';
      case 'designer':
        return 'bg-purple-100 text-purple-800';
      case 'client':
        return 'bg-blue-100 text-blue-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  if (loading || !profile) {
    return <LoadingOverlay fullScreen message="Loading users..." />;
  }

  if (profile.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-taupe-50">
      <AdminHeader
        title="User Management"
        subtitle="Manage all system users"
        showBackButton
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by email, name, or ID..."
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-button focus:ring-2 focus:ring-brass-500 focus:border-transparent"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-button focus:ring-2 focus:ring-brass-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="builder">Builders</option>
              <option value="designer">Designers</option>
              <option value="client">Clients</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-neutral-600">
              Showing {filteredUsers.length} of {users.length} users
            </p>
          </div>
        </Card>

        {/* Users Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">User</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Projects</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Created</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-neutral-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.uid} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-brass-100 rounded-full flex items-center justify-center">
                            <span className="text-brass-700 font-semibold text-sm">
                              {u.displayName?.charAt(0).toUpperCase() || u.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-neutral-900">{u.displayName || 'Unknown'}</div>
                            <div className="text-xs text-neutral-500">{u.uid.substring(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-700">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-700">
                        {u.projectIds?.length || 0}
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-700">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/admin/users/${u.uid}`)}
                            className="p-2 text-brass-600 hover:bg-brass-50 rounded-button transition-colors"
                            title="Edit user"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {u.uid !== user?.uid && (
                            <button
                              onClick={() => handleDeleteUser(u.uid, u.email)}
                              disabled={deleting === u.uid}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-button transition-colors disabled:opacity-50"
                              title="Delete user"
                            >
                              {deleting === u.uid ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}
