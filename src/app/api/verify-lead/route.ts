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

    const prompt = `
You are an expert lead researcher. We are trying to find the exact LinkedIn profile for a specific business leader.

TARGET PERSON:
First Name: ${leadName || "Unknown"}
Company/Brand: ${company || "Unknown"}
Location: ${location || "Unknown"}

SEARCH RESULTS:
${snippets}

TASK:
Read the search results carefully. Which of these LinkedIn profiles belongs to the Founder, CEO, or actual target person for this specific company?
Beware of results for unrelated companies that just happen to share a keyword.

You must return a raw JSON object with two fields:
- "url": the exact LinkedIn URL you picked (or an empty string "" if none of them match the target company).
- "confidence": "HIGH" (if you are certain it's the right person at the right company), or "LOW" (if it's a guess or no brand was provided).

Output ONLY raw JSON. No markdown formatting, no backticks.`;

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

    const resultText = finalResult.trim().replace(/```json/g, '').replace(/```/g, '').trim();
    let isNotFound = true;
    let extractedUrl = 'NOT FOUND';
    let confidence = 'LOW';
    
    try {
      const parsed = JSON.parse(resultText);
      if (parsed.url && parsed.url !== "") {
        extractedUrl = parsed.url;
        isNotFound = false;
      }
      if (parsed.confidence) {
        confidence = parsed.confidence;
      }
    } catch (e) {
      console.error('Failed to parse Gemini JSON:', resultText);
      // Fallback if parsing fails but a URL was returned
      if (resultText.includes('linkedin.com/in/')) {
        const urlMatch = resultText.match(/https:\/\/[\w]+\.linkedin\.com\/in\/[^\s"']+/);
        if (urlMatch) {
          extractedUrl = urlMatch[0];
          isNotFound = false;
        }
      }
    }

    return NextResponse.json({ result: isNotFound ? 'NOT FOUND' : extractedUrl, confidence });

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
        responseMimeType: 'application/json',
        temperature: 0.1,
      }
    })
  });

  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.candidates[0]?.content?.parts[0]?.text || '{"url": "", "confidence": "LOW"}';
}
