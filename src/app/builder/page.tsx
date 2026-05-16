'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import BuilderHeader from '@/components/navigation/BuilderHeader';
import { LoadingOverlay, LoadingCard } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { isSelectionCompleted, isSelectionPendingApproval } from '@/lib/selections/status';

export default function BuilderDashboard() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [stats, setStats] = useState({
    activeProjects: 0,
    pendingApprovals: 0,
    dueThisWeek: 0,
    completedThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    loadDashboardData();
  }, [user, profile]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all projects for this builder org
      const builderOrgId = profile?.builderOrgId || user?.uid;
      const projectsResponse = await fetch(`/api/projects?builderOrgId=${builderOrgId}`);
      const projectsData = await projectsResponse.json();
      const projects = projectsData.projects || [];

      // Count active projects
      const activeProjects = projects.filter((p: any) => p.status === 'active' || p.status === 'setup').length;

      // Fetch all selections across projects to calculate stats
      let allSelections: any[] = [];
      let completedThisMonth = 0;
      const now = new Date();
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

      for (const project of projects) {
        const selectionsResponse = await fetch(`/api/selections?projectId=${project.id}`);
        const selectionsData = await selectionsResponse.json();
        const selections = selectionsData.selections || [];
        allSelections = [...allSelections, ...selections];

        // Count completed items this month
        const completedInMonth = selections.filter((s: any) => {
          if (!isSelectionCompleted(s.status)) return false;
          if (!s.approvedAt) return false;
          const approvedDate = new Date(s.approvedAt);
          return approvedDate >= monthAgo && approvedDate <= now;
        }).length;
        completedThisMonth += completedInMonth;
      }

      // Count pending approvals
      const pendingApprovals = allSelections.filter((s: any) => isSelectionPendingApproval(s.status)).length;

      // Count due this week
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const dueThisWeek = allSelections.filter((s: any) => {
        if (!s.dueDate) return false;
        const dueDate = new Date(s.dueDate);
        return dueDate >= now && dueDate <= weekFromNow && !isSelectionCompleted(s.status);
      }).length;

      setStats({
        activeProjects,
        pendingApprovals,
        dueThisWeek,
        completedThisMonth,
      });

      // Fetch notifications
      const notificationsResponse = await fetch(`/api/notifications?userId=${user?.uid}`);
      const notificationsData = await notificationsResponse.json();
      setNotifications(notificationsData.notifications || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-taupe-50">
        <BuilderHeader />
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
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
      <BuilderHeader />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-display font-bold text-neutral-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-neutral-600">
            Manage your projects and client selections
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-neutral-600 mb-1">Active Projects</div>
                <div className="text-3xl font-bold text-neutral-900">{stats.activeProjects}</div>
              </div>
              <div className="w-12 h-12 bg-brass-100 rounded-button flex items-center justify-center">
                <svg className="w-6 h-6 text-brass-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-neutral-600 mb-1">Pending Approvals</div>
                <div className="text-3xl font-bold text-brass-700">{stats.pendingApprovals}</div>
              </div>
              <div className="w-12 h-12 bg-brass-100 rounded-button flex items-center justify-center">
                <svg className="w-6 h-6 text-brass-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-neutral-600 mb-1">Completed This Month</div>
                <div className="text-3xl font-bold text-green-700">{stats.completedThisMonth}</div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-button flex items-center justify-center">
                <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/projects/new">
            <Card hover className="h-full">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-brass-100 rounded-button flex items-center justify-center">
                    <svg className="w-6 h-6 text-brass-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-1">New Project</h3>
                  <p className="text-neutral-600 text-sm">
                    Create a new project and invite clients
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/builder/options">
            <Card hover className="h-full">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-brass-100 rounded-button flex items-center justify-center">
                    <svg className="w-6 h-6 text-brass-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-1">Manage Options</h3>
                  <p className="text-neutral-600 text-sm">
                    Add and organize curated selection options
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/projects">
            <Card hover className="h-full">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-brass-100 rounded-button flex items-center justify-center">
                    <svg className="w-6 h-6 text-brass-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-1">View All Projects</h3>
                  <p className="text-neutral-600 text-sm">
                    See all active and completed projects
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Notifications */}
        <Card>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Notifications</h3>
          {notifications.length === 0 ? (
            <div className="text-sm text-neutral-600">No notifications yet.</div>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-center justify-between p-3 bg-taupe-50 rounded-button"
                >
                  <div>
                    <div className="font-medium text-neutral-900">{notification.title}</div>
                    {notification.body && (
                      <div className="text-sm text-neutral-600">{notification.body}</div>
                    )}
                  </div>
                  <span className="text-xs bg-brass-100 text-brass-800 px-2 py-1 rounded-full">
                    New
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
