// Security: Comprehensive input validation and sanitization

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

class InputValidator {
  private static instance: InputValidator;

  private constructor() {}

  public static getInstance(): InputValidator {
    if (!InputValidator.instance) {
      InputValidator.instance = new InputValidator();
    }
    return InputValidator.instance;
  }

  // Security: Validate text input for injection attacks
  public validateTextInput(text: string, fieldName: string = 'input'): ValidationError[] {
    const errors: ValidationError[] = [];

    if (typeof text !== 'string') {
      errors.push({
        field: fieldName,
        message: 'Input must be a string',
        code: 'INVALID_TEXT_TYPE'
      });
      return errors;
    }

    // Length validation
    if (text.length === 0) {
      errors.push({
        field: fieldName,
        message: 'Input cannot be empty',
        code: 'EMPTY_INPUT'
      });
    }

    if (text.length > 10000) {
      errors.push({
        field: fieldName,
        message: 'Input too long (max 10000 chars)',
        code: 'INPUT_TOO_LONG'
      });
    }

    // Check for SQL injection patterns
    const sqlPatterns = [
      /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bEXEC\b)/gi,
      /(-{2}|\/\*|\*\/|;)/g,
      /xp_|sp_/gi
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(text)) {
        errors.push({
          field: fieldName,
          message: 'Potentially malicious SQL content detected',
          code: 'SQL_INJECTION_DETECTED'
        });
        break;
      }
    }

    // Check for XSS patterns
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /vbscript:/gi
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(text)) {
        errors.push({
          field: fieldName,
          message: 'Potentially malicious script content detected',
          code: 'XSS_DETECTED'
        });
        break;
      }
    }

    return errors;
  }

  // Security: Validate aspect ratio
  public validateAspectRatio(aspectRatio: string): ValidationError[] {
    const errors: ValidationError[] = [];
    const validRatios = ['16:9', '9:16', '1:1', '4:3', '3:4'];

    if (!validRatios.includes(aspectRatio)) {
      errors.push({
        field: 'aspectRatio',
        message: `Invalid aspect ratio. Must be one of: ${validRatios.join(', ')}`,
        code: 'INVALID_ASPECT_RATIO'
      });
    }

    return errors;
  }

  // Security: Validate file uploads
  public validateFileUpload(file: File): ValidationError[] {
    const errors: ValidationError[] = [];
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];

    if (!file) {
      errors.push({
        field: 'file',
        message: 'File is required',
        code: 'FILE_REQUIRED'
      });
      return errors;
    }

    if (file.size > maxSize) {
      errors.push({
        field: 'file',
        message: `File too large (max 50MB)`,
        code: 'FILE_TOO_LARGE'
      });
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push({
        field: 'file',
        message: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`,
        code: 'INVALID_FILE_TYPE'
      });
    }

    return errors;
  }

  // Security: Validate number input
  public validateNumberInput(value: any, fieldName: string = 'number', min?: number, max?: number): ValidationError[] {
    const errors: ValidationError[] = [];

    if (typeof value !== 'number') {
      errors.push({
        field: fieldName,
        message: 'Input must be a number',
        code: 'INVALID_NUMBER_TYPE'
      });
      return errors;
    }

    if (min !== undefined && value < min) {
      errors.push({
        field: fieldName,
        message: `Value must be at least ${min}`,
        code: 'NUMBER_TOO_SMALL'
      });
    }

    if (max !== undefined && value > max) {
      errors.push({
        field: fieldName,
        message: `Value must be at most ${max}`,
        code: 'NUMBER_TOO_LARGE'
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
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
      .trim();
  }

  // Security: Validate API request payload
  public validateApiPayload(payload: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (typeof payload !== 'object' || payload === null) {
      errors.push({
        field: 'payload',
        message: 'Payload must be an object',
        code: 'INVALID_PAYLOAD_TYPE'
      });
      return errors;
    }

    const checkNested = (obj: any, path: string = ''): void => {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        const keyErrors = this.validateTextInput(key, currentPath);
        errors.push(...keyErrors);

        if (typeof value === 'string') {
          const valueErrors = this.validateTextInput(value, currentPath);
          errors.push(...valueErrors);
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          checkNested(value, currentPath);
        }
      }
    };

    checkNested(payload);
    return errors;
  }
}

// Export helper functions
export const validateInput = (text: string, fieldName: string = 'input'): ValidationError[] => {
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
