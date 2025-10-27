if (!emailRegex.test(email)) {
      errors.push({
        field: 'email',
        message: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }

    // Length validation
    if (email.length > 254) { // RFC 5321 limit
      errors.push({
        field: 'email',
        message: 'Email too long',
        code: 'EMAIL_TOO_LONG'
      });
    }

    return errors;
  }

  // Security: Sanitize input by removing dangerous content
  public sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      // Remove script tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove event handlers
      .replace(/on\w+\s*=/gi, '')
      // Remove javascript: URLs
      .replace(/javascript:/gi, '')
      // Remove vbscript: URLs
      .replace(/vbscript:/gi, '')
      // Remove control characters
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
      // Trim whitespace
      .trim();
  }

  // Security: Validate API request payload
  public validateApiPayload(payload: any): ValidationError[] {
    const errors: ValidationError[] = [];

    // Type checking
    if (typeof payload !== 'object' || payload === null) {
      errors.push({
        field: 'payload',
        message: 'Payload must be an object',
        code: 'INVALID_PAYLOAD_TYPE'
      });
      return errors;
    }

    // Check for nested dangerous content
    const checkNested = (obj: any, path: string = ''): void => {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;

        // Validate keys
        const keyErrors = this.validateTextInput(key, currentPath);
        errors.push(...keyErrors);

        if (typeof value === 'string') {
          const valueErrors = this.validateTextInput(value, currentPath);
          errors.push(...valueErrors);
        } else if (typeof value === 'object' && value !== null) {
          checkNested(value, currentPath);
        }
      }
    };

    checkNested(payload);

    return errors;
  }

  // Security: Rate limiting helper
  public checkRateLimit(identifier: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
    // In production, implement actual rate limiting with Redis or similar
    // This is a placeholder for demonstration
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Local storage implementation (not production-ready)
    const storageKey = `rate_limit_${identifier}`;
    const existingData = localStorage.getItem(storageKey);
    
    let requests: number[] = [];
    if (existingData) {
      requests = JSON.parse(existingData);
    }

    // Remove old requests outside the window
    requests = requests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (requests.length >= maxRequests) {
      return false;
    }

    // Add current request
    requests.push(now);
    localStorage.setItem(storageKey, JSON.stringify(requests));
    
    return true;
  }
}

// Export helper functions for easy usage
export const validateText = (text: string, fieldName?: string): ValidationError[] => {
  return InputValidator.getInstance().validateTextInput(text, fieldName);
};

export const validateAspectRatio = (aspectRatio: string): ValidationError[] => {
  return InputValidator.getInstance().validateAspectRatio(aspectRatio);
};

export const validateFile = (file: File): ValidationError[] => {
  return InputValidator.getInstance().validateFileUpload(file);
};

export const validateNumber = (value: any, fieldName?: string, min?: number, max?: number): ValidationError[] => {
  return InputValidator.getInstance().validateNumberInput(value, fieldName, min, max);
};

export const sanitize = (input: string): string => {
  return InputValidator.getInstance().sanitizeInput(input);
};

export const validateApiPayload = (payload: any): ValidationError[] => {
  return InputValidator.getInstance().validateApiPayload(payload);
};

export const checkRateLimit = (identifier: string, maxRequests?: number, windowMs?: number): boolean => {
  return InputValidator.getInstance().checkRateLimit(identifier, maxRequests, windowMs);
};
