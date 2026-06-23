'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { uploadImage } from '@/lib/api/upload';
import Image from 'next/image';

export default function BuilderOrgPage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [orgId, setOrgId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadOrg();
  }, [user, profile]);

  const loadOrg = async () => {
    try {
      setLoading(true);
      const existingOrgId = profile?.builderOrgId || '';
      setOrgId(existingOrgId);

      if (!existingOrgId) {
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/builder-orgs?builderOrgId=${existingOrgId}`);
      const data = await response.json();
      const org = data.builderOrg || {};
      setName(org.name || '');
      setEmail(org.email || '');
      setPhone(org.phone || '');
      setAddress(org.address || '');
      setLogoUrl(org.branding?.logoUrl || '');
      setLogoPreview(org.branding?.logoUrl || '');
    } catch (err) {
      console.error('Failed to load builder org:', err);
      setError('Failed to load organization');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    setLogoUrl('');
  };

  const handleSave = async () => {
    if (!user) return;

    // Validation
    if (!name.trim()) {
      setError('Organization name is required');
      return;
    }
    if (!email.trim()) {
      setError('Business email is required');
      return;
    }
    if (!phone.trim()) {
      setError('Business phone is required');
      return;
    }

    try {
      setSaving(true);
      setError('');

      // Upload logo if a new file was selected
      let uploadedLogoUrl = logoUrl;
      if (logoFile) {
        setUploading(true);
        uploadedLogoUrl = await uploadImage(logoFile, 'builderOrgs');
        setUploading(false);
      }

      const orgData = {
        name,
        email,
        phone,
        address: address || null,
        branding: {
          logoUrl: uploadedLogoUrl || null,
        },
      };

      if (!orgId) {
        const response = await fetch('/api/builder-orgs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ...orgData,
            ownerId: user.uid 
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to create organization');
        }

        setOrgId(data.builderOrgId);
        setLogoUrl(uploadedLogoUrl);

        await fetch(`/api/users/${user.uid}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ builderOrgId: data.builderOrgId }),
        });
      } else {
        const response = await fetch(`/api/builder-orgs/${orgId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orgData),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update organization');
        }
        
        setLogoUrl(uploadedLogoUrl);
      }

      // Clear the file input after successful save
      setLogoFile(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save organization');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-taupe-50 flex items-center justify-center">
        <div className="text-neutral-600">Loading organization...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-taupe-50">
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">Organization</h1>
          <p className="text-neutral-600">Manage your builder organization details.</p>
        </div>

        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            {orgId ? 'Edit Organization' : 'Create Organization'}
          </h2>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-button text-red-700 text-sm">
              {error}
            </div>
          )}
          <div className="space-y-6">
            {/* Company Logo */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Company Logo
              </label>
              {logoPreview ? (
                <div className="flex items-start gap-4">
                  <div className="relative w-32 h-32 border-2 border-neutral-200 rounded-button overflow-hidden bg-white">
                    <Image
                      src={logoPreview}
                      alt="Company logo"
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                      <span className="inline-block px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-button hover:bg-neutral-50 transition-colors">
                        Change Logo
                      </span>
                    </label>
                    <Button
                      variant="outline"
                      onClick={handleRemoveLogo}
                      className="text-sm"
                    >
                      Remove Logo
                    </Button>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-neutral-300 rounded-button hover:border-brass-500 transition-colors">
                    <div className="text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-neutral-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <p className="mt-2 text-sm text-neutral-600">
                        Click to upload company logo
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        PNG, JPG up to 10MB
                      </p>
                    </div>
                  </div>
                </label>
              )}
            </div>

            {/* Organization Name */}
            <Input
              label="Organization Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your company name"
              required
            />

            {/* Business Email */}
            <Input
              label="Business Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="info@yourcompany.com"
              required
            />

            {/* Business Phone */}
            <Input
              label="Business Phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              required
            />

            {/* Business Address */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Business Address <span className="text-neutral-500 text-xs">(Optional)</span>
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main Street&#10;Suite 100&#10;City, State 12345"
                rows={3}
                className="w-full px-4 py-2 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500 focus:border-transparent"
              />
            </div>

            {/* Save Button */}
            <Button 
              onClick={handleSave} 
              disabled={saving || uploading}
              className="w-full"
            >
              {uploading ? 'Uploading...' : saving ? 'Saving...' : orgId ? 'Update Organization' : 'Create Organization'}
            </Button>

            {/* Info Note */}
            <div className="mt-4 p-4 bg-brass-50 border border-brass-200 rounded-button">
              <p className="text-sm text-brass-800">
                <strong>Note:</strong> This information will be displayed on invoices, scope of work documents, and other official documents sent to clients.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
