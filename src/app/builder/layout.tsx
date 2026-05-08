'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function BuilderLayout({ children }: { children: ReactNode }) {
  const { user, loading, profile, profileLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || profileLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (!profile) {
      router.push('/login?message=Profile%20not%20found');
      return;
    }

    const role = profile.role;
    if (role === 'admin') {
      router.push('/admin');
    } else if (role !== 'builder' && role !== 'designer') {
      router.push('/client');
    }
  }, [loading, profileLoading, user, profile, router]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-taupe-50 flex items-center justify-center">
        <div className="text-neutral-600">Loading dashboard...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const role = profile.role;
  if (role === 'admin') {
    return null;
  }
  if (role !== 'builder' && role !== 'designer') {
    return null;
  }

  return <>{children}</>;
}
