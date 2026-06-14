'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ClientHeader from '@/components/navigation/ClientHeader';
import ProgressBar from '@/components/ui/ProgressBar';
import DueThisWeekList from '@/components/selections/DueThisWeekList';
import { LoadingCard } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { isSelectionCompleted, isSelectionPendingApproval } from '@/lib/selections/status';

export default function ClientPortal() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [dueThisWeek, setDueThisWeek] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalSelections: 0,
    completedSelections: 0,
    pendingApprovals: 0,
    dueThisWeek: 0,
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    let redirected = false;
    try {
      setLoading(true);

      // Load user's projects
      const projectsData = await apiClient.get(`/api/projects?clientId=${user?.uid}`);
      setProjects(projectsData);

      // If the client has a project but hasn't completed the questionnaire yet,
      // redirect them into the questionnaire wizard before unlocking the dashboard.
      if (projectsData && projectsData.length > 0) {
        const firstProjectId = projectsData[0]?.id;
        if (firstProjectId) {
          const submissionData = await apiClient.get(
            `/questionnaire/submission?projectId=${firstProjectId}&clientId=${user?.uid}`
          );
          const status = submissionData?.submission?.status;
          if (status !== 'completed') {
            redirected = true;
            router.replace(`/projects/${firstProjectId}/questionnaire`);
            return;
          }
        }
      }

      // Load selections across all projects
      let allSelections: any[] = [];
      for (const project of projectsData) {
        const items = await apiClient.get(`/items?projectId=${project.id}`);
        const itemsArray = Array.isArray(items) ? items : [];
        allSelections = [...allSelections, ...itemsArray.map((item: any) => ({
          ...item,
          projectId: project.id,
          category: item.categoryName,
          itemName: item.name,
        }))];
      }

      // Calculate stats
      const completed = allSelections.filter((s) => isSelectionCompleted(s.status)).length;
      const pending = allSelections.filter((s) => isSelectionPendingApproval(s.status)).length;

      // Get due this week
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const due = allSelections.filter((s) => {
        if (!s.dueDate) return false;
        const dueDate = new Date(s.dueDate);
        return dueDate >= now && dueDate <= weekFromNow;
      });

      setStats({
        totalSelections: allSelections.length,
        completedSelections: completed,
        pendingApprovals: pending,
        dueThisWeek: due.length,
      });

      setDueThisWeek(due.slice(0, 5)); // Show top 5

      const notificationsResponse = await fetch(`/api/notifications?userId=${user?.uid}`);
      const notificationsData = await notificationsResponse.json();
      setNotifications(notificationsData.notifications || []);

      // Load pending invitations
      const invitationNotifications = (notificationsData.notifications || []).filter(
        (n: any) => n.type === 'invitation' && !n.read
      );
      setInvitations(invitationNotifications);
    } catch (err) {
      console.error('Failed to load client data:', err);
    } finally {
      if (!redirected) setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-taupe-50">
        <ClientHeader />
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-full max-w-96 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <LoadingCard count={4} />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-taupe-50">
      <ClientHeader />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-display font-bold text-neutral-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-neutral-600">
            Track your project progress and make selections
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-neutral-600 mb-1">Total Selections</div>
                <div className="text-3xl font-bold text-neutral-900">{stats.totalSelections}</div>
              </div>
              <div className="w-12 h-12 bg-brass-100 rounded-button flex items-center justify-center">
                <svg className="w-6 h-6 text-brass-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-neutral-600 mb-1">Completed</div>
                <div className="text-3xl font-bold text-green-700">{stats.completedSelections}</div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-button flex items-center justify-center">
                <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-neutral-600 mb-1">Pending Approval</div>
                <div className="text-3xl font-bold text-brass-700">{stats.pendingApprovals}</div>
              </div>
              <div className="w-12 h-12 bg-brass-100 rounded-button flex items-center justify-center">
                <svg className="w-6 h-6 text-brass-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-neutral-600 mb-1">Due This Week</div>
                <div className="text-3xl font-bold text-neutral-900">{stats.dueThisWeek}</div>
              </div>
              <div className="w-12 h-12 bg-taupe-100 rounded-button flex items-center justify-center">
                <svg className="w-6 h-6 text-taupe-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Progress Overview */}
        {stats.totalSelections > 0 && (
          <Card className="mb-8">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Overall Progress</h3>
            <ProgressBar
              completed={stats.completedSelections}
              total={stats.totalSelections}
              showLabel
            />
          </Card>
        )}

        {/* Due This Week */}
        {dueThisWeek.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-display font-semibold text-neutral-900 mb-4">
              Due This Week
            </h3>
            <DueThisWeekList items={dueThisWeek} />
          </div>
        )}

        {/* Mood Board */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-display font-semibold text-neutral-900">
              Mood Board
            </h3>
            <span className="text-xs uppercase tracking-wide text-neutral-500">Coming soon</span>
          </div>
          <Card>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-neutral-900">Your project aesthetic</div>
                <p className="text-sm text-neutral-600 mt-1">
                  We will generate curated mood boards once imagery integrations are enabled.
                </p>
              </div>
              <Button variant="outline" disabled>
                Generate Mood Board
              </Button>
            </div>
          </Card>
        </div>

        {/* Notifications */}
        <div className="mb-8">
          <h3 className="text-xl font-display font-semibold text-neutral-900 mb-4">
            Notifications
          </h3>
          <Card>
            {notifications.length === 0 ? (
              <div className="text-sm text-neutral-600">No notifications yet.</div>
            ) : (
              <div className="space-y-3">
                {notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className="flex flex-col gap-3 p-3 bg-taupe-50 rounded-button sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-neutral-900">{notification.title}</div>
                      {notification.body && (
                        <div className="text-sm text-neutral-600">{notification.body}</div>
                      )}
                    </div>
                    <span className="self-start text-xs bg-brass-100 text-brass-800 px-2 py-1 rounded-full sm:self-center">
                      New
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Projects */}
        <div className="mb-8">
          <h3 className="text-xl font-display font-semibold text-neutral-900 mb-4">
            Your Projects
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card hover className="h-full">
                  <h4 className="text-lg font-semibold text-neutral-900 mb-2">
                    {project.name}
                  </h4>
                  <p className="text-sm text-neutral-600 mb-4">
                    {project.address || 'No address provided'}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600">Status:</span>
                    <span className="font-medium text-brass-700 capitalize">
                      {project.status || 'Active'}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}

            {projects.length === 0 && (
              <Card>
                <div className="text-center py-8">
                  <p className="text-neutral-600 mb-2">No projects yet</p>
                  <p className="text-sm text-neutral-500">
                    Your builder will invite you to a project soon
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <Card className="mb-8">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Pending Invitations</h3>
            <div className="space-y-3">
              {invitations.map((invitation: any) => (
                <div
                  key={invitation.id}
                  className="flex flex-col gap-3 p-4 bg-brass-50 border border-brass-200 rounded-button sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-neutral-900">{invitation.title}</div>
                    <div className="text-sm text-neutral-600">{invitation.message}</div>
                    <div className="text-xs text-neutral-500 mt-1">
                      {new Date(invitation.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                  <Link href={`/projects/${invitation.projectId}`} className="w-full sm:w-auto">
                    <Button size="sm" className="w-full sm:w-auto">View Project</Button>
                  </Link>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href={`/projects/${projects[0].id}/selections`}>
              <Card hover className="h-full">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-brass-100 rounded-button flex items-center justify-center">
                      <svg className="w-6 h-6 text-brass-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-1">Selections</h3>
                    <p className="text-neutral-600 text-sm">
                      Review and approve your selections
                    </p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href={`/projects/${projects[0].id}/due-dates`}>
              <Card hover className="h-full">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-brass-100 rounded-button flex items-center justify-center">
                      <svg className="w-6 h-6 text-brass-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-1">Due Dates</h3>
                    <p className="text-neutral-600 text-sm">
                      View upcoming selection deadlines
                    </p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href={`/projects/${projects[0].id}/selections/categories`}>
              <Card hover className="h-full">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-brass-100 rounded-button flex items-center justify-center">
                      <svg className="w-6 h-6 text-brass-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-1">Categories</h3>
                    <p className="text-neutral-600 text-sm">
                      Browse selections by category
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        ) : (
          <Card>
            <div className="text-center py-8">
              <p className="text-neutral-600 mb-2">No projects available</p>
              <p className="text-sm text-neutral-500">
                Your builder will invite you to a project soon. Once added, you'll be able to review and approve selections.
              </p>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
