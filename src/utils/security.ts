import DOMPurify from 'dompurify';

export interface SecurityConfig {
  allowedTags: string[];
  allowedAttributes: string[];
  stripIgnoreTag: boolean;
  stripIgnoreTagBody: boolean;
}

// Default security configuration for the application
const DEFAULT_CONFIG: SecurityConfig = {
  allowedTags: ['b', 'i', 'em', 'strong', 'span', 'br', 'p'],
  allowedAttributes: ['class', 'style'],
  stripIgnoreTag: true,
  stripIgnoreTagBody: true,
};

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param html - The HTML content to sanitize
 * @param config - Optional security configuration
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string, config?: Partial<SecurityConfig>): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: finalConfig.allowedTags,
    ALLOWED_ATTR: finalConfig.allowedAttributes,
  });
}

/**
 * Sanitizes plain text input by removing/escaping potentially dangerous characters
 * @param text - The text to sanitize
 * @returns Sanitized text string
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .trim();
}

/**
 * Validates and sanitizes URL to prevent XSS through href attributes
 * @param url - The URL to validate
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // Remove potentially dangerous protocols
  const cleanUrl = url
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:/gi, '')
    .trim();

  // Validate URL format
  try {
    const urlObj = new URL(cleanUrl);
    // Only allow http, https, and mailto protocols
    if (['http:', 'https:', 'mailto:'].includes(urlObj.protocol)) {
      return cleanUrl;
    }
    return '';
  } catch {
    // If URL is invalid, try as relative path
    if (cleanUrl.startsWith('/') || cleanUrl.startsWith('./') || cleanUrl.startsWith('../')) {
      return cleanUrl;
    }
    return '';
  }
}

/**
 * Validates search query to prevent injection attacks
 * @param query - The search query to validate
 * @returns Sanitized search query
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') {
    return '';
  }

  return query
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/['"]/g, '') // Remove quotes
    .replace(/;/g, '') // Remove semicolons
    .replace(/--/g, '') // Remove SQL comment syntax
    .replace(/\/\*/g, '') // Remove multiline comment start
    .replace(/\*\//g, '') // Remove multiline comment end
    .trim()
    .substring(0, 100); // Limit length
}

/**
 * Validates file names for uploads (if applicable)
 * @param filename - The filename to validate
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return '';
  }

  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '') // Only allow alphanumeric, dots, underscores, hyphens
    .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
    .substring(0, 255); // Limit length
}

/**
 * Content Security Policy configuration
 */
export const CSP_CONFIG = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  'style-src': ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
  'font-src': ["'self'", 'fonts.gstatic.com'],
  'img-src': ["'self'", 'data:', 'blob:', 'https:'],
  'connect-src': ["'self'", 'https:'],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'object-src': ["'none'"],
  'upgrade-insecure-requests': [],
};

/**
 * Generates Content Security Policy header value
 * @returns CSP header string
 */
export function generateCSPHeader(): string {
  return Object.entries(CSP_CONFIG)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive;
      }
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');
}

/**
 * Rate limiting configuration for API calls
 */
export const RATE_LIMITS = {
  search: { maxRequests: 10, windowMs: 60000 }, // 10 requests per minute
  export: { maxRequests: 5, windowMs: 300000 }, // 5 requests per 5 minutes
  refresh: { maxRequests: 3, windowMs: 600000 }, // 3 requests per 10 minutes
};

/**
 * Simple in-memory rate limiter
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove expired requests
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }

  reset(key: string): void {
    this.requests.delete(key);
  }
}

export const rateLimiter = new RateLimiter();