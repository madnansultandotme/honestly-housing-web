'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import Image from 'next/image';

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  actions?: React.ReactNode;
}

export default function AdminHeader({
  title,
  subtitle,
  showBackButton = false,
  actions,
}: AdminHeaderProps) {
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
    <header className="bg-white border-b border-red-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Navigation Bar */}
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Left: Logo/Brand */}
          <div className="flex min-w-0 items-center gap-3 md:gap-8">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-white border border-red-200 flex items-center justify-center">
                <Image
                  src="/logo-icon.jpeg"
                  alt="Honestly Housing"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              <span className="font-display font-bold text-neutral-900 hidden sm:inline">
                Honestly Housing
              </span>
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                ADMIN
              </span>
            </Link>

            {/* Main Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/admin"
                className={`px-3 py-2 rounded-button text-sm font-medium transition-colors ${
                  pathname === '/admin'
                    ? 'bg-red-50 text-red-700'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/admin/users"
                className={`px-3 py-2 rounded-button text-sm font-medium transition-colors ${
                  isActive('/admin/users')
                    ? 'bg-red-50 text-red-700'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                Users
              </Link>
              <Link
                href="/admin/projects"
                className={`px-3 py-2 rounded-button text-sm font-medium transition-colors ${
                  isActive('/admin/projects')
                    ? 'bg-red-50 text-red-700'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                Projects
              </Link>
              <Link
                href="/admin/analytics"
                className={`px-3 py-2 rounded-button text-sm font-medium transition-colors ${
                  isActive('/admin/analytics')
                    ? 'bg-red-50 text-red-700'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                Analytics
              </Link>
              <Link
                href="/admin/settings"
                className={`px-3 py-2 rounded-button text-sm font-medium transition-colors ${
                  isActive('/admin/settings')
                    ? 'bg-red-50 text-red-700'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                Settings
              </Link>
            </nav>
          </div>

          {/* Right: Actions & User Menu */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            {actions && <div className="hidden sm:flex items-center gap-2">{actions}</div>}

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-button hover:bg-neutral-50 transition-colors"
              >
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.displayName || 'User'}
                    className="w-8 h-8 rounded-full object-cover border-2 border-red-200"
                  />
                ) : (
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center border-2 border-red-200">
                    <span className="text-red-700 font-semibold text-sm">
                      {profile?.displayName?.charAt(0).toUpperCase() || 'A'}
                    </span>
                  </div>
                )}
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
                      {profile?.displayName || 'Admin'}
                    </div>
                    <div className="text-xs text-neutral-500">{user?.email}</div>
                    <div className="text-xs font-semibold text-red-600 mt-1">Administrator</div>
                  </div>
                  <Link
                    href="/settings"
                    className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Profile Settings
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
        <nav className="flex gap-2 overflow-x-auto border-t border-neutral-100 py-2 md:hidden">
          <Link href="/admin" className={`shrink-0 px-3 py-2 rounded-button text-sm font-medium ${pathname === '/admin' ? 'bg-red-50 text-red-700' : 'text-neutral-600'}`}>Dashboard</Link>
          <Link href="/admin/users" className={`shrink-0 px-3 py-2 rounded-button text-sm font-medium ${isActive('/admin/users') ? 'bg-red-50 text-red-700' : 'text-neutral-600'}`}>Users</Link>
          <Link href="/admin/projects" className={`shrink-0 px-3 py-2 rounded-button text-sm font-medium ${isActive('/admin/projects') ? 'bg-red-50 text-red-700' : 'text-neutral-600'}`}>Projects</Link>
          <Link href="/admin/analytics" className={`shrink-0 px-3 py-2 rounded-button text-sm font-medium ${isActive('/admin/analytics') ? 'bg-red-50 text-red-700' : 'text-neutral-600'}`}>Analytics</Link>
          <Link href="/admin/settings" className={`shrink-0 px-3 py-2 rounded-button text-sm font-medium ${isActive('/admin/settings') ? 'bg-red-50 text-red-700' : 'text-neutral-600'}`}>Settings</Link>
        </nav>

        {title && (
          <div className="flex flex-col gap-3 py-4 border-t border-neutral-100 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 items-start gap-4 sm:items-center">
            {showBackButton && (
              <button
                onClick={() => router.back()}
                className="mt-1 shrink-0 text-neutral-600 hover:text-neutral-900 transition-colors sm:mt-0"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="break-words text-xl font-display font-bold text-neutral-900 sm:text-2xl">{title}</h1>
              {subtitle && <p className="text-sm text-neutral-600 mt-1">{subtitle}</p>}
            </div>
            </div>
            {actions && <div className="flex flex-wrap gap-2 sm:hidden">{actions}</div>}
          </div>
        )}
      </div>
    </header>
  );
}
