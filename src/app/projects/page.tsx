'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useProjects } from '@/hooks/useProjects';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import BuilderHeader from '@/components/navigation/BuilderHeader';
import ClientHeader from '@/components/navigation/ClientHeader';
import DesignerHeader from '@/components/navigation/DesignerHeader';
import { LoadingCard } from '@/components/ui/LoadingSpinner';

interface Project {
  id: string;
  name: string;
  address?: string;
  status?: string;
  budget?: number;
  completedAt?: string | null;
}

const toDateInputValue = (value?: string | null) => {
  if (!value) return '';
  return value.slice(0, 10);
};

const formatDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const getWarrantyStatus = (completedAt?: string | null) => {
  const completedDate = toDateInputValue(completedAt);
  if (!completedDate) return null;

  const warrantyEnd = new Date(`${completedDate}T00:00:00`);
  warrantyEnd.setFullYear(warrantyEnd.getFullYear() + 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    active: warrantyEnd >= today,
    endDate: warrantyEnd.toISOString().slice(0, 10),
  };
};

export default function ProjectsPage() {
  const { user, profile } = useAuth();
  const { confirm, showError, showSuccess } = useNotification();
  const router = useRouter();
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState('active');
  const [completedDateDraft, setCompletedDateDraft] = useState('');
  const [savingProjectId, setSavingProjectId] = useState<string | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  
  useEffect(() => {
    if (profile?.role === 'admin') {
      router.push('/admin/projects');
    }
  }, [profile?.role, router]);
  
  const isBuilder = profile?.role === 'builder' || profile?.role === 'designer';
  const { projects, loading, updateProject, deleteProject } = useProjects(
    isBuilder
      ? { builderOrgId: profile?.builderOrgId || user?.uid }
      : { clientId: user?.uid }
  );

  // Determine which header to use
  let Header;
  if (profile?.role === 'designer') {
    Header = DesignerHeader;
  } else if (profile?.role === 'builder') {
    Header = BuilderHeader;
  } else {
    Header = ClientHeader;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-taupe-50">
        <Header
          title={isBuilder ? 'Projects' : 'My Projects'}
          subtitle={isBuilder ? 'Manage all your projects' : 'View your assigned projects'}
        />
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <LoadingCard count={6} />
          </div>
        </main>
      </div>
    );
  }

  if (profile?.role === 'admin') {
    return null;
  }

  const openEdit = (project: Project) => {
    setEditingProjectId(project.id);
    setStatusDraft(project.status || 'active');
    setCompletedDateDraft(toDateInputValue(project.completedAt));
  };

  const handleSaveProject = async (project: Project) => {
    if (statusDraft === 'completed' && !completedDateDraft) {
      showError('Enter the completed date before marking this project completed');
      return;
    }

    try {
      setSavingProjectId(project.id);
      await updateProject(project.id, {
        status: statusDraft,
        completedAt: statusDraft === 'completed' ? completedDateDraft : null,
      });
      setEditingProjectId(null);
      showSuccess('Project updated');
    } catch (error) {
      console.error('Failed to update project:', error);
      showError(error instanceof Error ? error.message : 'Failed to update project');
    } finally {
      setSavingProjectId(null);
    }
  };

  const handleDeleteProject = async (project: Project) => {
    const confirmed = await confirm(
      `Delete "${project.name}"? This will remove the project and its related setup, selections, photos, and messages.`,
      'Delete Project'
    );

    if (!confirmed) return;

    try {
      setDeletingProjectId(project.id);
      await deleteProject(project.id);
      showSuccess('Project deleted');
    } catch (error) {
      console.error('Failed to delete project:', error);
      showError(error instanceof Error ? error.message : 'Failed to delete project');
    } finally {
      setDeletingProjectId(null);
    }
  };

  return (
    <div className="min-h-screen bg-taupe-50">
      <Header
        title={isBuilder ? 'Projects' : 'My Projects'}
        subtitle={isBuilder ? 'Manage all your projects' : 'View your assigned projects'}
        actions={
          isBuilder && (
            <Button onClick={() => router.push('/projects/new')} size="sm">
              New Project
            </Button>
          )
        }
      />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <Card className="col-span-full">
              <div className="text-center py-12">
                <p className="text-neutral-600 mb-2">No projects yet.</p>
                {isBuilder && (
                  <p className="text-sm text-neutral-500">Create your first project to get started!</p>
                )}
              </div>
            </Card>
          ) : (
            (projects as Project[]).map((project) => {
              const isEditing = editingProjectId === project.id;
              const warranty = project.status === 'completed' ? getWarrantyStatus(project.completedAt) : null;

              return (
              <Card
                key={project.id}
                hover
                onClick={() => router.push(`/projects/${project.id}`)}
                className="cursor-pointer"
              >
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">{project.name}</h3>
                {project.address && (
                  <p className="text-sm text-neutral-600 mb-4">{project.address}</p>
                )}
                <div className="flex items-center justify-between gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    project.status === 'completed' ? 'bg-green-100 text-green-800' :
                    project.status === 'active' ? 'bg-brass-100 text-brass-800' :
                    project.status === 'setup' ? 'bg-blue-100 text-blue-800' :
                    'bg-neutral-100 text-neutral-800'
                  }`}>
                    {project.status || 'Active'}
                  </span>
                  {project.budget && (
                    <span className="text-sm font-medium text-neutral-700">
                      ${project.budget.toLocaleString()}
                    </span>
                  )}
                </div>

                {project.status === 'completed' && project.completedAt && (
                  <div className="mt-4 rounded-button bg-neutral-50 px-3 py-2 text-xs text-neutral-700">
                    <div>Completed: {formatDate(toDateInputValue(project.completedAt))}</div>
                    {warranty && (
                      <div className={warranty.active ? 'text-green-700' : 'text-neutral-500'}>
                        {warranty.active ? 'Builder warranty active' : 'Builder warranty expired'} until{' '}
                        {formatDate(warranty.endDate)}
                      </div>
                    )}
                  </div>
                )}

                {isBuilder && (
                  <div className="mt-4 border-t border-neutral-100 pt-4" onClick={(event) => event.stopPropagation()}>
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <select
                            value={statusDraft}
                            onChange={(event) => setStatusDraft(event.target.value)}
                            className="rounded-button border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brass-500"
                          >
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="archived">Archived</option>
                          </select>
                          {statusDraft === 'completed' && (
                            <input
                              type="date"
                              value={completedDateDraft}
                              onChange={(event) => setCompletedDateDraft(event.target.value)}
                              className="rounded-button border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brass-500"
                            />
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveProject(project)}
                            disabled={savingProjectId === project.id}
                          >
                            {savingProjectId === project.id ? 'Saving...' : 'Save'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingProjectId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(project)}>
                          Edit Status
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteProject(project)}
                          disabled={deletingProjectId === project.id}
                          className="border-red-200 text-red-700 hover:bg-red-50"
                        >
                          {deletingProjectId === project.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
