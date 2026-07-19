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
    // Set initial theme
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
      url: '...',
      confidence: 'PENDING'
    }));
    
    setResults(initialResults);
    setIsProcessing(true);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Basic parsing: Assume comma separated like "Company, Location, Name" or just string
      // For SBH pipeline we just pass the whole string to Brave search usually, 
      // but let's pass it as company for the API route.
      
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
        <h1>SBH Lead Intelligence</h1>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </button>
      </header>

      <main>
        <section className="card">
          <p className="help-text">
            Paste your leads below (one per line). The AI will search the web and cognitively verify the exact LinkedIn profile of the founder or target person.
          </p>
          <textarea 
            className="textarea" 
            placeholder="e.g. Wallmantra, New Delhi&#10;Frog Hollow Studio, United States"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isProcessing}
          />
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn" onClick={handleProcess} disabled={isProcessing || !inputText.trim()}>
              {isProcessing && <span className="loader"></span>}
              {isProcessing ? 'Verifying Leads...' : 'Start Verification'}
            </button>
            
            {results.length > 0 && !isProcessing && (
              <button className="btn" onClick={exportCSV} style={{ background: 'var(--success)' }}>
                📥 Export CSV
              </button>
            )}
          </div>
        </section>

        {results.length > 0 && (
          <section className="card">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Target Lead</th>
                  <th>Verified LinkedIn URL</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => (
                  <tr key={r.id}>
                    <td>{r.originalText}</td>
                    <td>
                      {r.url.startsWith('http') ? (
                        <a href={r.url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>
                          {r.url}
                        </a>
                      ) : r.url}
                    </td>
                    <td>
                      <span className={`status-badge status-${r.confidence.toLowerCase()}`}>
                        {r.confidence}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </div>
  );
}
