'use client';

import { useState, useEffect } from 'react';

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

  useEffect(() => {
    document.documentElement.classList.add('dark'); // Force dark by default for the minimalist look
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };

  const handleProcess = async () => {
    if (!input.trim()) return;
    
    const lines = input.split('\n').filter(line => line.trim() !== '');
    
    const initialResults: LeadResult[] = lines.map((line, idx) => ({
      id: idx,
      originalText: line,
      url: 'Scanning...',
      confidence: 'PENDING'
    }));
    
    setResults(initialResults);
    setIsProcessing(true);

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

  const exportCSV = () => {
    const headers = "Original Lead,Verified URL,Confidence\n";
    const rows = results.map(r => `"${r.originalText}","${r.url}","${r.confidence}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'verified_leads.csv';
    a.click();
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-12 transition-colors duration-300">
      
      {/* Top Navigation */}
      <div className="fixed top-0 left-0 w-full flex justify-end p-6 z-10">
        <button 
          onClick={toggleTheme}
          className="text-sm font-medium px-4 py-2 rounded-full bg-[var(--panel-bg)] border border-[var(--border)] text-[var(--foreground)] hover:opacity-80 transition-opacity"
        >
          {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>

      <div className={`w-full max-w-2xl flex flex-col items-center transition-all duration-700 ease-in-out ${results.length > 0 ? '-translate-y-24' : ''}`}>
        
        {/* Clever Greeting */}
        <h1 className="clever-greeting text-3xl sm:text-4xl md:text-5xl text-center mb-8 sm:mb-12 font-medium text-[var(--foreground)] tracking-tight">
          <span className="text-orange-400 mr-3">✻</span>
          Who are we hunting today?
        </h1>

        {/* Minimalist Input Area */}
        <div className="w-full relative minimal-input p-1">
          <textarea
            className="w-full bg-transparent text-[var(--foreground)] p-4 sm:p-5 pr-12 rounded-[20px] outline-none resize-none placeholder:text-[var(--muted)] text-base sm:text-lg min-h-[60px]"
            rows={Math.min(5, Math.max(1, input.split('\n').length))}
            placeholder="Paste your target leads here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <button
              onClick={handleProcess}
              disabled={isProcessing || !input.trim()}
              className="p-2 rounded-full hover:bg-[var(--border)] transition-colors disabled:opacity-50 text-[var(--foreground)]"
            >
              {isProcessing ? (
                <svg className="w-5 h-5 subtle-spinner" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2V6M12 18V22M6 12H2M22 12H18M19.07 4.93L16.24 7.76M7.76 16.24L4.93 19.07M19.07 19.07L16.24 16.24M7.76 7.76L4.93 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Results Area */}
      {results.length > 0 && (
        <div className="w-full max-w-3xl mt-8 animate-fade-in flex flex-col gap-4">
          <div className="flex justify-end mb-2">
            <button
              onClick={exportCSV}
              className="text-sm font-medium px-4 py-2 rounded-full bg-[var(--panel-bg)] border border-[var(--border)] text-[var(--foreground)] hover:opacity-80 transition-opacity flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export CSV
            </button>
          </div>

          {results.map((result) => (
            <div key={result.id} className="minimal-input p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--foreground)] truncate mb-1">{result.originalText}</p>
                <div className="flex items-center gap-2 text-sm">
                  {result.confidence === 'PENDING' ? (
                    <span className="text-[var(--muted)] flex items-center gap-2">
                      <svg className="w-3 h-3 subtle-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2" strokeDasharray="30" strokeLinecap="round"/></svg>
                      Scanning...
                    </span>
                  ) : (
                    <a href={result.url.startsWith('http') ? result.url : '#'} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 truncate transition-colors">
                      {result.url}
                    </a>
                  )}
                </div>
              </div>
              
              {result.confidence !== 'PENDING' && (
                <div className="flex-shrink-0">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                    result.confidence === 'HIGH' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${result.confidence === 'HIGH' ? 'bg-green-400' : 'bg-red-400'}`}></span>
                    {result.confidence}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </main>
  );
}
