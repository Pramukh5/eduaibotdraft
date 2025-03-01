'use client';

import { useEffect, useState } from 'react';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [isPuterAvailable, setIsPuterAvailable] = useState(true);

  useEffect(() => {
    // Check if Puter.js is available after a short delay
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && 
          (!window.puter || !window.puter.ai || !window.puter.ai.chat)) {
        setIsPuterAvailable(false);
      }
    }, 3000); // Give it 3 seconds to load

    return () => clearTimeout(timer);
  }, []);

  if (!isPuterAvailable) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600 dark:text-red-400">Puter.js Not Available</h2>
          <p className="mb-4">
            This application requires Puter.js to function properly. Please check your internet connection
            or try again later.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {children}
    </div>
  );
} 