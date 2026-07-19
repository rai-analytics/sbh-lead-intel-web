import { NextResponse } from 'next/server';
import { openRouterKeyManager } from '@/lib/keyManager';

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

    // Step 2: OpenRouter Verification
    const snippets = results.map((r: any, idx: number) => `Result ${idx + 1}:\nURL: ${r.url}\nTitle: ${r.title}\nDescription: ${r.description}`).join('\n\n');
    
    const prompt = `You are a strict data verification AI.
Your goal is to find the exact LinkedIn Profile URL for the Founder/Owner/CEO or a specific person.

Target Lead: ${leadName || '(Unknown)'}
Target Company: ${company || '(Unknown)'}
Target Location: ${location || '(Unknown)'}

Here are the top 5 search results from Brave Search:
${snippets}

Analyze the search results. If one of them confidently matches the Target Lead OR is the founder/owner of the Target Company, return exactly that URL. 
If the results are generic employees, unrelated people, or directory sites, return "NOT FOUND".
Do not hallucinate. Do not return anything other than the exact URL or "NOT FOUND".`;

    const openRouterKey = openRouterKeyManager.getNextKey();
    
    const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-free', // We can adjust the exact free model
        messages: [{ role: 'user', content: prompt }],
      })
    });

    if (!orRes.ok) {
      console.error('OpenRouter API Error:', await orRes.text());
      return NextResponse.json({ error: 'OpenRouter API failed' }, { status: 500 });
    }

    const orData = await orRes.json();
    const verifiedUrl = orData.choices[0]?.message?.content?.trim() || 'NOT FOUND';

    const finalResult = verifiedUrl.includes('NOT FOUND') ? 'NOT FOUND' : verifiedUrl;
    const confidence = finalResult === 'NOT FOUND' ? 'LOW' : 'HIGH';

    return NextResponse.json({ result: finalResult, confidence });
  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
