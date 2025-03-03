'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { PaperAirplaneIcon, ArrowDownTrayIcon } from '@heroicons/react/24/solid';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Define a type for the streaming response part
interface ChatResponsePart {
  text?: string;
  [key: string]: unknown;
}

// Define a type for the async iterable response
type AsyncIterableResponse = AsyncIterable<ChatResponsePart>;

declare global {
  interface Window {
    puter: {
      ai: {
        chat: (prompt: string, options?: { stream: boolean }) => Promise<unknown>;
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

// Maximum number of messages to keep in context
const MAX_CONTEXT_MESSAGES = 10;

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState('');
  const [isPuterLoaded, setIsPuterLoaded] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load chat history from localStorage when component mounts
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatHistory');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages);
      } catch (error) {
        console.error('Error parsing saved messages:', error);
      }
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatHistory', JSON.stringify(messages));
    }
  }, [messages]);

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

  // Function to build the prompt with context from previous messages
  const buildPromptWithContext = (userInput: string) => {
    // Get the most recent messages for context (limited to MAX_CONTEXT_MESSAGES)
    const recentMessages = messages.slice(-MAX_CONTEXT_MESSAGES);
    
    // Start with the system prompt
    let fullPrompt = `${systemPrompt}\n\n`;
    
    // Add context from previous messages
    if (recentMessages.length > 0) {
      fullPrompt += "Previous conversation:\n";
      recentMessages.forEach(msg => {
        fullPrompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });
      fullPrompt += "\n";
    }
    
    // Add the current user input
    fullPrompt += `User: ${userInput}`;
    
    return fullPrompt;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !isPuterLoaded) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setCurrentStreamingMessage('');

    try {
      // Build prompt with context from previous messages
      const fullPrompt = buildPromptWithContext(input);
      
      // Use streaming for better UX
      const response = await window.puter.ai.chat(fullPrompt, { stream: true });
      
      let fullResponse = '';
      // Use type assertion to tell TypeScript that response is an AsyncIterable
      for await (const part of response as AsyncIterableResponse) {
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

  // Function to clear chat history
  const clearChatHistory = () => {
    setMessages([]);
    localStorage.removeItem('chatHistory');
  };

  // Function to download chat history as PDF
  const downloadChatAsPDF = async () => {
    if (messages.length === 0) return;
    
    setIsGeneratingPDF(true);
    
    try {
      const chatElement = chatContainerRef.current;
      if (!chatElement) {
        throw new Error('Chat container not found');
      }
      
      // Create a timestamp for the filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `eduai-chat-${timestamp}.pdf`;
      
      // Create a clone of the chat container with simplified styling
      const clonedChat = document.createElement('div');
      clonedChat.style.padding = '20px';
      clonedChat.style.backgroundColor = '#ffffff';
      clonedChat.style.color = '#000000';
      clonedChat.style.fontFamily = 'Arial, sans-serif';
      clonedChat.style.width = '800px';
      
      // Add title to the cloned element
      const titleElement = document.createElement('h1');
      titleElement.textContent = 'EduAI Chat History';
      titleElement.style.textAlign = 'center';
      titleElement.style.marginBottom = '5px';
      titleElement.style.fontSize = '24px';
      clonedChat.appendChild(titleElement);
      
      // Add timestamp
      const timestampElement = document.createElement('p');
      timestampElement.textContent = `Generated: ${new Date().toLocaleString()}`;
      timestampElement.style.textAlign = 'center';
      timestampElement.style.marginBottom = '20px';
      timestampElement.style.fontSize = '14px';
      clonedChat.appendChild(timestampElement);
      
      // Add a horizontal line
      const hrElement = document.createElement('hr');
      hrElement.style.marginBottom = '20px';
      hrElement.style.border = '1px solid #cccccc';
      clonedChat.appendChild(hrElement);
      
      // Add messages with simplified styling
      const messagesContainer = document.createElement('div');
      messagesContainer.style.display = 'flex';
      messagesContainer.style.flexDirection = 'column';
      messagesContainer.style.gap = '15px';
      
      // Helper function to convert markdown to HTML
      const markdownToHTML = (markdown: string) => {
        // Simple markdown conversion for PDF
        // Convert headers
        let html = markdown
          .replace(/^### (.*$)/gim, '<h3>$1</h3>')
          .replace(/^## (.*$)/gim, '<h2>$1</h2>')
          .replace(/^# (.*$)/gim, '<h1>$1</h1>');
          
        // Convert bold and italic
        html = html
          .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/gim, '<em>$1</em>')
          .replace(/__(.*?)__/gim, '<strong>$1</strong>')
          .replace(/_(.*?)_/gim, '<em>$1</em>');
          
        // Convert lists
        html = html
          .replace(/^\s*\n\* (.*)/gim, '<ul>\n<li>$1</li>')
          .replace(/^\s*\n- (.*)/gim, '<ul>\n<li>$1</li>');
          
        // Convert numbered lists
        html = html
          .replace(/^\s*\n\d\. (.*)/gim, '<ol>\n<li>$1</li>');
          
        // Convert code blocks
        html = html
          .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
          .replace(/`([^`]+)`/gim, '<code>$1</code>');
          
        // Convert paragraphs
        html = html
          .replace(/^\s*\n(?!\s*$)/gim, '</p>\n<p>')
          .replace(/^\s*$/gim, '</p>\n<p>');
          
        // Wrap with paragraph tags
        html = '<p>' + html + '</p>';
        
        // Fix any broken tags
        html = html
          .replace(/<\/p>\s*<\/p>/gim, '</p>')
          .replace(/<p>\s*<\/p>/gim, '')
          .replace(/<\/p>\s*<p>/gim, '<br>');
          
        return html;
      };
      
      messages.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.style.maxWidth = '80%';
        messageElement.style.padding = '10px';
        messageElement.style.borderRadius = '8px';
        messageElement.style.marginBottom = '10px';
        
        if (message.role === 'user') {
          messageElement.style.alignSelf = 'flex-end';
          messageElement.style.backgroundColor = '#2563eb';
          messageElement.style.color = '#ffffff';
        } else {
          messageElement.style.alignSelf = 'flex-start';
          messageElement.style.backgroundColor = '#f3f4f6';
          messageElement.style.color = '#000000';
        }
        
        const roleLabel = document.createElement('div');
        roleLabel.textContent = message.role === 'user' ? 'You:' : 'EduAI:';
        roleLabel.style.fontWeight = 'bold';
        roleLabel.style.marginBottom = '5px';
        messageElement.appendChild(roleLabel);
        
        const contentElement = document.createElement('div');
        contentElement.style.whiteSpace = 'pre-wrap';
        
        // Use HTML for content instead of plain text to preserve formatting
        contentElement.innerHTML = markdownToHTML(message.content);
        
        // Style the HTML content
        const styleElements = (element: HTMLElement) => {
          if (element.tagName === 'CODE') {
            element.style.fontFamily = 'monospace';
            element.style.backgroundColor = message.role === 'user' ? '#1e40af' : '#e5e7eb';
            element.style.padding = '2px 4px';
            element.style.borderRadius = '4px';
            element.style.fontSize = '0.9em';
          } else if (element.tagName === 'PRE') {
            element.style.backgroundColor = message.role === 'user' ? '#1e40af' : '#e5e7eb';
            element.style.padding = '8px';
            element.style.borderRadius = '4px';
            element.style.overflowX = 'auto';
            element.style.fontFamily = 'monospace';
            element.style.fontSize = '0.9em';
          } else if (element.tagName === 'H1' || element.tagName === 'H2' || element.tagName === 'H3') {
            element.style.fontWeight = 'bold';
            element.style.marginTop = '10px';
            element.style.marginBottom = '5px';
          } else if (element.tagName === 'UL' || element.tagName === 'OL') {
            element.style.paddingLeft = '20px';
            element.style.marginTop = '5px';
            element.style.marginBottom = '5px';
          }
          
          // Recursively style child elements
          Array.from(element.children).forEach(child => {
            styleElements(child as HTMLElement);
          });
        };
        
        // Apply styles to all elements
        Array.from(contentElement.children).forEach(child => {
          styleElements(child as HTMLElement);
        });
        
        messageElement.appendChild(contentElement);
        messagesContainer.appendChild(messageElement);
      });
      
      clonedChat.appendChild(messagesContainer);
      
      // Temporarily append to document (hidden) for html2canvas to work
      clonedChat.style.position = 'absolute';
      clonedChat.style.left = '-9999px';
      document.body.appendChild(clonedChat);
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Capture the cloned chat content
      const canvas = await html2canvas(clonedChat, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // Remove the cloned element from DOM
      document.body.removeChild(clonedChat);
      
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate dimensions to fit on PDF
      const imgWidth = 190; // Width of the image in the PDF (A4 width is 210mm, leaving margins)
      const pageHeight = 277; // Height of the printable area on the page (A4 height is 297mm, leaving margins)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10; // Start position with margin
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add new pages if content overflows
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(
          imgData, 
          'PNG', 
          10, // x position with margin
          position, // y position calculated to show the next part of the image
          imgWidth, 
          imgHeight
        );
        heightLeft -= pageHeight;
      }
      
      // Save the PDF
      pdf.save(filename);
    } catch (error: unknown) {
      console.error('Error generating PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to generate PDF: ${errorMessage}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="flex flex-col h-[80vh] max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex justify-between items-center p-4 border-b dark:border-gray-600">
        <h2 className="text-lg font-semibold">Chat with EduAI</h2>
        <div className="flex gap-2">
          <button
            onClick={downloadChatAsPDF}
            className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
            disabled={messages.length === 0 || isGeneratingPDF}
          >
            {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
            <ArrowDownTrayIcon className="w-4 h-4" />
          </button>
          <button
            onClick={clearChatHistory}
            className="text-sm px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            disabled={messages.length === 0}
          >
            Clear History
          </button>
        </div>
      </div>
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-4"
      >
        {!isPuterLoaded && (
          <div className="text-center p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
            Loading Puter.js... Please wait.
          </div>
        )}
        {messages.length === 0 && isPuterLoaded && (
          <div className="text-center p-4 text-gray-500 dark:text-gray-400">
            Start a conversation with EduAI. Your chat history will be saved.
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