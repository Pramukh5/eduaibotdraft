'use client';

import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm mb-8">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">EduAI Assistant</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Welcome back, {user.name}!
          </p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Sign Out"
        >
          <span>Sign Out</span>
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
