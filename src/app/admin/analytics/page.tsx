'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import BuilderHeader from '@/components/navigation/BuilderHeader';
import Card from '@/components/ui/Card';
import { LoadingOverlay } from '@/components/ui/LoadingSpinner';
import { BarChart3 } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (profile && profile.role !== 'admin') {
      router.push('/builder');
      return;
    }
  }, [user, profile, router]);

  if (!profile) {
    return <LoadingOverlay fullScreen message="Loading..." />;
  }

  if (profile.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-taupe-50">
      <BuilderHeader
        title="Analytics"
        subtitle="System analytics and reports"
        showBackButton
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="text-center py-16">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Analytics Coming Soon</h3>
            <p className="text-neutral-600">
              Advanced analytics and reporting features will be available here.
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}
