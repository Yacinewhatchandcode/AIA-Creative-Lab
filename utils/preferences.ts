// User preferences management with localStorage

interface UserPreferences {
  apiKey?: string;
  preferredModel?: 'gpt4o' | 'seedream';
  defaultAspectRatio?: string;
  defaultSceneCount?: number;
  autoMode?: boolean;
  theme?: 'dark' | 'light';
  notifications?: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  preferredModel: 'gpt4o',
  defaultAspectRatio: '1:1',
  defaultSceneCount: 3,
  autoMode: true,
  theme: 'dark',
  notifications: true,
};

class PreferencesManager {
  private storageKey = 'ai-creative-suite-preferences';

  getPreferences(): UserPreferences {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return DEFAULT_PREFERENCES;
      
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_PREFERENCES, ...parsed };
    } catch (error) {
      console.error('Failed to load preferences:', error);
      return DEFAULT_PREFERENCES;
    }
  }

  savePreferences(pref: Partial<UserPreferences>): void {
    try {
      const current = this.getPreferences();
      const updated = { ...current, ...pref };
      localStorage.setItem(this.storageKey, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }

  resetPreferences(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to reset preferences:', error);
    }
  }

  // Individual preference getters and setters for convenience
  getApiKey(): string | undefined {
    return this.getPreferences().apiKey;
  }

  setApiKey(key: string): void {
    this.savePreferences({ apiKey: key });
  }

  getPreferredModel(): 'gpt4o' | 'seedream' {
    return this.getPreferences().preferredModel || 'gpt4o';
  }

  setPreferredModel(model: 'gpt4o' | 'seedream'): void {
    this.savePreferences({ preferredModel: model });
  }

  getDefaultAspectRatio(): string {
    return this.getPreferences().defaultAspectRatio || '1:1';
  }

  setDefaultAspectRatio(ratio: string): void {
    this.savePreferences({ defaultAspectRatio: ratio });
  }

  getDefaultSceneCount(): number {
    return this.getPreferences().defaultSceneCount || 3;
  }

  setDefaultSceneCount(count: number): void {
    this.savePreferences({ defaultSceneCount: count });
  }

  isAutoMode(): boolean {
    return this.getPreferences().autoMode ?? true;
  }

  setAutoMode(auto: boolean): void {
    this.savePreferences({ autoMode: auto });
  }
}

export const preferences = new PreferencesManager();
