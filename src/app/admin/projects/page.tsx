'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import AdminHeader from '@/components/navigation/AdminHeader';
import Card from '@/components/ui/Card';
import { LoadingOverlay, LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { apiClient } from '@/lib/api/client';
import { Trash2, Eye, Search } from 'lucide-react';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  address: string;
  status: string;
  clientEmail: string;
  createdAt: string;
  builderOrgId: string;
}

export default function AdminProjectsPage() {
  const { user, profile } = useAuth();
  const { confirm, showError } = useNotification();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
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
      loadProjects();
    }
  }, [user, profile, router]);

  useEffect(() => {
    filterProjects();
  }, [searchQuery, statusFilter, projects]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/admin/projects');
      setProjects(data.projects || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = [...projects];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.address?.toLowerCase().includes(query) ||
          p.clientEmail?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    setFilteredProjects(filtered);
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    const confirmed = await confirm(
      `Are you sure you want to delete project "${projectName}"? This will delete all associated data and cannot be undone.`,
      'Delete Project'
    );
    
    if (!confirmed) {
      return;
    }

    try {
      setDeleting(projectId);
      await apiClient.delete(`/admin/projects/${projectId}`);
      await loadProjects();
    } catch (error: any) {
      console.error('Failed to delete project:', error);
      showError(error.message || 'Failed to delete project');
    } finally {
      setDeleting(null);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'setup':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'archived':
        return 'bg-neutral-100 text-neutral-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  if (loading || !profile) {
    return <LoadingOverlay fullScreen message="Loading projects..." />;
  }

  if (profile.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-taupe-50">
      <AdminHeader
        title="Project Management"
        subtitle="Manage all system projects"
        showBackButton
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, address, or client..."
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-button focus:ring-2 focus:ring-brass-500 focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-button focus:ring-2 focus:ring-brass-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="setup">Setup</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="mt-4">
            <p className="text-sm text-neutral-600">
              Showing {filteredProjects.length} of {projects.length} projects
            </p>
          </div>
        </Card>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Project</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Client</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Created</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-neutral-500">
                      No projects found
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((project) => (
                    <tr key={project.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-neutral-900">{project.name}</div>
                          <div className="text-sm text-neutral-600">{project.address || 'No address'}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-700">
                        {project.clientEmail || 'No client'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadgeColor(project.status)}`}>
                          {project.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-neutral-700">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/projects/${project.id}`}>
                            <button
                              className="p-2 text-brass-600 hover:bg-brass-50 rounded-button transition-colors"
                              title="View project"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDeleteProject(project.id, project.name)}
                            disabled={deleting === project.id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-button transition-colors disabled:opacity-50"
                            title="Delete project"
                          >
                            {deleting === project.id ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
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
