'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

type UserRole = 'builder' | 'designer' | 'homeowner' | 'admin';
type SignupStep = 'role' | 'homeowner-question' | 'credentials';

export default function SignupPage() {
  const [step, setStep] = useState<SignupStep>('role');
  const [role, setRole] = useState<UserRole | null>(null);
  const [hasBuilder, setHasBuilder] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    if (selectedRole === 'homeowner') {
      setStep('homeowner-question');
    } else {
      setStep('credentials');
    }
  };

  const handleHomeownerQuestion = (answer: boolean) => {
    setHasBuilder(answer);
    if (answer) {
      // If they have a builder, redirect to login
      router.push('/login?message=Please use the credentials sent by your builder');
    } else {
      setStep('credentials');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (!role) {
      return setError('Please select a role');
    }

    setError('');
    setLoading(true);

    try {
      const userCredential = await signUp(email, password);
      
      const roleForProfile = role === 'homeowner' ? 'client' : role;

      // Create user profile in Firestore
      if (userCredential?.user) {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: email.toLowerCase().trim(), // Normalize email for consistent searching
          displayName: displayName || email.split('@')[0],
          role: roleForProfile,
          hasBuilder: role === 'homeowner' ? hasBuilder : null,
          createdAt: new Date().toISOString(),
          projectIds: [],
        });
      }

      // Redirect based on role
      if (roleForProfile === 'builder' || roleForProfile === 'designer' || roleForProfile === 'admin') {
        router.push('/builder');
      } else {
        router.push('/client');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-taupe-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-card shadow-card p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-brass-100 rounded-button flex items-center justify-center">
              <svg className="w-10 h-10 text-brass-700" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">
              {step === 'role' ? 'Welcome!' : step === 'homeowner-question' ? 'Quick Question' : 'Create Your Account'}
            </h2>
            <p className="text-sm text-neutral-600">
              {step === 'role' ? 'Select your role to get started' : step === 'homeowner-question' ? 'Are you working with a builder?' : 'Complete your profile'}
            </p>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-neutral-200 mb-6"></div>

          {/* Role Selection Step */}
          {step === 'role' && (
            <div className="space-y-3">
              <button
                onClick={() => handleRoleSelect('builder')}
                className="w-full p-4 border-2 border-neutral-200 rounded-button hover:border-brass-500 hover:bg-brass-50 transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brass-100 rounded-button flex items-center justify-center group-hover:bg-brass-200">
                    <svg className="w-6 h-6 text-brass-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-neutral-900">Builder</div>
                    <div className="text-sm text-neutral-600">Manage projects and clients</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleRoleSelect('designer')}
                className="w-full p-4 border-2 border-neutral-200 rounded-button hover:border-brass-500 hover:bg-brass-50 transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brass-100 rounded-button flex items-center justify-center group-hover:bg-brass-200">
                    <svg className="w-6 h-6 text-brass-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-neutral-900">Designer</div>
                    <div className="text-sm text-neutral-600">Curate selections for clients</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleRoleSelect('homeowner')}
                className="w-full p-4 border-2 border-neutral-200 rounded-button hover:border-brass-500 hover:bg-brass-50 transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brass-100 rounded-button flex items-center justify-center group-hover:bg-brass-200">
                    <svg className="w-6 h-6 text-brass-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-neutral-900">Home Owner</div>
                    <div className="text-sm text-neutral-600">Make selections for your home</div>
                  </div>
                </div>
              </button>

              <div className="text-center pt-4">
                <span className="text-sm text-neutral-600">Already have an account? </span>
                <Link href="/login" className="text-sm text-brass-700 hover:text-brass-800 underline">
                  Sign in
                </Link>
              </div>
            </div>
          )}

          {/* Homeowner Question Step */}
          {step === 'homeowner-question' && (
            <div className="space-y-4">
              <p className="text-center text-neutral-700 mb-6">
                Are you currently working with a builder or designer?
              </p>

              <button
                onClick={() => handleHomeownerQuestion(true)}
                className="w-full p-4 border-2 border-neutral-200 rounded-button hover:border-brass-500 hover:bg-brass-50 transition-all"
              >
                <div className="font-semibold text-neutral-900">Yes, I'm working with a builder</div>
                <div className="text-sm text-neutral-600 mt-1">Use credentials sent by your builder</div>
              </button>

              <button
                onClick={() => handleHomeownerQuestion(false)}
                className="w-full p-4 border-2 border-neutral-200 rounded-button hover:border-brass-500 hover:bg-brass-50 transition-all"
              >
                <div className="font-semibold text-neutral-900">No, I'm on my own</div>
                <div className="text-sm text-neutral-600 mt-1">Create your own account</div>
              </button>

              <button
                onClick={() => setStep('role')}
                className="w-full text-sm text-neutral-600 hover:text-neutral-900 mt-4"
              >
                ← Back to role selection
              </button>
            </div>
          )}

          {/* Credentials Step */}
          {step === 'credentials' && (
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-button text-sm">
                  {error}
                </div>
              )}

              <div className="mb-4 p-3 bg-brass-50 border border-brass-200 rounded-button">
                <div className="text-sm font-medium text-brass-900">
                  Creating account as: <span className="capitalize">{role}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500 focus:border-transparent bg-white text-neutral-900 placeholder-neutral-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Email Address
                </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 pr-10 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500 focus:border-transparent bg-white text-neutral-900 placeholder-neutral-400"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-10 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500 focus:border-transparent bg-white text-neutral-900 placeholder-neutral-400"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3 pr-10 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500 focus:border-transparent bg-white text-neutral-900 placeholder-neutral-400"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
            </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>

              <button
                type="button"
                onClick={() => setStep('role')}
                className="w-full text-sm text-neutral-600 hover:text-neutral-900"
              >
                ← Back to role selection
              </button>

              <div className="text-center">
                <span className="text-sm text-neutral-600">Already have an account? </span>
                <Link href="/login" className="text-sm text-brass-700 hover:text-brass-800 underline">
                  Sign in
                </Link>
              </div>
            </form>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-neutral-200">
            <div className="flex justify-center items-center gap-2 text-xs text-neutral-500">
              <span>◆</span>
              <span>Builder Team</span>
              <span>◆</span>
              <span>Client Portal</span>
              <span>◆</span>
            </div>
            <div className="text-center mt-2 text-xs text-neutral-400">
              Role-based access • Secure authentication
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
