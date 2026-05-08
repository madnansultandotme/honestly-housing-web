'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AdminHeader from '@/components/navigation/AdminHeader';
import Card from '@/components/ui/Card';
import { LoadingOverlay } from '@/components/ui/LoadingSpinner';
import { apiClient } from '@/lib/api/client';
import Link from 'next/link';
import { Users, FolderKanban, Settings, BarChart3, Shield } from 'lucide-react';

interface SystemStats {
  totalUsers: number;
  totalProjects: number;
  activeProjects: number;
  totalSelections: number;
  usersByRole: {
    builder: number;
    designer: number;
    client: number;
    admin: number;
  };
}

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SystemStats | null>(null);

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
      loadStats();
    }
  }, [user, profile, router]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/admin/stats');
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !profile) {
    return <LoadingOverlay fullScreen message="Loading admin dashboard..." />;
  }

  if (profile.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-taupe-50">
      <AdminHeader
        title="Admin Dashboard"
        subtitle="System Administration & Management"
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-brass-700" />
            <h2 className="text-3xl font-display font-bold text-neutral-900">
              System Administration
            </h2>
          </div>
          <p className="text-neutral-600">
            Manage users, monitor system activity, and configure settings
          </p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-neutral-900">{stats.totalUsers}</p>
                </div>
                <div className="w-12 h-12 bg-brass-100 rounded-button flex items-center justify-center">
                  <Users className="w-6 h-6 text-brass-700" />
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600 mb-1">Total Projects</p>
                  <p className="text-3xl font-bold text-neutral-900">{stats.totalProjects}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-button flex items-center justify-center">
                  <FolderKanban className="w-6 h-6 text-blue-700" />
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600 mb-1">Active Projects</p>
                  <p className="text-3xl font-bold text-neutral-900">{stats.activeProjects}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-button flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-green-700" />
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600 mb-1">Total Selections</p>
                  <p className="text-3xl font-bold text-neutral-900">{stats.totalSelections}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-button flex items-center justify-center">
                  <Settings className="w-6 h-6 text-purple-700" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Users by Role */}
        {stats && (
          <Card className="mb-8">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Users by Role</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-brass-50 rounded-button">
                <div className="text-2xl font-bold text-brass-700">{stats.usersByRole.builder}</div>
                <div className="text-sm text-neutral-600">Builders</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-button">
                <div className="text-2xl font-bold text-purple-700">{stats.usersByRole.designer}</div>
                <div className="text-sm text-neutral-600">Designers</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-button">
                <div className="text-2xl font-bold text-blue-700">{stats.usersByRole.client}</div>
                <div className="text-sm text-neutral-600">Clients</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-button">
                <div className="text-2xl font-bold text-red-700">{stats.usersByRole.admin}</div>
                <div className="text-sm text-neutral-600">Admins</div>
              </div>
            </div>
          </Card>
        )}

        {/* Admin Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/admin/users">
            <Card hover className="h-full">
              <div className="flex flex-col items-center text-center p-6">
                <div className="w-16 h-16 bg-brass-100 rounded-button flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-brass-700" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">User Management</h3>
                <p className="text-sm text-neutral-600">
                  View, edit, and manage all system users
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/admin/projects">
            <Card hover className="h-full">
              <div className="flex flex-col items-center text-center p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-button flex items-center justify-center mb-4">
                  <FolderKanban className="w-8 h-8 text-blue-700" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">Project Management</h3>
                <p className="text-sm text-neutral-600">
                  View and manage all projects in the system
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/admin/analytics">
            <Card hover className="h-full">
              <div className="flex flex-col items-center text-center p-6">
                <div className="w-16 h-16 bg-green-100 rounded-button flex items-center justify-center mb-4">
                  <BarChart3 className="w-8 h-8 text-green-700" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">Analytics</h3>
                <p className="text-sm text-neutral-600">
                  View system analytics and reports
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/admin/settings">
            <Card hover className="h-full">
              <div className="flex flex-col items-center text-center p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-button flex items-center justify-center mb-4">
                  <Settings className="w-8 h-8 text-purple-700" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">System Settings</h3>
                <p className="text-sm text-neutral-600">
                  Configure system-wide settings
                </p>
              </div>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
