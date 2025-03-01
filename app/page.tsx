import Chat from './components/Chat';
import PuterFallback from './components/PuterFallback';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">EduAI Assistant</h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">Your personal AI tutor ready to help you learn</p>
        <Chat />
        <PuterFallback />
      </div>
    </main>
  );
}
