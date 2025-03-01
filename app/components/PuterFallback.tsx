'use client';

import { useState, useEffect } from 'react';

export default function PuterFallback() {
  const [showFallback, setShowFallback] = useState(false);
  
  useEffect(() => {
    // Check if Puter.js is available after a reasonable loading time
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && 
          (!window.puter || !window.puter.ai || !window.puter.ai.chat)) {
        setShowFallback(true);
      }
    }, 5000); // Give it 5 seconds to load
    
    return () => clearTimeout(timer);
  }, []);
  
  if (!showFallback) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-red-600 dark:text-red-400">
          Puter.js Not Available
        </h2>
        <p className="mb-6 text-gray-700 dark:text-gray-300">
          This application requires Puter.js to function properly. There are a few things you can try:
        </p>
        <ul className="list-disc pl-5 mb-6 text-gray-700 dark:text-gray-300 space-y-2">
          <li>Check your internet connection</li>
          <li>Disable any content blockers or ad blockers</li>
          <li>Try a different browser</li>
          <li>Reload the page</li>
        </ul>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowFallback(false)}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
} 