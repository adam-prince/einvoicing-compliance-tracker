/**
 * Comprehensive logging and error reporting system
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  source: string;
  metadata?: Record<string, any>;
  stack?: string;
  userAgent?: string;
  url?: string;
}

export interface ErrorReport {
  id: string;
  timestamp: string;
  error: Error;
  source: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userAgent: string;
  url: string;
  metadata?: Record<string, any>;
  resolved: boolean;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];
  private errorReports: ErrorReport[] = [];
  private maxLogs = 1000;
  private maxErrorReports = 100;
  private privacyCleanupInterval: number | null = null;
  
  // Privacy settings - logs older than 72 hours are automatically deleted
  private readonly LOG_RETENTION_HOURS = 72;
  private readonly CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // Check every hour

  private constructor() {
    this.setupGlobalErrorHandlers();
    this.startPrivacyCleanup();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Start automatic privacy cleanup to delete logs older than 72 hours
   */
  private startPrivacyCleanup(): void {
    // Clean up immediately on start
    this.cleanupOldLogs();
    
    // Set up interval for regular cleanup
    this.privacyCleanupInterval = window.setInterval(() => {
      this.cleanupOldLogs();
    }, this.CLEANUP_INTERVAL_MS);

    // Also cleanup when the page is hidden/minimized for privacy
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.cleanupOldLogs();
      }
    });
  }

  /**
   * Clean up logs and error reports older than the retention period
   */
  private cleanupOldLogs(): void {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - this.LOG_RETENTION_HOURS);
    const cutoffISO = cutoffTime.toISOString();

    // Count items before cleanup for logging
    const logsBeforeCount = this.logs.length;
    const errorsBeforeCount = this.errorReports.length;

    // Clean up in-memory logs
    this.logs = this.logs.filter(log => log.timestamp > cutoffISO);
    this.errorReports = this.errorReports.filter(report => report.timestamp > cutoffISO);

    // Clean up session storage error reports
    this.cleanupSessionStorageErrorReports(cutoffISO);

    // Log cleanup activity if items were removed
    const logsRemoved = logsBeforeCount - this.logs.length;
    const errorsRemoved = errorsBeforeCount - this.errorReports.length;
    
    if (logsRemoved > 0 || errorsRemoved > 0) {
      this.info('PrivacyCleanup', `Cleaned up old data: ${logsRemoved} logs, ${errorsRemoved} error reports`, {
        retentionHours: this.LOG_RETENTION_HOURS,
        cutoffTime: cutoffISO,
        logsRemaining: this.logs.length,
        errorsRemaining: this.errorReports.length,
      });
    }
  }

  /**
   * Clean up error reports stored in session storage
   */
  private cleanupSessionStorageErrorReports(cutoffISO: string): void {
    try {
      const existingReports = sessionStorage.getItem('error-reports');
      if (!existingReports) return;

      const reports: ErrorReport[] = JSON.parse(existingReports);
      const filteredReports = reports.filter(report => report.timestamp > cutoffISO);

      if (filteredReports.length !== reports.length) {
        sessionStorage.setItem('error-reports', JSON.stringify(filteredReports));
      }
    } catch (error) {
      console.warn('Failed to cleanup session storage error reports:', error);
    }
  }

  /**
   * Stop privacy cleanup timer - useful for testing or cleanup
   */
  private stopPrivacyCleanup(): void {
    if (this.privacyCleanupInterval !== null) {
      clearInterval(this.privacyCleanupInterval);
      this.privacyCleanupInterval = null;
    }
  }

  /**
   * Manually trigger privacy cleanup (for testing or immediate cleanup)
   */
  triggerPrivacyCleanup(): void {
    this.cleanupOldLogs();
  }

  /**
   * Get privacy status and statistics
   */
  getPrivacyStatus(): {
    retentionHours: number;
    nextCleanupInterval: number;
    currentLogCount: number;
    currentErrorCount: number;
    oldestLogAge?: number;
    oldestErrorAge?: number;
  } {
    const now = new Date();
    
    const oldestLog = this.logs.length > 0 
      ? Math.max(0, now.getTime() - new Date(this.logs[0].timestamp).getTime()) / (1000 * 60 * 60)
      : undefined;
    
    const oldestError = this.errorReports.length > 0
      ? Math.max(0, now.getTime() - new Date(this.errorReports[0].timestamp).getTime()) / (1000 * 60 * 60)
      : undefined;

    return {
      retentionHours: this.LOG_RETENTION_HOURS,
      nextCleanupInterval: this.CLEANUP_INTERVAL_MS,
      currentLogCount: this.logs.length,
      currentErrorCount: this.errorReports.length,
      oldestLogAge: oldestLog,
      oldestErrorAge: oldestError,
    };
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.error('Global Error Handler', event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled Promise Rejection', event.reason?.message || event.reason, {
        reason: event.reason,
        stack: event.reason?.stack,
      });
    });

    // Handle React Error Boundary errors (if using custom boundary)
    window.addEventListener('react-error', ((event: CustomEvent) => {
      this.error('React Error Boundary', event.detail.message, {
        componentStack: event.detail.componentStack,
        errorInfo: event.detail.errorInfo,
      });
    }) as EventListener);
  }

  private createLogEntry(
    level: LogLevel,
    source: string,
    message: string,
    metadata?: Record<string, any>,
    stack?: string
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
      metadata,
      stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
  }

  private log(entry: LogEntry): void {
    if (entry.level < this.logLevel) return;

    // Add to internal log storage
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output with appropriate method
    const consoleMethod = this.getConsoleMethod(entry.level);
    const logMessage = `[${entry.timestamp}] ${entry.source}: ${entry.message}`;
    
    if (entry.metadata || entry.stack) {
      consoleMethod(logMessage, entry.metadata, entry.stack);
    } else {
      consoleMethod(logMessage);
    }

    // Send critical errors to external service (if configured)
    if (entry.level >= LogLevel.ERROR) {
      this.reportError(entry);
    }
  }

  private getConsoleMethod(level: LogLevel): typeof console.log {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        return console.error;
      default:
        return console.log;
    }
  }

  debug(source: string, message: string, metadata?: Record<string, any>): void {
    this.log(this.createLogEntry(LogLevel.DEBUG, source, message, metadata));
  }

  info(source: string, message: string, metadata?: Record<string, any>): void {
    this.log(this.createLogEntry(LogLevel.INFO, source, message, metadata));
  }

  warn(source: string, message: string, metadata?: Record<string, any>): void {
    this.log(this.createLogEntry(LogLevel.WARN, source, message, metadata));
  }

  error(source: string, message: string, metadata?: Record<string, any>, error?: Error): void {
    const stack = error?.stack || new Error().stack;
    this.log(this.createLogEntry(LogLevel.ERROR, source, message, metadata, stack));
  }

  fatal(source: string, message: string, metadata?: Record<string, any>, error?: Error): void {
    const stack = error?.stack || new Error().stack;
    this.log(this.createLogEntry(LogLevel.FATAL, source, message, metadata, stack));
  }

  private reportError(entry: LogEntry): void {
    const errorReport: ErrorReport = {
      id: this.generateId(),
      timestamp: entry.timestamp,
      error: new Error(entry.message),
      source: entry.source,
      severity: this.getSeverity(entry.level),
      userAgent: navigator.userAgent,
      url: window.location.href,
      metadata: entry.metadata,
      resolved: false,
    };

    this.errorReports.push(errorReport);
    if (this.errorReports.length > this.maxErrorReports) {
      this.errorReports.shift();
    }

    // In a production app, you would send this to your error reporting service
    this.sendToErrorReportingService(errorReport);
  }

  private getSeverity(level: LogLevel): 'low' | 'medium' | 'high' | 'critical' {
    switch (level) {
      case LogLevel.WARN:
        return 'low';
      case LogLevel.ERROR:
        return 'medium';
      case LogLevel.FATAL:
        return 'critical';
      default:
        return 'low';
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private async sendToErrorReportingService(errorReport: ErrorReport): Promise<void> {
    // Mock implementation - in production, replace with actual service
    try {
      // Example: Send to external error reporting service
      /*
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorReport),
      });
      */
      
      // For now, just store in sessionStorage for debugging
      const existingReports = sessionStorage.getItem('error-reports');
      const reports = existingReports ? JSON.parse(existingReports) : [];
      reports.push(errorReport);
      
      // Keep only last 10 error reports in session storage
      if (reports.length > 10) {
        reports.splice(0, reports.length - 10);
      }
      
      sessionStorage.setItem('error-reports', JSON.stringify(reports));
    } catch (error) {
      console.error('Failed to send error report:', error);
    }
  }

  // Performance monitoring
  measurePerformance<T>(
    source: string,
    operation: string,
    fn: () => T
  ): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    if (duration > 100) { // Log operations taking > 100ms
      this.warn(source, `Slow operation: ${operation}`, {
        duration: `${duration.toFixed(2)}ms`,
        operation,
      });
    }

    return result;
  }

  async measureAsyncPerformance<T>(
    source: string,
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    if (duration > 500) { // Log async operations taking > 500ms
      this.warn(source, `Slow async operation: ${operation}`, {
        duration: `${duration.toFixed(2)}ms`,
        operation,
      });
    }

    return result;
  }

  // Get logs for debugging
  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level >= level);
    }
    return [...this.logs];
  }

  getErrorReports(): ErrorReport[] {
    return [...this.errorReports];
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
  }

  clearErrorReports(): void {
    this.errorReports = [];
    // Also clear session storage
    sessionStorage.removeItem('error-reports');
  }

  /**
   * Clear all logs and error reports for immediate privacy compliance
   */
  clearAllData(): void {
    this.clearLogs();
    this.clearErrorReports();
    this.info('PrivacyCleanup', 'All logs and error reports cleared manually');
  }

  // Export logs for support
  exportLogs(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      logs: this.logs,
      errorReports: this.errorReports,
    }, null, 2);
  }
}

// Create and export singleton instance
export const logger = Logger.getInstance();

// Convenience functions
export const logDebug = (source: string, message: string, metadata?: Record<string, any>) =>
  logger.debug(source, message, metadata);

export const logInfo = (source: string, message: string, metadata?: Record<string, any>) =>
  logger.info(source, message, metadata);

export const logWarn = (source: string, message: string, metadata?: Record<string, any>) =>
  logger.warn(source, message, metadata);

export const logError = (source: string, message: string, metadata?: Record<string, any>, error?: Error) =>
  logger.error(source, message, metadata, error);

export const logFatal = (source: string, message: string, metadata?: Record<string, any>, error?: Error) =>
  logger.fatal(source, message, metadata, error);

// Performance measurement decorators
export const measurePerformance = <T>(source: string, operation: string, fn: () => T): T =>
  logger.measurePerformance(source, operation, fn);

export const measureAsyncPerformance = <T>(source: string, operation: string, fn: () => Promise<T>): Promise<T> =>
  logger.measureAsyncPerformance(source, operation, fn);

// React Error Boundary helper
export const reportReactError = (error: Error, errorInfo: any, componentStack?: string) => {
  const event = new CustomEvent('react-error', {
    detail: {
      message: error.message,
      componentStack,
      errorInfo,
      stack: error.stack,
    },
  });
  window.dispatchEvent(event);
};

// User activity tracking
export const trackUserAction = (action: string, metadata?: Record<string, any>) => {
  logger.info('UserAction', action, metadata);
};

// Application state tracking
export const trackStateChange = (component: string, state: string, metadata?: Record<string, any>) => {
  logger.debug('StateChange', `${component}: ${state}`, metadata);
};

// Privacy compliance functions
export const triggerPrivacyCleanup = () => logger.triggerPrivacyCleanup();
export const getPrivacyStatus = () => logger.getPrivacyStatus();
export const clearAllLogData = () => logger.clearAllData();