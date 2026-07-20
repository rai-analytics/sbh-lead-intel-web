'use client';

import { useState, useEffect, useRef } from 'react';

type LeadResult = {
  id: number;
  originalText: string;
  url: string;
  confidence: 'HIGH' | 'LOW' | 'PENDING';
};

export default function Home() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [input, setInput] = useState('');
  const [results, setResults] = useState<LeadResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [placeholder, setPlaceholder] = useState('');
  const [showHowTo, setShowHowTo] = useState(false);
  const [isHowToModalOpen, setIsHowToModalOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fullPlaceholder = "Paste a target lead here (e.g. Wallmantra, New Delhi)...";

  useEffect(() => {
    let currentText = '';
    let currentIndex = 0;
    
    const startDelay = setTimeout(() => {
      const typingInterval = setInterval(() => {
        if (currentIndex < fullPlaceholder.length) {
          currentText += fullPlaceholder[currentIndex];
          setPlaceholder(currentText);
          currentIndex++;
        } else {
          clearInterval(typingInterval);
          // After it finishes typing, wait 2 seconds, then transition to button
          setTimeout(() => {
            setPlaceholder("Paste targets here...");
            setShowHowTo(true);
          }, 2000);
        }
      }, 40);
      
      return () => clearInterval(typingInterval);
    }, 500);
    
    return () => clearTimeout(startDelay);
  }, []);

  useEffect(() => {
    // Check system preference or default to dark
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (!isDark) {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

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
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

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
      } catch (err: any) {
        setResults(prev => prev.map(r => 
          r.id === i ? { ...r, url: err.message || 'API Error', confidence: 'LOW' } : r
        ));
      }
    }

    setIsProcessing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleProcess();
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center pt-32 px-4 relative">
      
      {/* Subtle theme toggle top right */}
      <button 
        onClick={toggleTheme}
        className="absolute top-6 right-6 text-[var(--placeholder-color)] hover:text-[var(--text-color)] transition-colors p-2"
        title="Toggle Theme"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {theme === 'dark' ? (
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          ) : (
            <circle cx="12" cy="12" r="5" />
          )}
        </svg>
      </button>

      <div className={`w-full max-w-[760px] flex flex-col items-center transition-all duration-700 ease-in-out ${results.length > 0 ? '-translate-y-20' : ''}`}>
        
        {/* Exact Claude Heading */}
        <h1 className="serif-heading text-[32px] sm:text-[40px] text-center mb-10 flex items-center justify-center gap-3 w-full">
          {/* Authentic Claude Asterisk (Filled, properly scaled) */}
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#d97757] flex-shrink-0">
            <path d="M17 0C17.5523 0 18 0.447715 18 1V16H33C33.5523 16 34 16.4477 34 17C34 17.5523 33.5523 18 33 18H18V33C18 33.5523 17.5523 34 17 34C16.4477 34 16 33.5523 16 33V18H1C0.447715 18 0 17.5523 0 17C0 16.4477 0.447715 16 1 16H16V1C16 0.447715 16.4477 0 17 0Z" fill="currentColor"/>
            <path d="M24.8995 9.10051C25.29 8.70998 25.9234 8.70998 26.3139 9.10051L26.6675 9.45406C27.058 9.84458 27.058 10.478 26.6675 10.8685L18.4142 19.1218L9.10051 28.4355C8.70998 28.8261 8.07656 28.8261 7.68604 28.4355L7.33249 28.082C6.94196 27.6915 6.94196 27.058 7.33249 26.6675L16.6462 17.3538L24.8995 9.10051Z" fill="currentColor"/>
            <path d="M24.8995 24.8995C25.29 25.29 25.29 25.9234 24.8995 26.3139L24.5459 26.6675C24.1554 27.058 23.522 27.058 23.1315 26.6675L14.8782 18.4142L5.56447 9.10051C5.17394 8.70998 5.17394 8.07656 5.56447 7.68604L5.91802 7.33249C6.30854 6.94196 6.94196 6.94196 7.33249 7.33249L16.6462 16.6462L24.8995 24.8995Z" fill="currentColor"/>
          </svg>
          <span className="text-[var(--text-color)] font-medium tracking-tight">I am ready to hunt.</span>
        </h1>

        {/* Exact Claude Input Box */}
        <div className="w-full claude-input-container">
          <textarea
            ref={textareaRef}
            className="claude-textarea"
            placeholder={placeholder}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
          />
          
          <div className="flex items-center justify-between mt-8 text-[var(--placeholder-color)]">
            <div className="flex items-center gap-2">
              {/* Plus Icon */}
              <button className="p-1.5 hover:bg-[var(--border-color)] rounded-md transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
              
              {/* How To Use Button moved into controls for cleanliness */}
              {showHowTo && (
                <button 
                  onClick={() => setIsHowToModalOpen(true)}
                  className="animate-fade-in flex items-center gap-1.5 text-xs sm:text-sm font-medium hover:text-[var(--text-color)] transition-colors px-2 py-1 rounded-md"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  How to use
                </button>
              )}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3 sm:gap-4 text-sm">
              <button className="flex items-center gap-1 hover:text-[var(--text-color)] transition-colors font-medium">
                Stein 1.0
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              
              <button className="p-1 hover:text-[var(--text-color)] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
                </svg>
              </button>

              <button className="p-1 hover:text-[var(--text-color)] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 22V2m4 20V10m4 12V6m4 16v-8m4 8V14" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="w-full mt-6 flex justify-center">
            <svg className="w-6 h-6 animate-spin text-[#d97757]" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2" strokeDasharray="30" strokeLinecap="round"/></svg>
          </div>
        )}

      </div>

      {/* Results List */}
      {results.length > 0 && (
        <div className="w-full max-w-[760px] mt-8 flex flex-col gap-3 pb-20">
          {results.map((result) => (
            <div key={result.id} className="w-full text-sm sm:text-base border-b border-[var(--border-color)] pb-3 flex flex-col gap-1">
              <div className="font-medium text-[var(--text-color)]">{result.originalText}</div>
              <div className="flex items-center gap-2">
                {result.confidence === 'PENDING' ? (
                  <span className="text-[var(--placeholder-color)] flex items-center gap-2 text-sm">
                    <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2" strokeDasharray="30" strokeLinecap="round"/></svg>
                    Analyzing...
                  </span>
                ) : (
                  <div className="flex items-center gap-3 w-full">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${result.confidence === 'HIGH' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <a href={result.url.startsWith('http') ? result.url : '#'} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline truncate">
                      {result.url}
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* How To Use Modal */}
      {isHowToModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIsHowToModalOpen(false)}>
          <div className="bg-[var(--bg-color)] border border-[var(--border-color)] p-8 rounded-2xl max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="serif-heading text-2xl mb-4 text-[var(--text-color)]">Using Stein 1.0</h2>
            <div className="text-[var(--placeholder-color)] space-y-4 text-sm leading-relaxed">
              <p>
                <strong>1. Paste your leads:</strong> You can paste single leads or a massive list. 
                Format them like "Company Name, Location" for best results.
              </p>
              <p>
                <strong>2. Initiate Hunt:</strong> Press Enter. Stein 1.0 will instantly trigger multi-node cognitive analysis.
              </p>
              <p>
                <strong>3. Review & Export:</strong> verified LinkedIn URLs will populate below. Click Export CSV when you're done.
              </p>
            </div>
            <button 
              onClick={() => setIsHowToModalOpen(false)}
              className="mt-8 w-full bg-[var(--text-color)] text-[var(--bg-color)] font-medium py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              Got it
            </button>
          </div>
        </div>
      )}

    </main>
  );
}
