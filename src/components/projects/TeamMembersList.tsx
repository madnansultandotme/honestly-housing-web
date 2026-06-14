'use client';

import { useState, useEffect } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import { apiClient } from '@/lib/api/client';
import { Users, Trash2 } from 'lucide-react';

interface TeamMember {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  role: 'builder' | 'designer' | 'client';
  addedAt: string;
  addedBy: string;
}

interface TeamMembersListProps {
  projectId: string;
  currentUserId: string;
  currentUserRole: 'builder' | 'designer' | 'client' | 'admin';
  onUpdate?: () => void;
}

export default function TeamMembersList({
  projectId,
  currentUserId,
  currentUserRole,
  onUpdate,
}: TeamMembersListProps) {
  const { confirm, showError } = useNotification();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    loadTeamMembers();
  }, [projectId]);

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get(`/projects/${projectId}/team`);
      setTeamMembers(data.teamMembers || []);
    } catch (error) {
      console.error('Failed to load team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    const confirmed = await confirm(
      'Are you sure you want to remove this team member? They will lose access to this project.',
      'Remove Team Member'
    );
    
    if (!confirmed) {
      return;
    }

    try {
      setRemoving(memberId);
      await apiClient.delete(`/projects/${projectId}/team/${memberId}`);
      await loadTeamMembers();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to remove team member:', error);
      showError('Failed to remove team member. Please try again.');
    } finally {
      setRemoving(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'builder':
        return 'bg-brass-100 text-brass-800';
      case 'designer':
        return 'bg-purple-100 text-purple-800';
      case 'client':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-16 bg-neutral-100 rounded-button"></div>
        <div className="h-16 bg-neutral-100 rounded-button"></div>
      </div>
    );
  }

  if (teamMembers.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        <Users className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
        <p className="text-sm">No additional team members yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {teamMembers.map((member) => (
        <div
          key={member.id}
          className="flex flex-col gap-3 p-4 bg-white border border-neutral-200 rounded-button hover:border-brass-300 transition-colors sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-3">
              <div className="w-10 h-10 bg-brass-100 rounded-full flex items-center justify-center">
                <span className="text-brass-700 font-semibold text-sm">
                  {member.displayName?.charAt(0).toUpperCase() || member.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-medium text-neutral-900">{member.displayName || 'Unknown'}</p>
                <p className="break-all text-sm text-neutral-600">{member.email}</p>
              </div>
            </div>
          </div>

          <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(
                member.role
              )}`}
            >
              {member.role}
            </span>

            {/* Only allow removal if current user is builder/designer/admin and not removing themselves */}
            {(currentUserRole === 'builder' ||
              currentUserRole === 'designer' ||
              currentUserRole === 'admin') &&
              member.userId !== currentUserId && (
                <button
                  onClick={() => handleRemove(member.id)}
                  disabled={removing === member.id}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-button transition-colors disabled:opacity-50"
                  title="Remove team member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
          </div>
        </div>
      ))}
    </div>
  );
}
