'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

interface BuilderHeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  actions?: React.ReactNode;
}

export default function BuilderHeader({
  title,
  subtitle,
  showBackButton = false,
  actions,
}: BuilderHeaderProps) {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo/Brand */}
          <div className="flex items-center gap-8">
            <Link href="/builder" className="flex items-center gap-2">
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
                href="/builder"
                className={`px-3 py-2 rounded-button text-sm font-medium transition-colors ${
                  isActive('/builder') && !isActive('/builder/options') && !isActive('/builder/org')
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
                href="/builder/options"
                className={`px-3 py-2 rounded-button text-sm font-medium transition-colors ${
                  isActive('/builder/options')
                    ? 'bg-brass-50 text-brass-700'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                Options
              </Link>
              <Link
                href="/builder/org"
                className={`px-3 py-2 rounded-button text-sm font-medium transition-colors ${
                  isActive('/builder/org')
                    ? 'bg-brass-50 text-brass-700'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                Organization
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
                    {profile?.displayName?.charAt(0).toUpperCase() || 'B'}
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
                      {profile?.displayName || 'Builder'}
                    </div>
                    <div className="text-xs text-neutral-500">{user?.email}</div>
                  </div>
                  <Link
                    href="/builder/org"
                    className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Organization Settings
                  </Link>
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
