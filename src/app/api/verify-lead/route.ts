import { NextResponse } from 'next/server';
import { keyManager, ApiKey } from '@/lib/keyManager';

export async function POST(req: Request) {
  try {
    const { leadName, location, company } = await req.json();

    if (!leadName && !company) {
      return NextResponse.json({ error: 'Missing leadName or company' }, { status: 400 });
    }

    const searchQuery = `${leadName || ''} ${company || ''} ${location || ''} site:linkedin.com/in`.trim();
    
    // Step 1: Brave Search API
    const braveApiKey = process.env.BRAVE_API_KEY;
    if (!braveApiKey) {
      return NextResponse.json({ error: 'Missing BRAVE_API_KEY' }, { status: 500 });
    }

    const braveRes = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(searchQuery)}&count=5`, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': braveApiKey
      }
    });

    if (!braveRes.ok) {
      console.error('Brave API Error:', await braveRes.text());
      return NextResponse.json({ error: 'Brave API failed' }, { status: 500 });
    }

    const braveData = await braveRes.json();
    const results = braveData.web?.results || [];

    if (results.length === 0) {
      return NextResponse.json({ result: 'NOT FOUND (No search results)', confidence: 'LOW' });
    }

    const snippets = results.map((r: {url: string; title: string; description: string}, idx: number) => `Result ${idx + 1}:\nURL: ${r.url}\nTitle: ${r.title}\nDescription: ${r.description}`).join('\n\n');
    
const prompt = `You are a data verification AI.
Your goal is to find the exact LinkedIn Profile URL for the target lead, or a senior leader (Founder/Owner/CEO/Director) if the specific lead is unknown.

Target Lead: ${leadName || '(Unknown)'}
Target Company: ${company || '(Unknown)'}
Target Location: ${location || '(Unknown)'}

Here are the top 5 search results from Brave Search:
${snippets}

Analyze the search results. 
1. If the Target Lead is provided, find the profile that matches their name and company.
2. If the Target Lead is (Unknown), find the profile of the Founder, Owner, CEO, Director, or Co-Founder of the Target Company.

If you confidently find a match based on the rules above, return exactly that LinkedIn URL.
If the results are generic employees, unrelated people, or directory sites, return "NOT FOUND".
Do not hallucinate. Do not return anything other than the exact URL or "NOT FOUND".`;

    // Step 3: Greedy Retry Loop
    const totalKeys = keyManager.getTotalKeys();
    let finalResult = null;
    let lastError = null;

    // We will attempt up to the total number of keys we have.
    for (let i = 0; i < totalKeys; i++) {
      const currentKey = keyManager.getNextKey();
      
      try {
        if (currentKey.provider === 'gemini') {
          finalResult = await callGemini(prompt, currentKey.key);
        }

        // If we get here, the call succeeded! Break out of the retry loop.
        if (finalResult) break;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.warn(`[Key Failed] Provider: ${currentKey.provider} | Reason: ${errorMessage}. Retrying...`);
        lastError = errorMessage;
        // Continue to the next iteration to try the next key
      }
    }

    if (!finalResult) {
      console.error('All keys in the pool failed. Last Error:', lastError);
      return NextResponse.json({ error: `All AI APIs failed. Last error: ${lastError}` }, { status: 500 });
    }

    const resultText = finalResult.trim();
    const isNotFound = resultText.includes('NOT FOUND');
    const confidence = isNotFound ? 'LOW' : 'HIGH';

    return NextResponse.json({ result: isNotFound ? 'NOT FOUND' : resultText, confidence });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('API Route Error:', message);
    return NextResponse.json({ error: 'Failed to verify lead: ' + message }, { status: 500 });
  }
}

// --- Helper Functions for API Providers ---

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
      }
    })
  });

  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.candidates[0]?.content?.parts[0]?.text || 'NOT FOUND';
}
