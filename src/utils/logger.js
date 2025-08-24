/**
 * Comprehensive logging and error reporting system
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
    LogLevel[LogLevel["FATAL"] = 4] = "FATAL";
})(LogLevel || (LogLevel = {}));
class Logger {
    constructor() {
        Object.defineProperty(this, "logLevel", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: LogLevel.INFO
        });
        Object.defineProperty(this, "logs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "errorReports", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "maxLogs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1000
        });
        Object.defineProperty(this, "maxErrorReports", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 100
        });
        Object.defineProperty(this, "privacyCleanupInterval", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        // Privacy settings - logs older than 72 hours are automatically deleted
        Object.defineProperty(this, "LOG_RETENTION_HOURS", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 72
        });
        Object.defineProperty(this, "CLEANUP_INTERVAL_MS", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 60 * 60 * 1000
        }); // Check every hour
        this.setupGlobalErrorHandlers();
        this.startPrivacyCleanup();
    }
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    setLogLevel(level) {
        this.logLevel = level;
    }
    /**
     * Start automatic privacy cleanup to delete logs older than 72 hours
     */
    startPrivacyCleanup() {
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
    cleanupOldLogs() {
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
    cleanupSessionStorageErrorReports(cutoffISO) {
        try {
            const existingReports = sessionStorage.getItem('error-reports');
            if (!existingReports)
                return;
            const reports = JSON.parse(existingReports);
            const filteredReports = reports.filter(report => report.timestamp > cutoffISO);
            if (filteredReports.length !== reports.length) {
                sessionStorage.setItem('error-reports', JSON.stringify(filteredReports));
            }
        }
        catch (error) {
            console.warn('Failed to cleanup session storage error reports:', error);
        }
    }
    /**
     * Stop privacy cleanup timer - useful for testing or cleanup
     */
    stopPrivacyCleanup() {
        if (this.privacyCleanupInterval !== null) {
            clearInterval(this.privacyCleanupInterval);
            this.privacyCleanupInterval = null;
        }
    }
    /**
     * Manually trigger privacy cleanup (for testing or immediate cleanup)
     */
    triggerPrivacyCleanup() {
        this.cleanupOldLogs();
    }
    /**
     * Get privacy status and statistics
     */
    getPrivacyStatus() {
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
    setupGlobalErrorHandlers() {
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
        window.addEventListener('react-error', ((event) => {
            this.error('React Error Boundary', event.detail.message, {
                componentStack: event.detail.componentStack,
                errorInfo: event.detail.errorInfo,
            });
        }));
    }
    createLogEntry(level, source, message, metadata, stack) {
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
    log(entry) {
        if (entry.level < this.logLevel)
            return;
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
        }
        else {
            consoleMethod(logMessage);
        }
        // Send critical errors to external service (if configured)
        if (entry.level >= LogLevel.ERROR) {
            this.reportError(entry);
        }
    }
    getConsoleMethod(level) {
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
    debug(source, message, metadata) {
        this.log(this.createLogEntry(LogLevel.DEBUG, source, message, metadata));
    }
    info(source, message, metadata) {
        this.log(this.createLogEntry(LogLevel.INFO, source, message, metadata));
    }
    warn(source, message, metadata) {
        this.log(this.createLogEntry(LogLevel.WARN, source, message, metadata));
    }
    error(source, message, metadata, error) {
        const stack = error?.stack || new Error().stack;
        this.log(this.createLogEntry(LogLevel.ERROR, source, message, metadata, stack));
    }
    fatal(source, message, metadata, error) {
        const stack = error?.stack || new Error().stack;
        this.log(this.createLogEntry(LogLevel.FATAL, source, message, metadata, stack));
    }
    reportError(entry) {
        const errorReport = {
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
    getSeverity(level) {
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
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    async sendToErrorReportingService(errorReport) {
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
        }
        catch (error) {
            console.error('Failed to send error report:', error);
        }
    }
    // Performance monitoring
    measurePerformance(source, operation, fn) {
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
    async measureAsyncPerformance(source, operation, fn) {
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
    getLogs(level) {
        if (level !== undefined) {
            return this.logs.filter(log => log.level >= level);
        }
        return [...this.logs];
    }
    getErrorReports() {
        return [...this.errorReports];
    }
    // Clear logs
    clearLogs() {
        this.logs = [];
    }
    clearErrorReports() {
        this.errorReports = [];
        // Also clear session storage
        sessionStorage.removeItem('error-reports');
    }
    /**
     * Clear all logs and error reports for immediate privacy compliance
     */
    clearAllData() {
        this.clearLogs();
        this.clearErrorReports();
        this.info('PrivacyCleanup', 'All logs and error reports cleared manually');
    }
    // Export logs for support
    exportLogs() {
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
export const logDebug = (source, message, metadata) => logger.debug(source, message, metadata);
export const logInfo = (source, message, metadata) => logger.info(source, message, metadata);
export const logWarn = (source, message, metadata) => logger.warn(source, message, metadata);
export const logError = (source, message, metadata, error) => logger.error(source, message, metadata, error);
export const logFatal = (source, message, metadata, error) => logger.fatal(source, message, metadata, error);
// Performance measurement decorators
export const measurePerformance = (source, operation, fn) => logger.measurePerformance(source, operation, fn);
export const measureAsyncPerformance = (source, operation, fn) => logger.measureAsyncPerformance(source, operation, fn);
// React Error Boundary helper
export const reportReactError = (error, errorInfo, componentStack) => {
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
export const trackUserAction = (action, metadata) => {
    logger.info('UserAction', action, metadata);
};
// Application state tracking
export const trackStateChange = (component, state, metadata) => {
    logger.debug('StateChange', `${component}: ${state}`, metadata);
};
// Privacy compliance functions
export const triggerPrivacyCleanup = () => logger.triggerPrivacyCleanup();
export const getPrivacyStatus = () => logger.getPrivacyStatus();
export const clearAllLogData = () => logger.clearAllData();
