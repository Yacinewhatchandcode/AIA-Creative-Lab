// CRITICAL SECURITY FIX: Server-side API Proxy
// Never expose API keys to client-side code
// All external API calls must route through this secure proxy

import fetch from 'node-fetch';

// Security: Environment variables only accessible server-side
const KIE_API_KEY = process.env.KIE_API_KEY;
const KIE_MAIN_API = 'https://api.kie.ai/api/v1';
const KIE_FILE_API = 'https://kieai.redpandaai.co';

interface ProxyRequest {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

class SecurityProxy {
  // Security: Input validation helper
  private validateInput(input: any): void {
    if (typeof input === 'string') {
      // Prevent injection attacks
      const dangerousPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /vbscript:/gi,
        /onload=/gi,
        /onerror=/gi,
        /onclick=/gi,
        /--/g,
        /\/\*/g,
        /\*\//g,
        /;/g,
        /xp_/gi,
        /union/gi,
        /select/gi,
        /insert/gi,
        /update/gi,
        /delete/gi,
        /drop/gi,
        /exec/gi,
        /system/gi
      ];
      
      for (const pattern of dangerousPatterns) {
        if (pattern.test(input)) {
          throw new Error('Invalid input: potentially malicious content detected');
        }
      }
      
      // Length limits
      if (input.length > 10000) {
        throw new Error('Input too long');
      }
    }
  }

  // Security: Sanitize API request payload
  private sanitizePayload(payload: any): any {
    if (!payload) return payload;
    
    if (typeof payload === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(payload)) {
        this.validateInput(key);
        if (typeof value === 'string') {
          this.validateInput(value);
        }
        sanitized[key] = value;
      }
      return sanitized;
    }
    
    this.validateInput(payload);
    return payload;
  }

  // Security: Make secure API request to KIE services
  async makeSecureRequest(request: ProxyRequest): Promise<any> {
    try {
      // Validate all inputs
      if (request.endpoint) this.validateInput(request.endpoint);
      if (request.body) request.body = this.sanitizePayload(request.body);
      
      // Security: Rate limiting per IP address
      // In production, implement actual rate limiting with Redis or similar
      
      // Construct secure request
      const url = this.buildSecureUrl(request.endpoint);
      
      const headers = {
        'Authorization': `Bearer ${KIE_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'AI-Creative-Suite/1.0 (Secure Proxy)',
        'X-Forwarded-For': request.headers?.['x-forwarded-for'] || 'unknown',
        'X-Security-Proxy': 'true',
        ...request.headers
      };

      let response;
      
      switch (request.method) {
        case 'POST':
          response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(request.body),
            timeout: 30000
          });
          break;
          
        case 'GET':
          response = await fetch(url, {
            method: 'GET',
            headers,
            timeout: 10000
          });
          break;
          
        default:
          throw new Error(`Unsupported method: ${request.method}`);
      }

      // Security: Validate response
      if (!response.ok) {
        const errorText = await response.text();
        // Don't expose sensitive error details to client
        throw new Error(`API request failed: ${response.status}`);
      }

      // Security: Sanitize response data
      let responseData;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const rawResponse = await response.json();
        responseData = this.sanitizeResponse(rawResponse);
      } else {
        responseData = await response.text();
      }

      return responseData;
      
    } catch (error) {
      console.error('Proxy request failed:', error);
      // Security: Don't expose internal error details
      throw new Error('Request failed. Please try again later.');
    }
  }

  // Security: Build secure API URL
  private buildSecureUrl(endpoint: string): string {
    // Prevent URL injection and ensure only allowed endpoints
    const allowedEndpoints = [
      '/veo/generate',
      '/veo/task/',
      '/4o-image/generate',
      '/4o-image/edit',
      '/4o-image/task/',
      '/api/file-base64-upload',
      '/suno/generate',
      '/suno/task/',
      '/tts/generate',
      '/audio/mix',
      '/chat/completions'
    ];

    const isValidEndpoint = allowedEndpoints.some(allowed => endpoint.startsWith(allowed));
    if (!isValidEndpoint) {
      throw new Error('Invalid API endpoint');
    }

    // Determine base URL based on endpoint
    const baseUrl = endpoint.includes('/veo/') || endpoint.includes('/chat/') 
      ? KIE_MAIN_API 
      : KIE_FILE_API;

    return `${baseUrl}${endpoint}`;
  }

  // Security: Sanitize API response
  private sanitizeResponse(response: any): any {
    if (typeof response === 'object' && response !== null) {
      // Remove any sensitive data that shouldn't be exposed to client
      const sanitized = { ...response };
      
      // Remove internal error messages
      if (sanitized.errorMessage && sanitized.errorMessage.length > 200) {
        sanitized.errorMessage = 'An error occurred';
      }
      
      // Remove internal stack traces
      if (sanitized.stack) {
        delete sanitized.stack;
      }
      
      // Remove internal server information
      if (sanitized.server) {
        delete sanitized.server;
      }
      
      return sanitized;
    }
    
    return response;
  }
}

// Export singleton instance
export const secureProxy = new SecurityProxy();

// Export proxy methods for different services
export const ImageGenerationProxy = {
  async generateImage(prompt: string, aspectRatio: string) {
    return secureProxy.makeSecureRequest({
      endpoint: '/4o-image/generate',
      method: 'POST',
      body: {
        prompt,
        aspectRatio,
        model: 'gpt4o_image'
      }
    });
  },

  async editImage(prompt: string, imageBase64: string) {
    return secureProxy.makeSecureRequest({
      endpoint: '/4o-image/edit',
      method: 'POST',
      body: {
        prompt,
        imageBase64,
        model: 'gpt4o_image'
      }
    });
  }
};

export const VideoGenerationProxy = {
  async generateVideo(prompt: string, imageUrls?: string[]) {
    return secureProxy.makeSecureRequest({
      endpoint: '/veo/generate',
      method: 'POST',
      body: {
        prompt,
        model: 'veo3_fast',
        aspectRatio: '16:9',
        generationType: imageUrls?.length ? 'REFERENCE_2_VIDEO' : 'TEXT_2_VIDEO',
        imageUrls
      }
    });
  },

  async getTaskStatus(taskId: string) {
    return secureProxy.makeSecureRequest({
      endpoint: `/veo/task/${taskId}`,
      method: 'GET'
    });
  }
};

export const AudioGenerationProxy = {
  async generateMusic(prompt: string) {
    return secureProxy.makeSecureRequest({
      endpoint: '/suno/generate',
      method: 'POST',
      body: {
        prompt,
        model: 'suno-v4',
        duration: 20
      }
    });
  }
};

export const ChatProxy = {
  async sendMessage(messages: any[]) {
    return secureProxy.makeSecureRequest({
      endpoint: '/chat/completions',
      method: 'POST',
      body: {
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 500
      }
    });
  }
};
