'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import { apiClient } from '@/lib/api/client';
import { Clock, CheckCircle, XCircle, Mail } from 'lucide-react';

interface Invitation {
  id: string;
  email: string;
  projectName: string;
  builderName: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
}

interface InvitationsListProps {
  projectId: string;
}

export default function InvitationsList({ projectId }: InvitationsListProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvitations();
  }, [projectId]);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get(`/invitations?projectId=${projectId}`);
      setInvitations(data.invitations || []);
    } catch (error) {
      console.error('Failed to load invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'declined':
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
      default:
        return <Clock className="w-5 h-5 text-brass-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-brass-100 text-brass-800',
      accepted: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      cancelled: 'bg-neutral-100 text-neutral-800',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <Card>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Mail className="w-5 h-5 text-brass-700" />
        <h3 className="text-lg font-semibold text-neutral-900">Invited Clients</h3>
      </div>

      <div className="space-y-3">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="flex items-center justify-between p-4 bg-taupe-50 rounded-button border border-neutral-200"
          >
            <div className="flex items-center gap-3 flex-1">
              {getStatusIcon(invitation.status)}
              <div className="flex-1">
                <div className="font-medium text-neutral-900">{invitation.email}</div>
                <div className="text-sm text-neutral-600">
                  Invited {formatDate(invitation.createdAt)}
                  {invitation.status === 'accepted' && invitation.acceptedAt && (
                    <span> • Accepted {formatDate(invitation.acceptedAt)}</span>
                  )}
                  {invitation.status === 'pending' && (
                    <span> • Expires {formatDate(invitation.expiresAt)}</span>
                  )}
                </div>
              </div>
            </div>
            {getStatusBadge(invitation.status)}
          </div>
        ))}
      </div>
    </Card>
  );
}
