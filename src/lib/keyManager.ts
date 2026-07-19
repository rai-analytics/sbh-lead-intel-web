export class KeyManager {
  private keys: string[] = [];
  private currentIndex: number = 0;

  constructor() {
    this.loadKeys();
  }

  private loadKeys() {
    // Collect any environment variables starting with OPENROUTER_KEY_
    this.keys = Object.keys(process.env)
      .filter((key) => key.startsWith("OPENROUTER_KEY_"))
      .map((key) => process.env[key] as string)
      .filter((val) => val && val.trim().length > 0);
      
    // Fallback to OPENROUTER_API_KEY if no specific numbered keys exist
    if (this.keys.length === 0 && process.env.OPENROUTER_API_KEY) {
      this.keys.push(process.env.OPENROUTER_API_KEY);
    }
  }

  public getNextKey(): string {
    if (this.keys.length === 0) {
      throw new Error("No OpenRouter API keys configured. Please add OPENROUTER_KEY_1 to your environment.");
    }
    const key = this.keys[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    return key;
  }
}

export const openRouterKeyManager = new KeyManager();
