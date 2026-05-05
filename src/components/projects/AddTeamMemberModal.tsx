'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { apiClient } from '@/lib/api/client';
import { X } from 'lucide-react';

interface AddTeamMemberModalProps {
  projectId: string;
  projectName: string;
  currentUserRole: 'builder' | 'designer' | 'client';
  onClose: () => void;
  onSuccess: () => void;
}

type TeamMemberRole = 'builder' | 'designer' | 'client';

export default function AddTeamMemberModal({
  projectId,
  projectName,
  currentUserRole,
  onClose,
  onSuccess,
}: AddTeamMemberModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamMemberRole>('client');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Search for user by email
      const searchResult = await apiClient.get(`/users/search?email=${encodeURIComponent(email)}`);
      
      // Handle the response which returns { users: [...] }
      const users = searchResult?.users || [];
      
      if (users.length === 0) {
        setError('User not found. Please ask them to sign up first.');
        setLoading(false);
        return;
      }

      const user = users[0]; // Get the first matching user

      // Check if user is admin (cannot be added to projects)
      if (user.role === 'admin') {
        setError('Admin users cannot be added to projects as team members.');
        setLoading(false);
        return;
      }

      // Add team member to project
      await apiClient.post(`/projects/${projectId}/team`, {
        userId: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: role,
      });

      onSuccess();
    } catch (err: any) {
      console.error('Failed to add team member:', err);
      setError(err.message || 'Failed to add team member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-card shadow-card max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-bold text-neutral-900">
            Add Team Member
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project Info */}
        <div className="mb-6 p-4 bg-taupe-50 rounded-button border border-neutral-200">
          <p className="text-sm text-neutral-600">Adding to project:</p>
          <p className="font-semibold text-neutral-900">{projectName}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-button text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Email Address
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="team.member@example.com"
              required
            />
            <p className="text-xs text-neutral-500 mt-1">
              User must have an existing account
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Role
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 border-2 border-neutral-200 rounded-button hover:border-brass-500 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="role"
                  value="builder"
                  checked={role === 'builder'}
                  onChange={(e) => setRole(e.target.value as TeamMemberRole)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium text-neutral-900">Builder</div>
                  <div className="text-xs text-neutral-600">Full project management access</div>
                </div>
              </label>

              <label className="flex items-center p-3 border-2 border-neutral-200 rounded-button hover:border-brass-500 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="role"
                  value="designer"
                  checked={role === 'designer'}
                  onChange={(e) => setRole(e.target.value as TeamMemberRole)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium text-neutral-900">Designer</div>
                  <div className="text-xs text-neutral-600">Curate and manage selections</div>
                </div>
              </label>

              <label className="flex items-center p-3 border-2 border-neutral-200 rounded-button hover:border-brass-500 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="role"
                  value="client"
                  checked={role === 'client'}
                  onChange={(e) => setRole(e.target.value as TeamMemberRole)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium text-neutral-900">Client</div>
                  <div className="text-xs text-neutral-600">View and approve selections</div>
                </div>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || !email}
            >
              {loading ? 'Adding...' : 'Add Team Member'}
            </Button>
          </div>
        </form>

        {/* Info */}
        <div className="mt-6 p-4 bg-brass-50 border border-brass-200 rounded-button">
          <p className="text-xs text-brass-900">
            <strong>Note:</strong> Admin users cannot be added as team members. 
            The user must already have an account to be added to this project.
          </p>
        </div>
      </div>
    </div>
  );
}
