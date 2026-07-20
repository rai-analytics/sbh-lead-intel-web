export type ApiProvider = 'openrouter';

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

    // Parse all environment variables for OpenRouter keys
    for (const [envKey, envValue] of Object.entries(process.env)) {
      if (!envValue || envValue.trim() === '') continue;

      if (envKey.startsWith('OPENROUTER_')) {
        openRouterKeys.push({ provider: 'openrouter', key: envValue });
      }
    }

    this.keys = openRouterKeys;
  }

  public getNextKey(): ApiKey {
    if (this.keys.length === 0) {
      throw new Error("No API keys configured. Please add OPENROUTER_API_KEY to your environment.");
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
