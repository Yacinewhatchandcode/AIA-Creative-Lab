interface HistoryItem {
  id: string;
  type: 'movie' | 'image' | 'chat';
  title: string;
  prompt: string;
  createdAt: Date;
  url?: string; // For movies and images
  settings?: {
    model: string;
    aspectRatio?: string;
    scenes?: number;
  };
  metadata?: {
    duration?: number; // For movies
    size?: string; // For images
    messageCount?: number; // For chats
  };
}

class HistoryService {
  private storageKey = 'ai-creative-suite-history';
  private maxHistoryItems = 50;

  getHistory(): HistoryItem[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];
      
      const history = JSON.parse(stored);
      return history.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt)
      }));
    } catch (error) {
      console.error('Failed to load history:', error);
      return [];
    }
  }

  addToHistory(item: Omit<HistoryItem, 'id' | 'createdAt'>): void {
    const history = this.getHistory();
    
    const newItem: HistoryItem = {
      ...item,
      id: this.generateId(),
      createdAt: new Date(),
    };
    
    // Add to beginning and limit size
    history.unshift(newItem);
    const limitedHistory = history.slice(0, this.maxHistoryItems);
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('Failed to save history:', error);
      // If quota exceeded, remove oldest items
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        const trimmedHistory = limitedHistory.slice(0, this.maxHistoryItems / 2);
        localStorage.setItem(this.storageKey, JSON.stringify(trimmedHistory));
      }
    }
  }

  removeFromHistory(id: string): void {
    const history = this.getHistory();
    const filteredHistory = history.filter(item => item.id !== id);
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(filteredHistory));
    } catch (error) {
      console.error('Failed to remove from history:', error);
    }
  }

  clearHistory(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  }

  getHistoryByType(type: HistoryItem['type']): HistoryItem[] {
    return this.getHistory().filter(item => item.type === type);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Convenience methods for specific types
  addMovie(prompt: string, url: string, settings: any, metadata: any): void {
    this.addToHistory({
      type: 'movie',
      title: this.generateTitle(prompt),
      prompt,
      url,
      settings,
      metadata,
    });
  }

  addImage(prompt: string, url: string, model: string, aspectRatio?: string): void {
    this.addToHistory({
      type: 'image',
      title: this.generateTitle(prompt),
      prompt,
      url,
      settings: { model, aspectRatio },
    });
  }

  addChat(prompt: string, messageCount: number): void {
    this.addToHistory({
      type: 'chat',
      title: this.generateTitle(prompt),
      prompt,
      metadata: { messageCount },
    });
  }

  private generateTitle(prompt: string): string {
    // Create a title from the first 50 characters of the prompt
    const title = prompt.length > 50 ? `${prompt.substring(0, 47)}...` : prompt;
    return title.replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'Untitled';
  }
}

export const historyService = new HistoryService();
