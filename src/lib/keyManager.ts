export type ApiProvider = 'openrouter' | 'gemini';

export interface ApiKey {
  provider: ApiProvider;
  key: string;
}

export class UniversalKeyManager {
  private keys: ApiKey[] = [];
  private currentIndex: number = 0;

  constructor() {
    this.loadKeys();
  }

  private loadKeys() {
    const openRouterKeys: ApiKey[] = [];
    const geminiKeys: ApiKey[] = [];

    // Parse all environment variables
    for (const [envKey, envValue] of Object.entries(process.env)) {
      if (!envValue || envValue.trim() === '') continue;

      if (envKey.startsWith('OPENROUTER_')) {
        openRouterKeys.push({ provider: 'openrouter', key: envValue });
      } else if (envKey.startsWith('GEMINI_API_KEY')) {
        geminiKeys.push({ provider: 'gemini', key: envValue });
      }
    }

    // Combine them, prioritizing OpenRouter first
    this.keys = [...openRouterKeys, ...geminiKeys];
  }

  public getNextKey(): ApiKey {
    if (this.keys.length === 0) {
      throw new Error("No API keys configured. Please add OPENROUTER_API_KEY or GEMINI_API_KEY to your environment.");
    }
    
    const current = this.keys[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    return current;
  }

  // Allow the route to know how many keys we have for the retry loop
  public getTotalKeys(): number {
    return this.keys.length;
  }
}

export const keyManager = new UniversalKeyManager();
