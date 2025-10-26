const KIE_MAIN_API = 'https://api.kie.ai/api/v1';

const getKieApiKey = (): string => {
  if (!process.env.KIE_API_KEY) {
    throw new Error("KIE_API_KEY environment variable not set.");
  }
  return process.env.KIE_API_KEY;
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export class RealChatService {
  private conversations: Map<string, ChatMessage[]> = new Map();
  
  /**
   * Start or resume a chat session
   */
  startChat(conversationId: string = 'default'): ChatSession {
    if (!this.conversations.has(conversationId)) {
      this.conversations.set(conversationId, [
        {
          role: 'assistant',
          content: 'Hello! I\'m your AI assistant. How can I help you create amazing content today?',
          timestamp: Date.now()
        }
      ]);
    }
    
    return new ChatSession(conversationId, this);
  }
  
  /**
   * Get conversation history
   */
  getHistory(conversationId: string): ChatMessage[] {
    return this.conversations.get(conversationId) || [];
  }
  
  /**
   * Clear conversation
   */
  clearConversation(conversationId: string): void {
    this.conversations.set(conversationId, [
      {
        role: 'assistant',
        content: 'Conversation cleared. How can I help you?',
        timestamp: Date.now()
      }
    ]);
  }
}

export class ChatSession {
  private conversationId: string;
  private service: RealChatService;
  
  constructor(conversationId: string, service: RealChatService) {
    this.conversationId = conversationId;
    this.service = service;
  }
  
  /**
   * Send a message and get AI response
   */
  async sendMessage(message: string): Promise<string> {
    const history = this.service.getHistory(this.conversationId);
    
    // Add user message to history
    history.push({
      role: 'user',
      content: message,
      timestamp: Date.now()
    });
    
    try {
      // Use KIE's text generation API
      const response = await fetch(`${KIE_MAIN_API}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getKieApiKey()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Use available text model
          messages: history.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          temperature: 0.7,
          max_tokens: 500,
          stream: false
        })
      });
      
      if (!response.ok) {
        throw new Error(`Chat request failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      const aiContent = result.choices?.[0]?.message?.content || 'I apologize, but I couldn\'t generate a response.';
      
      // Add AI response to history
      this.service.getHistory(this.conversationId).push({
        role: 'assistant',
        content: aiContent,
        timestamp: Date.now()
      });
      
      return aiContent;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const fallbackResponse = `I apologize, but I encountered an error: ${errorMessage}. Please try again later.`;
      
      // Add error message to history
      this.service.getHistory(this.conversationId).push({
        role: 'assistant',
        content: fallbackResponse,
        timestamp: Date.now()
      });
      
      return fallbackResponse;
    }
  }
  
  /**
   * Get complete conversation history
   */
  getHistory(): ChatMessage[] {
    return this.service.getHistory(this.conversationId);
  }
  
  /**
   * Stream message response
   */
  async sendMessageStream(message: string, onChunk: (chunk: string) => void): Promise<void> {
    const history = this.service.getHistory(this.conversationId);
    
    // Add user message to history
    history.push({
      role: 'user',
      content: message,
      timestamp: Date.now()
    });
    
    try {
      const response = await fetch(`${KIE_MAIN_API}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getKieApiKey()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: history.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          temperature: 0.7,
          max_tokens: 500,
          stream: true
        })
      });
      
      if (!response.ok) {
        throw new Error(`Chat stream request failed: ${response.statusText}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Stream reader not available');
      
      let aiContent = '';
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                aiContent += content;
                onChunk(content);
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }
      
      // Add complete AI response to history
      if (aiContent) {
        this.service.getHistory(this.conversationId).push({
          role: 'assistant',
          content: aiContent,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const fallbackResponse = `I apologize, but I encountered an error: ${errorMessage}. Please try again later.`;
      
      onChunk(fallbackResponse);
      
      this.service.getHistory(this.conversationId).push({
        role: 'assistant',
        content: fallbackResponse,
        timestamp: Date.now()
      });
    }
  }
}

export const realChatService = new RealChatService();
