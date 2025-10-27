'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Chat from './components/Chat';
import PuterFallback from './components/PuterFallback';
import Header from './components/Header';
import { useAuth } from './contexts/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 pb-8">
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">Your personal AI tutor ready to help you learn</p>
        <Chat />
        <PuterFallback />
      </div>
    </main>
  );
}
