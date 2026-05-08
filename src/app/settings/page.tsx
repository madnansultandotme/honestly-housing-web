'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useRouter } from 'next/navigation';
import BuilderHeader from '@/components/navigation/BuilderHeader';
import ClientHeader from '@/components/navigation/ClientHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { uploadUserAvatar } from '@/lib/api/upload';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { showSuccess, showError } = useNotification();
  const router = useRouter();

  // Profile state
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const isBuilder = profile?.role === 'builder' || profile?.role === 'designer' || profile?.role === 'admin';
  const Header = isBuilder ? BuilderHeader : ClientHeader;

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (profile) {
      setDisplayName(profile.displayName || '');
      setPhone(profile.phone || '');
      setAvatarPreview(profile.avatarUrl || null);
    }
  }, [user, profile, router]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(profile?.avatarUrl || null);
  };

  const handleSaveProfile = async () => {
    if (!user || !displayName.trim()) {
      showError('Display name is required');
      return;
    }

    try {
      setSavingProfile(true);
      let avatarUrl = profile?.avatarUrl || null;

      // Upload avatar if changed
      if (avatarFile) {
        setUploadingAvatar(true);
        avatarUrl = await uploadUserAvatar(avatarFile, user.uid);
        setUploadingAvatar(false);
      }

      // Update profile in Firestore
      const response = await fetch(`/api/users/${user.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim(),
          phone: phone.trim() || null,
          avatarUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      showSuccess('Profile updated successfully!');
      
      // Refresh profile in context
      if (refreshProfile) {
        await refreshProfile();
      }
      
      setAvatarFile(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Failed to update profile');
    } finally {
      setSavingProfile(false);
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user || !auth.currentUser) {
      showError('User not authenticated');
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      showError('All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }

    try {
      setChangingPassword(true);

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        user.email!,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Update password
      await updatePassword(auth.currentUser, newPassword);

      showSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password') {
        showError('Current password is incorrect');
      } else if (error.code === 'auth/weak-password') {
        showError('Password is too weak');
      } else {
        showError('Failed to change password');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-taupe-50 flex items-center justify-center">
        <div className="text-neutral-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-taupe-50">
      <Header
        title="Settings"
        subtitle="Manage your profile and preferences"
        showBackButton
      />

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Profile Settings */}
        <Card className="mb-8">
          <h2 className="text-2xl font-display font-bold text-neutral-900 mb-6">
            Profile Information
          </h2>

          <div className="space-y-6">
            {/* Avatar Upload */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                Profile Picture
              </label>
              <div className="flex items-center gap-6">
                <div className="relative">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-4 border-brass-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-brass-100 flex items-center justify-center border-4 border-brass-200">
                      <span className="text-3xl font-semibold text-brass-700">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarSelect}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-button border-2 border-brass-600 text-brass-700 hover:bg-brass-50 focus:ring-brass-500 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Upload Photo
                  </label>
                  {avatarFile && (
                    <Button variant="outline" size="sm" onClick={handleRemoveAvatar}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Display Name */}
            <Input
              label="Full Name *"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your full name"
            />

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Email Address
              </label>
              <Input
                value={user.email || ''}
                disabled
                className="bg-neutral-100 cursor-not-allowed"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Email cannot be changed
              </p>
            </div>

            {/* Phone */}
            <Input
              label="Phone Number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />

            {/* Role (read-only) */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Role
              </label>
              <div className="inline-flex items-center px-3 py-2 bg-brass-50 border border-brass-200 rounded-button">
                <span className="text-sm font-medium text-brass-800 capitalize">
                  {profile.role}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSaveProfile}
                disabled={savingProfile || uploadingAvatar || !displayName.trim()}
              >
                {savingProfile ? 'Saving...' : uploadingAvatar ? 'Uploading...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Password Change */}
        <Card>
          <h2 className="text-2xl font-display font-bold text-neutral-900 mb-6">
            Change Password
          </h2>

          <div className="space-y-6">
            <Input
              label="Current Password *"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />

            <Input
              label="New Password *"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 6 characters)"
            />

            <Input
              label="Confirm New Password *"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleChangePassword}
                disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
              >
                {changingPassword ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
