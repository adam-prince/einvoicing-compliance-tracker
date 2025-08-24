import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, LogLevel, logDebug, logInfo, logWarn, logError, logFatal, measurePerformance, measureAsyncPerformance, trackUserAction, trackStateChange, reportReactError, } from './logger';
describe('Logger', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        logger.clearLogs();
        logger.clearErrorReports();
        logger.setLogLevel(LogLevel.DEBUG);
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });
    describe('Basic Logging', () => {
        it('should log debug messages', () => {
            const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => { });
            logDebug('TestSource', 'Debug message', { key: 'value' });
            expect(consoleSpy).toHaveBeenCalled();
            expect(logger.getLogs()).toHaveLength(1);
            expect(logger.getLogs()[0].level).toBe(LogLevel.DEBUG);
        });
        it('should log info messages', () => {
            const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => { });
            logInfo('TestSource', 'Info message');
            expect(consoleSpy).toHaveBeenCalled();
            expect(logger.getLogs()).toHaveLength(1);
            expect(logger.getLogs()[0].level).toBe(LogLevel.INFO);
        });
        it('should log warning messages', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            logWarn('TestSource', 'Warning message');
            expect(consoleSpy).toHaveBeenCalled();
            expect(logger.getLogs()).toHaveLength(1);
            expect(logger.getLogs()[0].level).toBe(LogLevel.WARN);
        });
        it('should log error messages and create error reports', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            const error = new Error('Test error');
            logError('TestSource', 'Error message', { context: 'test' }, error);
            expect(consoleSpy).toHaveBeenCalled();
            expect(logger.getLogs()).toHaveLength(1);
            expect(logger.getErrorReports()).toHaveLength(1);
            expect(logger.getLogs()[0].level).toBe(LogLevel.ERROR);
        });
        it('should log fatal messages', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            logFatal('TestSource', 'Fatal error');
            expect(consoleSpy).toHaveBeenCalled();
            expect(logger.getLogs()).toHaveLength(1);
            expect(logger.getLogs()[0].level).toBe(LogLevel.FATAL);
        });
    });
    describe('Log Level Filtering', () => {
        it('should filter logs based on log level', () => {
            logger.setLogLevel(LogLevel.WARN);
            logDebug('Test', 'Debug');
            logInfo('Test', 'Info');
            logWarn('Test', 'Warning');
            expect(logger.getLogs()).toHaveLength(1);
            expect(logger.getLogs()[0].level).toBe(LogLevel.WARN);
        });
        it('should return filtered logs by level', () => {
            logDebug('Test', 'Debug');
            logInfo('Test', 'Info');
            logWarn('Test', 'Warning');
            logError('Test', 'Error');
            const warningAndAbove = logger.getLogs(LogLevel.WARN);
            expect(warningAndAbove).toHaveLength(2);
            expect(warningAndAbove.every(log => log.level >= LogLevel.WARN)).toBe(true);
        });
    });
    describe('Performance Measurement', () => {
        it('should measure synchronous performance', () => {
            const result = measurePerformance('TestSource', 'test-operation', () => {
                return 'test-result';
            });
            expect(result).toBe('test-result');
        });
        it('should log slow operations', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
            // Mock performance.now to return predictable values
            let callCount = 0;
            vi.spyOn(performance, 'now').mockImplementation(() => {
                return callCount++ === 0 ? 0 : 150; // First call returns 0, second returns 150
            });
            measurePerformance('TestSource', 'slow-operation', () => {
                return 'result';
            });
            expect(consoleSpy).toHaveBeenCalled();
            performance.now.mockRestore();
        });
        it('should measure asynchronous performance', async () => {
            const result = await measureAsyncPerformance('TestSource', 'async-test', async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
                return 'async-result';
            });
            expect(result).toBe('async-result');
        });
    });
    describe('User Activity Tracking', () => {
        it('should track user actions', () => {
            const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => { });
            trackUserAction('button-click', { buttonId: 'export' });
            expect(consoleSpy).toHaveBeenCalled();
            const logs = logger.getLogs();
            expect(logs).toHaveLength(1);
            expect(logs[0].source).toBe('UserAction');
        });
        it('should track state changes', () => {
            const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => { });
            trackStateChange('CountryDetail', 'opened', { countryId: 'US' });
            expect(consoleSpy).toHaveBeenCalled();
            const logs = logger.getLogs();
            expect(logs).toHaveLength(1);
            expect(logs[0].source).toBe('StateChange');
        });
    });
    describe('Error Reporting', () => {
        it('should create error reports for errors and fatal logs', () => {
            logError('TestSource', 'Test error');
            logFatal('TestSource', 'Fatal error');
            const reports = logger.getErrorReports();
            expect(reports).toHaveLength(2);
            expect(reports[0].severity).toBe('medium');
            expect(reports[1].severity).toBe('critical');
        });
        it('should generate unique IDs for error reports', () => {
            logError('Test1', 'Error 1');
            logError('Test2', 'Error 2');
            const reports = logger.getErrorReports();
            expect(reports).toHaveLength(2);
            expect(reports[0].id).not.toBe(reports[1].id);
        });
    });
    describe('React Error Boundary Integration', () => {
        it('should dispatch custom event for React errors', () => {
            const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
            const error = new Error('React component error');
            const errorInfo = { componentStack: 'Component stack trace' };
            reportReactError(error, errorInfo, 'Stack trace');
            expect(dispatchEventSpy).toHaveBeenCalled();
            const call = dispatchEventSpy.mock.calls[0][0];
            expect(call.type).toBe('react-error');
            expect(call.detail.message).toBe('React component error');
        });
    });
    describe('Log Management', () => {
        it('should limit the number of stored logs', () => {
            // Create more logs than the limit (1000)
            for (let i = 0; i < 1005; i++) {
                logInfo('Test', `Message ${i}`);
            }
            expect(logger.getLogs()).toHaveLength(1000);
        });
        it('should clear logs and error reports', () => {
            logInfo('Test', 'Info');
            logError('Test', 'Error');
            expect(logger.getLogs()).toHaveLength(1);
            expect(logger.getErrorReports()).toHaveLength(1);
            logger.clearLogs();
            logger.clearErrorReports();
            expect(logger.getLogs()).toHaveLength(0);
            expect(logger.getErrorReports()).toHaveLength(0);
        });
        it('should export logs in JSON format', () => {
            logInfo('Test', 'Test message', { key: 'value' });
            logError('Test', 'Test error');
            const exported = logger.exportLogs();
            const parsed = JSON.parse(exported);
            expect(parsed.timestamp).toBeTruthy();
            expect(parsed.userAgent).toBeTruthy();
            expect(parsed.logs).toHaveLength(1);
            expect(parsed.errorReports).toHaveLength(1);
        });
    });
});
