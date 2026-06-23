import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 - Page Not Found | Honestly Housing',
  description: 'The page you are looking for could not be found.',
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-taupe-50 via-white to-brass-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full text-center">
        {/* Decorative Element */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-brass-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
            <div className="relative">
              <svg
                className="w-24 h-24 sm:w-32 sm:h-32 text-brass-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* 404 Number */}
        <h1 className="text-8xl sm:text-9xl font-display font-bold text-brass-600 mb-4 tracking-tight">
          404
        </h1>

        {/* Heading */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold text-neutral-900 mb-4">
          Page Not Found
        </h2>

        {/* Description */}
        <p className="text-base sm:text-lg text-neutral-600 mb-8 max-w-md mx-auto leading-relaxed">
          We couldn't find the page you're looking for. It may have been moved or doesn't exist.
        </p>

        {/* Divider */}
        <div className="flex items-center justify-center mb-8">
          <div className="h-px w-16 bg-brass-300"></div>
          <svg
            className="w-4 h-4 mx-3 text-brass-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
              clipRule="evenodd"
            />
          </svg>
          <div className="h-px w-16 bg-brass-300"></div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-brass-600 hover:bg-brass-700 text-white font-medium rounded-button transition-colors duration-200 shadow-card hover:shadow-card-hover"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Go Home
          </Link>

          <Link
            href="/projects"
            className="inline-flex items-center px-6 py-3 bg-white hover:bg-neutral-50 text-neutral-900 font-medium rounded-button border border-neutral-300 transition-colors duration-200 shadow-card hover:shadow-card-hover"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            View Projects
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-12 pt-8 border-t border-neutral-200">
          <p className="text-sm text-neutral-500">
            Need assistance?{' '}
            <Link
              href="/login"
              className="text-brass-600 hover:text-brass-700 font-medium transition-colors duration-200"
            >
              Sign in to your account
            </Link>
          </p>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-10 w-32 h-32 bg-brass-200 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-taupe-200 rounded-full opacity-20 blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}
