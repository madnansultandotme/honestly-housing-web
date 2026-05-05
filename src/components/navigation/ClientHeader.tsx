'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';

interface ClientHeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  actions?: React.ReactNode;
}

export default function ClientHeader({
  title,
  subtitle,
  showBackButton = false,
  actions,
}: ClientHeaderProps) {
  const { user, profile, signOut } = useAuth();
  const { showInfo } = useNotification();
  const router = useRouter();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [firstProjectId, setFirstProjectId] = useState<string | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    // Load user's first project to use for Selections link
    const loadFirstProject = async () => {
      if (!user) return;
      
      try {
        setLoadingProjects(true);
        const projects = await apiClient.get(`/api/projects?clientId=${user.uid}`);
        if (projects && projects.length > 0) {
          setFirstProjectId(projects[0].id);
        }
      } catch (err) {
        console.error('Failed to load projects:', err);
      } finally {
        setLoadingProjects(false);
      }
    };

    loadFirstProject();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleSelectionsClick = (e: React.MouseEvent) => {
    if (!firstProjectId && !loadingProjects) {
      e.preventDefault();
      showInfo(
        'Your builder will invite you to a project soon, and then you can view and approve selections.',
        'No Projects Available'
      );
    }
  };

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  // Determine selections link
  const selectionsHref = firstProjectId ? `/projects/${firstProjectId}/selections` : '#';

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo/Brand */}
          <div className="flex items-center gap-8">
            <Link href="/client" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brass-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">HH</span>
              </div>
              <span className="font-display font-bold text-neutral-900 hidden sm:inline">
                Honestly Housing
              </span>
            </Link>

            {/* Main Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/client"
                className={`px-3 py-2 rounded-button text-sm font-medium transition-colors ${
                  isActive('/client') && !pathname.includes('/projects')
                    ? 'bg-brass-50 text-brass-700'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/projects"
                className={`px-3 py-2 rounded-button text-sm font-medium transition-colors ${
                  isActive('/projects')
                    ? 'bg-brass-50 text-brass-700'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                Projects
              </Link>
              <Link
                href={selectionsHref}
                onClick={handleSelectionsClick}
                className={`px-3 py-2 rounded-button text-sm font-medium transition-colors ${
                  pathname.includes('/selections')
                    ? 'bg-brass-50 text-brass-700'
                    : firstProjectId
                    ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                    : 'text-neutral-400 cursor-not-allowed'
                }`}
              >
                Selections
              </Link>
            </nav>
          </div>

          {/* Right: Actions & User Menu */}
          <div className="flex items-center gap-4">
            {actions && <div className="hidden sm:flex items-center gap-2">{actions}</div>}

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-button hover:bg-neutral-50 transition-colors"
              >
                <div className="w-8 h-8 bg-brass-100 rounded-full flex items-center justify-center">
                  <span className="text-brass-700 font-semibold text-sm">
                    {profile?.displayName?.charAt(0).toUpperCase() || 'C'}
                  </span>
                </div>
                <svg
                  className={`w-4 h-4 text-neutral-600 transition-transform ${
                    showUserMenu ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-button shadow-lg border border-neutral-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-neutral-200">
                    <div className="text-sm font-medium text-neutral-900">
                      {profile?.displayName || 'Client'}
                    </div>
                    <div className="text-xs text-neutral-500">{user?.email}</div>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleSignOut();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page Title Section (if provided) */}
        {title && (
          <div className="flex items-center gap-4 py-4 border-t border-neutral-100">
            {showBackButton && (
              <button
                onClick={() => router.back()}
                className="text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-display font-bold text-neutral-900">{title}</h1>
              {subtitle && <p className="text-sm text-neutral-600 mt-1">{subtitle}</p>}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
