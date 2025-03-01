'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

declare global {
  interface Window {
    puter: {
      ai: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        chat: (prompt: string, options?: { stream: boolean }) => Promise<any>;
      };
    };
  }
}

const systemPrompt = `You are EduAI, an intelligent and supportive educational assistant. Your primary goal is to help students learn effectively by:
1. Breaking down complex topics into simple, understandable concepts
2. Providing clear, step-by-step explanations
3. Creating engaging practice questions and quizzes
4. Offering study tips and learning strategies
5. Using the Socratic method to guide students to answers
6. Adapting your teaching style to each student's needs

Always maintain an encouraging and patient demeanor. If a student is struggling, break down the concept into smaller, more digestible parts.`;

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState('');
  const [isPuterLoaded, setIsPuterLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStreamingMessage]);

  // Check if Puter.js is loaded
  useEffect(() => {
    // Function to check if Puter.js is available
    const checkPuterAvailable = () => {
      return typeof window !== 'undefined' && 
             window.puter !== undefined && 
             window.puter.ai !== undefined && 
             typeof window.puter.ai.chat === 'function';
    };
    
    // If already available, set state and exit
    if (checkPuterAvailable()) {
      setIsPuterLoaded(true);
      return;
    }
    
    // Otherwise, check periodically
    const interval = setInterval(() => {
      if (checkPuterAvailable()) {
        setIsPuterLoaded(true);
        clearInterval(interval);
      }
    }, 500);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !isPuterLoaded) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setCurrentStreamingMessage('');

    try {
      // Combine system prompt with user input
      const fullPrompt = `${systemPrompt}\n\nUser: ${input}`;
      
      // Use streaming for better UX
      const response = await window.puter.ai.chat(fullPrompt, { stream: true });
      
      let fullResponse = '';
      for await (const part of response) {
        fullResponse += part?.text || '';
        setCurrentStreamingMessage(fullResponse);
      }

      const assistantMessage: Message = { role: 'assistant', content: fullResponse };
      setMessages(prev => [...prev, assistantMessage]);
      setCurrentStreamingMessage('');
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[80vh] max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {!isPuterLoaded && (
          <div className="text-center p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
            Loading Puter.js... Please wait.
          </div>
        )}
        {messages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}
            >
              <div className="prose dark:prose-invert max-w-none">
                <ReactMarkdown>
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          </motion.div>
        ))}
        {currentStreamingMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="max-w-[80%] p-4 rounded-lg bg-gray-100 dark:bg-gray-700">
              <div className="prose dark:prose-invert max-w-none">
                <ReactMarkdown>
                  {currentStreamingMessage}
                </ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
        {isLoading && !currentStreamingMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t dark:border-gray-600">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about your studies, request practice questions, or get help with a topic..."
            className="flex-1 p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            disabled={!isPuterLoaded}
          />
          <button
            type="submit"
            disabled={isLoading || !isPuterLoaded}
            className="px-6 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <span>Ask</span>
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
} 