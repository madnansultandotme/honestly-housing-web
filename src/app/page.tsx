import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-white font-sans">
      <main className="flex flex-1 w-full max-w-6xl flex-col items-center justify-center py-20 px-6">
        <div className="flex flex-col items-center gap-8 text-center max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-display font-bold text-neutral-900 leading-tight">
            Welcome to Honestly Housing
          </h1>
          <p className="text-xl md:text-2xl text-neutral-600 leading-relaxed">
            Your boutique luxury home builder platform. Manage selections, track progress, and bring your dream home to life with elegance and ease.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mt-12">
          <Link href="/login">
            <Button size="lg">Sign In</Button>
          </Link>
          <Link href="/signup">
            <Button variant="outline" size="lg">Get Started</Button>
          </Link>
        </div>
        
        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 w-full max-w-5xl">
          <div className="card text-center">
            <div className="w-12 h-12 bg-brass-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-brass-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-display font-semibold text-neutral-900 mb-2">
              Curated Selections
            </h3>
            <p className="text-neutral-600">
              Choose from expertly curated options for every aspect of your home
            </p>
          </div>
          
          <div className="card text-center">
            <div className="w-12 h-12 bg-brass-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-brass-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-display font-semibold text-neutral-900 mb-2">
              Track Progress
            </h3>
            <p className="text-neutral-600">
              Stay on schedule with due dates and milestone tracking
            </p>
          </div>
          
          <div className="card text-center">
            <div className="w-12 h-12 bg-brass-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-brass-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-display font-semibold text-neutral-900 mb-2">
              Seamless Communication
            </h3>
            <p className="text-neutral-600">
              Connect with your builder and make decisions together
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
