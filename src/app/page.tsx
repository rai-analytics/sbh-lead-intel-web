'use client'; // Required for interactivity, like the model dropdown

import { useState, useRef } from 'react';

type LeadResult = {
  id: number;
  originalText: string;
  url: string;
  confidence: 'HIGH' | 'LOW' | 'PENDING';
};

// Custom icons as React components, styled to look like the references
const PlusIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z" clipRule="evenodd" />
  </svg>
);

const MicrophoneIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
    <path d="M6 10.5a.75.75 0 0 1 .75.75 5.25 5.25 0 1 0 10.5 0 .75.75 0 0 1 1.5 0 6.75 6.75 0 0 1-6.75 6.75v3a.75.75 0 0 1-1.5 0v-3A6.75 6.75 0 0 1 6 11.25a.75.75 0 0 1 .75-.75Z" />
  </svg>
);

const VizIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className={className}
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M6 10.5v3M18 10.5v3m-15-6v6m18-6v6" />
  </svg>
);

export default function SteinInterface() {
  const [model, setModel] = useState<string>('Stein 1.0');
  const [input, setInput] = useState('');
  const [results, setResults] = useState<LeadResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHowToModalOpen, setIsHowToModalOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // List of models for the dropdown
  const models = ['Stein 1.0', 'Sonnet 4.6', 'Pro 5.1'];

  const handleProcess = async () => {
    if (!input.trim() || isProcessing) return;
    
    const lines = input.split('\n').filter(line => line.trim() !== '');
    
    const initialResults: LeadResult[] = lines.map((line, idx) => ({
      id: idx,
      originalText: line,
      url: 'Scanning...',
      confidence: 'PENDING'
    }));
    
    setResults(initialResults);
    setIsProcessing(true);
    setInput('');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      try {
        const res = await fetch('/api/verify-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company: line })
        });
        
        const data = await res.json();
        
        setResults(prev => prev.map(r => 
          r.id === i ? { ...r, url: data.result || data.error || 'Error', confidence: data.confidence || 'LOW' } : r
        ));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'API Error';
        setResults(prev => prev.map(r => 
          r.id === i ? { ...r, url: message, confidence: 'LOW' } : r
        ));
      }
    }

    setIsProcessing(false);
  };

  return (
    <>
      <title>Stein 1.0 - Ready to Hunt</title>

      {/* Main viewport container (supports light and dark theme from Next.js root layout class) */}
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 text-gray-900 dark:bg-zinc-950 dark:text-gray-100 antialiased">
        
        {/* Main centered tagline area */}
        <div className="text-center mb-8 w-full max-w-4xl transition-all duration-700 ease-in-out" style={{ transform: results.length > 0 ? 'translateY(-20px)' : 'none' }}>
          <h1 className="text-4xl md:text-5xl font-extralight tracking-tight text-gray-950 dark:text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
            <span className="mr-2 text-rose-500 font-bold">*</span>
            I am ready to hunt.
          </h1>
        </div>

        {/* Integrated central input card */}
        <div className="w-full max-w-4xl p-6 bg-white border border-gray-100 rounded-3xl shadow-lg dark:bg-zinc-900 dark:border-zinc-800 dark:shadow-2xl transition-all duration-150 relative z-10">
          
          <div className="flex flex-col gap-5">
            {/* Top row: Plus button and Help link */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="flex items-center justify-center p-2 rounded-full border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
                aria-label="New target"
              >
                <PlusIcon className="w-6 h-6" />
              </button>
              
              <button
                onClick={() => setIsHowToModalOpen(true)}
                className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 focus:outline-none bg-transparent border-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 0 1-.984-1.132c1.442-1.257 3.693-1.257 5.135 0 1.382 1.202 1.382 3.396 0 4.598-.486.423-1.029.736-1.564.972-.11.048-.178.118-.178.21v.128a.75.75 0 0 1-1.5 0V12.83c0-.645.426-1.233 1.056-1.506.43-.186.823-.418 1.135-.69a1.875 1.875 0 0 0 0-3.065ZM12 17.25a1.125 1.125 0 1 1 0-2.25 1.125 1.125 0 0 1 0 2.25Z" clipRule="evenodd" />
                </svg>
                How to use {model}
              </button>
            </div>

            {/* Middle row: The primary multi-line input field */}
            <textarea
              ref={textareaRef}
              id="targetInput"
              name="targetInput"
              rows={4}
              placeholder="Paste targets here..."
              className="w-full text-base border-0 focus:ring-0 resize-none bg-transparent placeholder:text-gray-400 text-gray-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 font-mono tracking-tight outline-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleProcess();
                }
              }}
            />

            {/* Bottom row: Consolidated controls */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-zinc-800">
              
              {/* Left group: Model dropdown (very minimalist visual) */}
              <div className="flex items-center gap-2">
                  <div className="relative">
                    <select
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="appearance-none bg-zinc-100 dark:bg-zinc-800 border-0 text-sm py-1.5 px-3 pr-8 rounded-full text-gray-800 dark:text-zinc-200 focus:ring-1 focus:ring-rose-500 outline-none"
                        aria-label="Select intelligence model"
                    >
                        {models.map((m) => (
                        <option key={m} value={m}>
                            {m}
                        </option>
                        ))}
                    </select>
                    {/* Minimalist caret icon */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-zinc-400 dark:text-zinc-500">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                        </svg>
                    </div>
                  </div>
              </div>

              {/* Right group: Mic and Viz icons */}
              <div className="flex items-center gap-4 text-gray-400 dark:text-zinc-500">
                <button
                  type="button"
                  className="hover:text-rose-500 dark:hover:text-rose-400 focus:outline-none"
                  aria-label="Activate voice input"
                >
                  <MicrophoneIcon className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  className="hover:text-zinc-600 dark:hover:text-zinc-300 focus:outline-none"
                  aria-label="Visualize audio"
                >
                  <VizIcon className="w-7 h-7" />
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="w-full mt-6 flex justify-center">
            <svg className="w-6 h-6 animate-spin text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2" strokeDasharray="30" strokeLinecap="round"/></svg>
          </div>
        )}

        {/* Results List */}
        {results.length > 0 && (
          <div className="w-full max-w-4xl mt-8 flex flex-col gap-3 pb-20 relative z-0">
            {results.map((result) => (
              <div key={result.id} className="w-full text-sm sm:text-base border-b border-gray-200 dark:border-zinc-800 pb-3 flex flex-col gap-1">
                <div className="font-medium text-gray-900 dark:text-white">{result.originalText}</div>
                <div className="flex items-center gap-2">
                  {result.confidence === 'PENDING' ? (
                    <span className="text-gray-500 dark:text-zinc-400 flex items-center gap-2 text-sm">
                      <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2" strokeDasharray="30" strokeLinecap="round"/></svg>
                      Analyzing...
                    </span>
                  ) : (
                    <div className="flex items-center gap-3 w-full">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${result.confidence === 'HIGH' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                      <a href={result.url.startsWith('http') ? result.url : '#'} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline truncate">
                        {result.url}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* How To Use Modal */}
      {isHowToModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsHowToModalOpen(false)}>
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-8 rounded-3xl max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl mb-4 text-gray-900 dark:text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>Using {model}</h2>
            <div className="text-gray-600 dark:text-zinc-400 space-y-4 text-sm leading-relaxed">
              <p>
                <strong>1. Paste your leads:</strong> You can paste single leads or a massive list. 
                Format them like &quot;Company Name, Location&quot; for best results.
              </p>
              <p>
                <strong>2. Initiate Hunt:</strong> Press Enter. Stein 1.0 will instantly trigger multi-node cognitive analysis.
              </p>
              <p>
                <strong>3. Review & Export:</strong> verified LinkedIn URLs will populate below.
              </p>
            </div>
            <button 
              onClick={() => setIsHowToModalOpen(false)}
              className="mt-8 w-full bg-gray-900 text-white dark:bg-white dark:text-zinc-900 font-medium py-3 rounded-2xl hover:opacity-90 transition-opacity"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
