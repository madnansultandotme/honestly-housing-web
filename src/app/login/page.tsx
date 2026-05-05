'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      
      const { doc: docRef, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/config');
      const { getAuth } = await import('firebase/auth');
      const uid = getAuth().currentUser?.uid;
      const userDoc = uid ? await getDoc(docRef(db, 'users', uid)) : null;

      const role = userDoc?.exists() ? userDoc.data().role : null;

      if (role === 'builder' || role === 'designer' || role === 'admin') {
        router.push('/builder');
      } else {
        router.push('/client');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();

      const { doc: docRef, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/config');
      const { getAuth } = await import('firebase/auth');
      const uid = getAuth().currentUser?.uid;
      const userDoc = uid ? await getDoc(docRef(db, 'users', uid)) : null;

      const role = userDoc?.exists() ? userDoc.data().role : null;
      if (role === 'builder' || role === 'designer' || role === 'admin') {
        router.push('/builder');
      } else {
        router.push('/client');
      }
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
              Welcome Back
            </h2>
            <p className="text-sm text-neutral-600">
              Sign in to your account to continue
            </p>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-neutral-200 mb-6"></div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-button text-sm">
                {error}
              </div>
            )}

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

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="text-center">
              <Link href="/forgot-password" className="text-sm text-brass-700 hover:text-brass-800">
                Forgot your password? <span className="underline">Reset it here</span>
              </Link>
            </div>

            <div className="text-center">
              <span className="text-sm text-neutral-600">New here? </span>
              <Link href="/signup" className="text-sm text-brass-700 hover:text-brass-800 underline">
                Create an account
              </Link>
            </div>
          </form>

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
