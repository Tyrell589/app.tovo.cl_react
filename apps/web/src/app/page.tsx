/**
 * @fileoverview Home page component for TovoCL restaurant management system
 */

import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';
import { LoginForm } from '@/components/auth/LoginForm';

export default async function HomePage() {
  const session = await getServerSession();

  // If user is already logged in, redirect to dashboard
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            TovoCL
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Restaurant Management System
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
