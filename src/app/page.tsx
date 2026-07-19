'use client';

import { useState, useEffect } from 'react';

type LeadResult = {
  id: number;
  originalText: string;
  url: string;
  confidence: 'HIGH' | 'LOW' | 'PENDING';
};

export default function Home() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState<LeadResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleProcess = async () => {
    if (!inputText.trim()) return;

    const lines = inputText.split('\n').filter(l => l.trim().length > 0);
    const initialResults: LeadResult[] = lines.map((line, idx) => ({
      id: idx,
      originalText: line,
      url: 'Analyzing footprints...',
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
          r.id === i ? { ...r, url: data.result || 'Error', confidence: data.confidence || 'LOW' } : r
        ));
      } catch (err) {
        setResults(prev => prev.map(r => 
          r.id === i ? { ...r, url: 'API Error', confidence: 'LOW' } : r
        ));
      }
    }

    setIsProcessing(false);
  };

  const exportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Original Input,Verified URL,Confidence\n"
      + results.map(e => `"${e.originalText}","${e.url}","${e.confidence}"`).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "verified_leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container">
      <header className="header">
        <h1 className="logo">SBH Lead Intel</h1>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </button>
      </header>

      <main>
        {/* Command Box */}
        <section className={`command-box ${isProcessing ? 'processing' : ''}`}>
          <div className="scanner"></div>
          <textarea 
            className="command-input" 
            placeholder="Initialize Web Crawler...&#10;Paste target leads here (e.g. Wallmantra, New Delhi)"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isProcessing}
          />
          
          <div className="command-actions">
            <span className="action-hint">Press verify to initiate multi-node cognitive analysis.</span>
            <button className="btn-primary" onClick={handleProcess} disabled={isProcessing || !inputText.trim()}>
              {isProcessing ? 'Scanning Grid...' : 'Verify Targets'}
            </button>
          </div>
        </section>

        {/* Results Grid */}
        {results.length > 0 && (
          <div style={{ marginTop: '3rem' }}>
            {!isProcessing && (
              <div className="export-bar">
                <button className="btn-secondary" onClick={exportCSV}>
                  📥 Export CSV Data
                </button>
              </div>
            )}
            
            <div className="results-grid">
              {results.map((r, index) => (
                <div 
                  key={r.id} 
                  className="result-card" 
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="result-info">
                    <h3>{r.originalText}</h3>
                    {r.url.startsWith('http') ? (
                      <a href={r.url} target="_blank" rel="noreferrer" className="result-link">
                        🔗 {r.url.split('linkedin.com/in/')[1] || r.url}
                      </a>
                    ) : (
                      <span className="result-link" style={{ color: 'var(--text-muted)' }}>{r.url}</span>
                    )}
                  </div>
                  
                  <div className="badge">
                    <div className={`dot dot-${r.confidence.toLowerCase()}`}></div>
                    {r.confidence}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
