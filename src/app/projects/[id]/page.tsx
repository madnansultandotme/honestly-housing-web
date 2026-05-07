'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import BuilderHeader from '@/components/navigation/BuilderHeader';
import ClientHeader from '@/components/navigation/ClientHeader';
import ProgressBar from '@/components/ui/ProgressBar';
import StatusBadge from '@/components/ui/StatusBadge';
import { LoadingOverlay } from '@/components/ui/LoadingSpinner';
import InviteClientModal from '@/components/builder/InviteClientModal';
import InvitationsList from '@/components/builder/InvitationsList';
import AddTeamMemberModal from '@/components/projects/AddTeamMemberModal';
import TeamMembersList from '@/components/projects/TeamMembersList';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, profile } = useAuth();
  const { showError } = useNotification();
  const router = useRouter();
  
  const [project, setProject] = useState<any>(null);
  const [selections, setSelections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadData();
  }, [user, id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load project
      const projectData = await apiClient.get(`/api/projects/${id}`);
      setProject(projectData);

      // Load selections
      const selectionsData = await apiClient.get(`/api/selections?projectId=${id}`);
      setSelections(selectionsData);
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const response = await fetch(`/api/export/materials?projectId=${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to export materials');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `materials-list-${id}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export failed:', err);
      showError('Failed to export materials list');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <LoadingOverlay fullScreen message="Loading project..." />;
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-taupe-50 flex items-center justify-center">
        <div className="text-neutral-600">Project not found</div>
      </div>
    );
  }

  const isBuilder = profile?.role === 'builder' || profile?.role === 'designer' || profile?.role === 'admin';
  const completedSelections = selections.filter(s => s.status === 'approved' || s.status === 'installed').length;
  const totalSelections = selections.length;
  const pendingApprovals = selections.filter(s => s.status === 'awaiting_approval').length;

  const Header = isBuilder ? BuilderHeader : ClientHeader;

  return (
    <div className="min-h-screen bg-taupe-50">
      <Header
        title={project.name}
        subtitle={project.address || 'Project Details'}
        showBackButton
        actions={
          isBuilder && (
            <>
              {!project.clientId && (
                <Button
                  onClick={() => setShowInviteModal(true)}
                  variant="outline"
                  size="sm"
                >
                  Invite Client
                </Button>
              )}
              <Button
                onClick={handleExportCSV}
                disabled={exporting || completedSelections === 0}
                variant="outline"
                size="sm"
              >
                {exporting ? 'Exporting...' : 'Export CSV'}
              </Button>
              <Link href={`/projects/${id}/setup`}>
                <Button variant="outline" size="sm">
                  Edit Configuration
                </Button>
              </Link>
              <Link href={`/projects/${id}/configure-rooms`}>
                <Button variant="outline" size="sm">
                  Configure Rooms
                </Button>
              </Link>
            </>
          )
        }
      />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Project Info */}
        <Card className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-neutral-900 mb-2">
                Project Information
              </h2>
              {project.address && (
                <p className="text-neutral-600 mb-2">{project.address}</p>
              )}
            </div>
            <StatusBadge status={project.status || 'active'} />
          </div>

          {/* Project Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-neutral-200">
            {project.rooms && (
              <>
                <div>
                  <div className="text-sm text-neutral-600">Bedrooms</div>
                  <div className="text-2xl font-bold text-neutral-900">{project.rooms.bedrooms || 0}</div>
                </div>
                <div>
                  <div className="text-sm text-neutral-600">Bathrooms</div>
                  <div className="text-2xl font-bold text-neutral-900">{project.rooms.bathrooms || 0}</div>
                </div>
                <div>
                  <div className="text-sm text-neutral-600">Offices</div>
                  <div className="text-2xl font-bold text-neutral-900">{project.rooms.offices || 0}</div>
                </div>
              </>
            )}
            {project.squareFootage && (
              <div>
                <div className="text-sm text-neutral-600">Square Feet</div>
                <div className="text-2xl font-bold text-neutral-900">{project.squareFootage.toLocaleString()}</div>
              </div>
            )}
          </div>
        </Card>

        {/* Progress Overview */}
        <Card className="mb-8">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Selection Progress</h3>
          <ProgressBar
            completed={completedSelections}
            total={totalSelections}
            showLabel
          />
          
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-brass-700">{pendingApprovals}</div>
              <div className="text-sm text-neutral-600">Awaiting Approval</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">{completedSelections}</div>
              <div className="text-sm text-neutral-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-neutral-900">{totalSelections}</div>
              <div className="text-sm text-neutral-600">Total Items</div>
            </div>
          </div>
        </Card>

        {/* Invitations List (Builder Only) */}
        {isBuilder && <InvitationsList projectId={id} />}

        {/* Team Members Section */}
        <Card className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-neutral-900">Team Members</h3>
            {/* All roles can add team members except admin cannot be added */}
            <Button
              onClick={() => setShowAddTeamModal(true)}
              variant="outline"
              size="sm"
            >
              Add Team Member
            </Button>
          </div>
          
          <TeamMembersList
            projectId={id}
            currentUserId={user?.uid || ''}
            currentUserRole={(profile?.role === 'homeowner' ? 'client' : profile?.role) || 'client'}
            onUpdate={loadData}
          />
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isBuilder && (
            <Link href={`/projects/${id}/configure-rooms`}>
              <Card hover className="h-full">
                <div className="flex flex-col items-center text-center p-4">
                  <div className="w-12 h-12 bg-brass-100 rounded-button flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-brass-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-neutral-900 mb-1">Configure Rooms</h3>
                  <p className="text-sm text-neutral-600">Assign categories & items</p>
                </div>
              </Card>
            </Link>
          )}

          <Link href={`/projects/${id}/selections`}>
            <Card hover className="h-full">
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 bg-brass-100 rounded-button flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-brass-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-neutral-900 mb-1">Selections</h3>
                <p className="text-sm text-neutral-600">View and manage selections</p>
              </div>
            </Card>
          </Link>

          <Link href={`/projects/${id}/selections/categories`}>
            <Card hover className="h-full">
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 bg-brass-100 rounded-button flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-brass-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-neutral-900 mb-1">Categories</h3>
                <p className="text-sm text-neutral-600">Browse by category</p>
              </div>
            </Card>
          </Link>

          <Link href={`/projects/${id}/due-dates`}>
            <Card hover className="h-full">
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 bg-brass-100 rounded-button flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-brass-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-neutral-900 mb-1">Due Dates</h3>
                <p className="text-sm text-neutral-600">View upcoming deadlines</p>
              </div>
            </Card>
          </Link>

          <Link href={`/projects/${id}/photos`}>
            <Card hover className="h-full">
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 bg-brass-100 rounded-button flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-brass-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-neutral-900 mb-1">Photos</h3>
                <p className="text-sm text-neutral-600">Upload and manage photos</p>
              </div>
            </Card>
          </Link>

          <Link href={`/projects/${id}/messages`}>
            <Card hover className="h-full">
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 bg-brass-100 rounded-button flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-brass-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-neutral-900 mb-1">Messages</h3>
                <p className="text-sm text-neutral-600">Chat with your team</p>
              </div>
            </Card>
          </Link>
        </div>
      </main>

      {/* Invite Client Modal */}
      {showInviteModal && project && (
        <InviteClientModal
          projectId={id}
          projectName={project.name}
          builderName={profile?.displayName || user?.email || 'Builder'}
          builderOrgId={profile?.builderOrgId || user?.uid || ''}
          invitedBy={user?.uid || ''}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
            loadData(); // Reload project data
          }}
        />
      )}

      {/* Add Team Member Modal */}
      {showAddTeamModal && project && profile && (
        <AddTeamMemberModal
          projectId={id}
          projectName={project.name}
          currentUserRole={(profile.role === 'homeowner' ? 'client' : profile.role) as 'builder' | 'designer' | 'client'}
          onClose={() => setShowAddTeamModal(false)}
          onSuccess={() => {
            setShowAddTeamModal(false);
            loadData(); // Reload project data
          }}
        />
      )}
    </div>
  );
}
