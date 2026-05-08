'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import BuilderHeader from '@/components/navigation/BuilderHeader';
import ClientHeader from '@/components/navigation/ClientHeader';
import AdminHeader from '@/components/navigation/AdminHeader';
import DesignerHeader from '@/components/navigation/DesignerHeader';
import { LoadingCard } from '@/components/ui/LoadingSpinner';

export default function ProjectsPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  
  // Redirect admins to admin projects page
  if (profile?.role === 'admin') {
    router.push('/admin/projects');
    return null;
  }
  
  const isBuilder = profile?.role === 'builder' || profile?.role === 'designer';
  const { projects, loading } = useProjects(
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
            projects.map((project) => (
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
                <div className="flex items-center justify-between">
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
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
