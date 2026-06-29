'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import BuilderHeader from '@/components/navigation/BuilderHeader';
import ClientHeader from '@/components/navigation/ClientHeader';
import DesignerHeader from '@/components/navigation/DesignerHeader';
import AdminHeader from '@/components/navigation/AdminHeader';
import Card from '@/components/ui/Card';
import { LoadingOverlay } from '@/components/ui/LoadingSpinner';
import ScopeOfWorkExport from '@/components/scope-of-work/ScopeOfWorkExport';
import { apiClient } from '@/lib/api/client';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface ScopeDocument {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryCode: string;
  status: 'completed' | 'skipped' | 'incomplete';
  data: any;
  files: string[];
  notes: string;
  completedAt?: string;
  completedBy?: string;
}

export default function ScopeOfWorkViewPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [scopes, setScopes] = useState<ScopeDocument[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [user, projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectData, scopesData] = await Promise.all([
        apiClient.get(`/projects/${projectId}`),
        apiClient.get(`/scope-of-work?projectId=${projectId}`),
      ]);
      
      setProject(projectData);
      setScopes(scopesData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-6 h-6 text-green-600" />;
      case 'skipped':
        return <XCircleIcon className="w-6 h-6 text-amber-600" />;
      default:
        return <ClockIcon className="w-6 h-6 text-neutral-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Completed</span>;
      case 'skipped':
        return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">Skipped</span>;
      default:
        return <span className="px-3 py-1 bg-neutral-100 text-neutral-600 rounded-full text-sm font-medium">Incomplete</span>;
    }
  };

  if (loading) {
    return <LoadingOverlay fullScreen message="Loading scope of work..." />;
  }

  if (!project) {
    return <div>Project not found</div>;
  }

  let Header;
  if (profile?.role === 'admin') {
    Header = AdminHeader;
  } else if (profile?.role === 'designer') {
    Header = DesignerHeader;
  } else if (profile?.role === 'builder') {
    Header = BuilderHeader;
  } else {
    Header = ClientHeader;
  }

  const completedCount = scopes.filter(s => s.status === 'completed' || s.status === 'skipped').length;
  const totalCount = scopes.length;

  return (
    <div className="min-h-screen bg-taupe-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/projects/${projectId}`)}
            className="text-brass-600 hover:text-brass-700 mb-4 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Project
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-neutral-900">
                Scope of Work
              </h1>
              <p className="text-neutral-600 mt-2">{project.name}</p>
            </div>
            <ScopeOfWorkExport projectId={projectId} projectName={project.name} />
          </div>
        </div>

        {/* Progress Summary */}
        {totalCount > 0 && (
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-neutral-800">
                Completion Status
              </h3>
              <span className="text-sm text-neutral-600">
                {completedCount} of {totalCount} completed
              </span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-3">
              <div
                className="bg-brass-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </Card>
        )}

        {/* Scope Documents */}
        {scopes.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-neutral-600">
              No scope of work documents found for this project.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {scopes.map((scope) => {
              const isExpanded = expandedCategories.has(scope.id);

              return (
                <Card key={scope.id} className="overflow-hidden">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(scope.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(scope.status)}
                      <div className="text-left">
                        <h4 className="font-semibold text-neutral-800">
                          {scope.categoryCode}. {scope.categoryName}
                        </h4>
                        {scope.completedAt && (
                          <p className="text-sm text-neutral-600">
                            Completed on {new Date(scope.completedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(scope.status)}
                      {isExpanded ? (
                        <ChevronUpIcon className="w-5 h-5 text-neutral-400" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5 text-neutral-400" />
                      )}
                    </div>
                  </button>

                  {/* Category Content */}
                  {isExpanded && (
                    <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50">
                      {/* Notes */}
                      {scope.notes && (
                        <div className="mb-4">
                          <h5 className="text-sm font-semibold text-neutral-700 mb-2">Notes:</h5>
                          <p className="text-sm text-neutral-600 whitespace-pre-wrap">{scope.notes}</p>
                        </div>
                      )}

                      {/* Files */}
                      {scope.files && scope.files.length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-sm font-semibold text-neutral-700 mb-2">
                            Attached Files ({scope.files.length}):
                          </h5>
                          <div className="space-y-2">
                            {scope.files.map((fileUrl, index) => (
                              <a
                                key={index}
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-sm text-brass-600 hover:text-brass-700"
                              >
                                Document {index + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Data Preview */}
                      {scope.data && Object.keys(scope.data).length > 0 && (
                        <div>
                          <h5 className="text-sm font-semibold text-neutral-700 mb-2">Details:</h5>
                          <div className="text-sm text-neutral-600 bg-white p-3 rounded border border-neutral-200">
                            <pre className="whitespace-pre-wrap font-mono text-xs">
                              {JSON.stringify(scope.data, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
