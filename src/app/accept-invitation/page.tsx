'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { LoadingOverlay } from '@/components/ui/LoadingSpinner';
import { apiClient } from '@/lib/api/client';
import { CheckCircle, XCircle, Mail } from 'lucide-react';

export default function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    const projectId = searchParams.get('projectId');
    if (!projectId) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    loadInvitation(projectId);
  }, [token, searchParams]);

  const loadInvitation = async (projectId: string) => {
    try {
      setLoading(true);
      
      // Fetch invitation details from project's invitations subcollection
      const response = await fetch(`/api/invitations?projectId=${projectId}`);
      const data = await response.json();

      if (data.invitations && data.invitations.length > 0) {
        // Find the invitation with matching token
        const inv = data.invitations.find((i: any) => i.token === token);
        
        if (!inv) {
          setError('Invitation not found');
        } else if (new Date(inv.expiresAt) < new Date()) {
          setError('This invitation has expired');
        } else if (inv.status !== 'pending') {
          setError('This invitation has already been used');
        } else {
          setInvitation(inv);
        }
      } else {
        setError('Invitation not found');
      }
    } catch (err) {
      console.error('Failed to load invitation:', err);
      setError('Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user) {
      // Redirect to login with return URL
      const projectId = searchParams.get('projectId');
      router.push(`/login?redirect=/accept-invitation?token=${token}&projectId=${projectId}`);
      return;
    }

    try {
      setAccepting(true);
      setError('');

      const projectId = searchParams.get('projectId');
      if (!projectId) {
        setError('Invalid invitation link');
        return;
      }

      const response = await apiClient.post('/invitations/accept', {
        token,
        projectId,
        userId: user.uid,
      });

      setSuccess(true);

      // Redirect to project after 2 seconds
      setTimeout(() => {
        router.push(`/projects/${response.projectId}`);
      }, 2000);
    } catch (err: any) {
      console.error('Failed to accept invitation:', err);
      setError(err.message || 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return <LoadingOverlay fullScreen message="Loading invitation..." />;
  }

  return (
    <div className="min-h-screen bg-taupe-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8">
        {success ? (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-display font-bold text-neutral-900 mb-2">
              Invitation Accepted!
            </h1>
            <p className="text-neutral-600 mb-4">
              You now have access to the project. Redirecting...
            </p>
          </div>
        ) : error ? (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
            </div>
            <h1 className="text-2xl font-display font-bold text-neutral-900 mb-2">
              Invalid Invitation
            </h1>
            <p className="text-neutral-600 mb-6">{error}</p>
            <Button onClick={() => router.push('/')}>
              Go to Home
            </Button>
          </div>
        ) : invitation ? (
          <div>
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-brass-100 rounded-full flex items-center justify-center">
                <Mail className="w-10 h-10 text-brass-700" />
              </div>
            </div>

            <h1 className="text-2xl font-display font-bold text-neutral-900 mb-2 text-center">
              Project Invitation
            </h1>
            
            <p className="text-neutral-600 mb-6 text-center">
              You've been invited to collaborate on a project
            </p>

            <div className="bg-taupe-50 rounded-button p-4 mb-6 space-y-3">
              <div>
                <div className="text-sm text-neutral-600">Project</div>
                <div className="font-semibold text-neutral-900">{invitation.projectName}</div>
              </div>
              <div>
                <div className="text-sm text-neutral-600">Invited by</div>
                <div className="font-semibold text-neutral-900">{invitation.builderName}</div>
              </div>
              <div>
                <div className="text-sm text-neutral-600">Your email</div>
                <div className="font-semibold text-neutral-900">{invitation.email}</div>
              </div>
            </div>

            {!user ? (
              <div className="space-y-3">
                <p className="text-sm text-neutral-600 text-center mb-4">
                  Please sign in or create an account to accept this invitation
                </p>
                <Button
                  onClick={() => {
                    const projectId = searchParams.get('projectId');
                    router.push(`/login?redirect=/accept-invitation?token=${token}&projectId=${projectId}`);
                  }}
                  className="w-full"
                >
                  Sign In to Accept
                </Button>
                <Button
                  onClick={() => {
                    const projectId = searchParams.get('projectId');
                    router.push(`/signup?redirect=/accept-invitation?token=${token}&projectId=${projectId}`);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Create Account
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="w-full"
                >
                  {accepting ? 'Accepting...' : 'Accept Invitation'}
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="w-full"
                >
                  Decline
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
