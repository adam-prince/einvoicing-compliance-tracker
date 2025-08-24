/**
 * Application configuration constants
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:4321',
  ENDPOINTS: {
    REFRESH_WEB: '/refresh-web',
    PROGRESS: '/progress',
    COUNTRY_TIMELINE: '/country/:id/timeline',
    COUNTRY_NEWS: '/country/:id/news',
    UN_COUNTRIES: '/sync-un-countries',
  },
  TIMEOUTS: {
    DEFAULT: 30000,
    LONG_RUNNING: 120000,
    PROGRESS_POLL: 1000,
  },
} as const;

// Performance Configuration
export const PERFORMANCE_CONFIG = {
  SLOW_OPERATION_THRESHOLD: 100, // milliseconds
  SLOW_ASYNC_OPERATION_THRESHOLD: 500, // milliseconds
  BACKGROUND_REFRESH_INTERVAL: 300000, // 5 minutes
  CORS_REFRESH_DELAY: 10, // milliseconds between CORS requests
  DEBOUNCE_DELAY: 250, // milliseconds for search input
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  LOCAL_STORAGE_KEYS: {
    COUNTRIES: 'einvoicing-countries',
    USER_PREFERENCES: 'user-preferences',
    LAST_SYNC: 'last-sync-timestamp',
  },
  SESSION_STORAGE_KEYS: {
    ERROR_REPORTS: 'error-reports',
    FILTER_STATE: 'filter-state',
  },
  MAX_CACHE_SIZE: 50 * 1024 * 1024, // 50MB
  EXPIRY_TIME: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Logging Configuration
export const LOGGING_CONFIG = {
  MAX_LOGS: 1000,
  MAX_ERROR_REPORTS: 100,
  MAX_SESSION_ERRORS: 10,
  LOG_LEVELS: {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    FATAL: 4,
  },
  PERFORMANCE_LOG_THRESHOLD: 100,
} as const;

// Security Configuration
export const SECURITY_CONFIG = {
  RATE_LIMITS: {
    SEARCH: { maxRequests: 10, windowMs: 60000 }, // 10 requests per minute
    EXPORT: { maxRequests: 5, windowMs: 300000 }, // 5 requests per 5 minutes
    REFRESH: { maxRequests: 3, windowMs: 600000 }, // 3 requests per 10 minutes
    API_CALL: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute
  },
  SANITIZATION: {
    ALLOWED_HTML_TAGS: ['b', 'i', 'em', 'strong', 'span', 'br', 'p'],
    ALLOWED_HTML_ATTRIBUTES: ['class', 'style'],
    MAX_SEARCH_LENGTH: 100,
    MAX_FILENAME_LENGTH: 255,
  },
  CSP_DIRECTIVES: {
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
  },
} as const;

// UI Configuration
export const UI_CONFIG = {
  MODAL_SIZES: {
    SMALL: 'small',
    MEDIUM: 'medium',
    LARGE: 'large',
    XLARGE: 'xlarge',
  },
  TABLE_PAGE_SIZES: [10, 25, 50, 100],
  TOAST_DURATION: 5000, // milliseconds
  PROGRESS_UPDATE_INTERVAL: 500, // milliseconds
  ANIMATION_DURATION: 200, // milliseconds
} as const;

// Filter Configuration
export const FILTER_CONFIG = {
  CONTINENTS: [
    'Europe',
    'Asia',
    'Africa',
    'Americas',
    'Oceania',
  ],
  STATUSES: [
    'mandated',
    'permitted',
    'planned',
    'none',
  ],
  STATUS_LABELS: {
    mandated: 'Mandated',
    permitted: 'Permitted',
    planned: 'Planned',
    none: 'None',
  },
  STATUS_DESCRIPTIONS: {
    mandated: 'Required by law',
    permitted: 'Legally allowed but not required',
    planned: 'Under development or planned',
    none: 'Not implemented or available',
  },
} as const;

// Data Processing Configuration
export const DATA_CONFIG = {
  CHANNELS: ['b2g', 'b2b', 'b2c'] as const,
  CHANNEL_LABELS: {
    b2g: 'Business to Government',
    b2b: 'Business to Business',
    b2c: 'Business to Consumer',
  },
  DATE_FORMATS: {
    ISO: 'YYYY-MM-DD',
    DISPLAY: 'MMM DD, YYYY',
    TIMESTAMP: 'YYYY-MM-DD HH:mm:ss',
  },
  NEWS_SOURCES: {
    OFFICIAL: 'official',
    INDUSTRY: 'industry',
    NEWS: 'news',
    BLOG: 'blog',
  },
  SOURCE_PRIORITIES: {
    official: 1,
    industry: 2,
    news: 3,
    blog: 4,
  },
} as const;

// Accessibility Configuration
export const A11Y_CONFIG = {
  FOCUS_TRAP_SELECTORS: [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ],
  SCREEN_READER_DELAYS: {
    ANNOUNCEMENT: 100,
    CLEAR_MESSAGE: 1000,
  },
  ARIA_LABELS: {
    CLOSE_MODAL: 'Close dialog',
    LOADING: 'Loading content',
    SORT_ASCENDING: 'Sort ascending',
    SORT_DESCENDING: 'Sort descending',
    EXPAND: 'Expand section',
    COLLAPSE: 'Collapse section',
  },
  KEYBOARD_KEYS: {
    ENTER: 'Enter',
    SPACE: ' ',
    ESCAPE: 'Escape',
    TAB: 'Tab',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    HOME: 'Home',
    END: 'End',
  },
} as const;

// File Export Configuration
export const EXPORT_CONFIG = {
  FORMATS: {
    XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    CSV: 'text/csv',
    JSON: 'application/json',
  },
  FILENAME_PREFIX: 'einvoicing-compliance',
  MAX_ROWS_PER_SHEET: 1000000,
  SHEETS: {
    COUNTRIES: 'Countries',
    FORMATS: 'Format Specs',
    TIMELINE: 'Timeline',
    NEWS: 'News',
  },
} as const;

// Environment Configuration
export const ENV_CONFIG = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_TEST: process.env.NODE_ENV === 'test',
  VERSION: process.env.VITE_APP_VERSION || '1.0.0',
  BUILD_DATE: process.env.VITE_BUILD_DATE || new Date().toISOString(),
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  PERMISSION_ERROR: 'You do not have permission to perform this action.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.',
  RATE_LIMIT_ERROR: 'Too many requests. Please wait before trying again.',
  FILE_SIZE_ERROR: 'File size exceeds the maximum allowed limit.',
  INVALID_FORMAT_ERROR: 'Invalid file format. Please use a supported format.',
  API_UNAVAILABLE: 'Service temporarily unavailable. Please try again later.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  EXPORT_COMPLETE: 'Export completed successfully.',
  REFRESH_COMPLETE: 'Data refresh completed.',
  SETTINGS_SAVED: 'Settings saved successfully.',
  COPY_SUCCESS: 'Copied to clipboard.',
  UPLOAD_SUCCESS: 'File uploaded successfully.',
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
  ISO_DATE: /^\d{4}-\d{2}-\d{2}$/,
  ISO_CODE_2: /^[A-Z]{2}$/,
  ISO_CODE_3: /^[A-Z]{3}$/,
  FILENAME: /^[a-zA-Z0-9._-]+$/,
} as const;

// Type definitions for better type safety
export type ApiEndpoint = keyof typeof API_CONFIG.ENDPOINTS;
export type CacheKey = keyof typeof CACHE_CONFIG.LOCAL_STORAGE_KEYS | keyof typeof CACHE_CONFIG.SESSION_STORAGE_KEYS;
export type LogLevel = keyof typeof LOGGING_CONFIG.LOG_LEVELS;
export type FilterStatus = typeof FILTER_CONFIG.STATUSES[number];
export type DataChannel = typeof DATA_CONFIG.CHANNELS[number];
export type NewsSource = keyof typeof DATA_CONFIG.NEWS_SOURCES;
export type ExportFormat = keyof typeof EXPORT_CONFIG.FORMATS;
export type KeyboardKey = keyof typeof A11Y_CONFIG.KEYBOARD_KEYS;