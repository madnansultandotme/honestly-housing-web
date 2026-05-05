'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import DueThisWeekList from '@/components/selections/DueThisWeekList';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (!user) {
    return null;
  }

  // Mock data - replace with actual data from API
  const dueThisWeek = [
    {
      id: '1',
      category: 'Lighting',
      itemName: 'Kitchen Chandelier',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      projectId: 'project-1',
    },
    {
      id: '2',
      category: 'Countertops',
      itemName: 'Kitchen Quartz',
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      projectId: 'project-1',
    },
  ];

  return (
    <div className="min-h-screen bg-taupe-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-display font-bold text-neutral-900">Honestly Housing</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-neutral-700">{user.email}</span>
              <Button onClick={handleSignOut} size="sm" variant="outline">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-display font-bold text-neutral-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-neutral-600">
            Here's what needs your attention this week
          </p>
        </div>

        {/* Progress Overview */}
        <Card className="mb-8">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Overall Progress</h3>
          <ProgressBar completed={18} total={26} />
        </Card>

        {/* Due This Week */}
        <div className="mb-8">
          <h3 className="text-xl font-display font-semibold text-neutral-900 mb-4">
            Due This Week
          </h3>
          <DueThisWeekList items={dueThisWeek} />
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/projects">
            <Card hover className="h-full">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-brass-100 rounded-button flex items-center justify-center">
                    <svg className="w-6 h-6 text-brass-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-1">Projects</h3>
                  <p className="text-neutral-600 text-sm">
                    View and manage your renovation projects
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Card hover className="h-full opacity-60">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-taupe-100 rounded-button flex items-center justify-center">
                  <svg className="w-6 h-6 text-taupe-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-neutral-900 mb-1">Messages</h3>
                <p className="text-neutral-600 text-sm">
                  Chat with builders and contractors
                </p>
                <span className="text-xs text-neutral-500 mt-2 block">Coming soon</span>
              </div>
            </div>
          </Card>

          <Card hover className="h-full opacity-60">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-taupe-100 rounded-button flex items-center justify-center">
                  <svg className="w-6 h-6 text-taupe-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-neutral-900 mb-1">Photos</h3>
                <p className="text-neutral-600 text-sm">
                  Browse project photos and progress
                </p>
                <span className="text-xs text-neutral-500 mt-2 block">Coming soon</span>
              </div>
            </div>
          </Card>

          <Card hover className="h-full opacity-60">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-taupe-100 rounded-button flex items-center justify-center">
                  <svg className="w-6 h-6 text-taupe-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-neutral-900 mb-1">Budget</h3>
                <p className="text-neutral-600 text-sm">
                  Track expenses and manage budgets
                </p>
                <span className="text-xs text-neutral-500 mt-2 block">Coming soon</span>
              </div>
            </div>
          </Card>

          <Card hover className="h-full opacity-60">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-taupe-100 rounded-button flex items-center justify-center">
                  <svg className="w-6 h-6 text-taupe-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-neutral-900 mb-1">Schedule</h3>
                <p className="text-neutral-600 text-sm">
                  View project timelines and milestones
                </p>
                <span className="text-xs text-neutral-500 mt-2 block">Coming soon</span>
              </div>
            </div>
          </Card>

          <Card hover className="h-full opacity-60">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-taupe-100 rounded-button flex items-center justify-center">
                  <svg className="w-6 h-6 text-taupe-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-neutral-900 mb-1">Settings</h3>
                <p className="text-neutral-600 text-sm">
                  Manage your account and preferences
                </p>
                <span className="text-xs text-neutral-500 mt-2 block">Coming soon</span>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
