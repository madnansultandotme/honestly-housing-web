'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProjectTabsProps {
  projectId: string;
}

const tabs = [
  { id: 'details', label: 'Overview', href: (id: string) => `/projects/${id}` },
  { id: 'selections', label: 'Selections', href: (id: string) => `/projects/${id}/selections` },
  { id: 'photos', label: 'Photos', href: (id: string) => `/projects/${id}/photos` },
  { id: 'messages', label: 'Messages', href: (id: string) => `/projects/${id}/messages` },
];

export default function ProjectTabs({ projectId }: ProjectTabsProps) {
  const pathname = usePathname();
  const { profile } = useAuth();
  const isBuilder = profile?.role === 'builder' || profile?.role === 'designer' || profile?.role === 'admin';

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
  const visibleTabs = isBuilder
    ? [...tabs, { id: 'purchasing', label: 'Purchasing', href: (id: string) => `/projects/${id}/purchasing` }]
    : tabs;

  return (
    <div className="border-b border-neutral-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex gap-2 overflow-x-auto py-3">
          {visibleTabs.map((tab) => {
            const href = tab.href(projectId);
            const active = isActive(href);
            return (
              <Link
                key={tab.id}
                href={href}
                className={`px-3 py-2 rounded-button text-sm font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-brass-50 text-brass-700'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
