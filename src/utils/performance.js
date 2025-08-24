/**
 * Performance monitoring and optimization utilities
 */
import { logger } from './logger';
import { PERFORMANCE_CONFIG } from '../config/constants';
class PerformanceMonitor {
    constructor() {
        Object.defineProperty(this, "metrics", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "observers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "startTimes", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "maxMetrics", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1000
        });
        this.initializeObservers();
        this.monitorWebVitals();
    }
    /**
     * Initialize performance observers
     */
    initializeObservers() {
        if (!('PerformanceObserver' in window))
            return;
        // Navigation timing
        try {
            const navObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordNavigationMetrics(entry);
                }
            });
            navObserver.observe({ entryTypes: ['navigation'] });
            this.observers.push(navObserver);
        }
        catch (error) {
            logger.warn('PerformanceMonitor', 'Navigation observer failed to initialize', { error });
        }
        // Resource timing
        try {
            const resourceObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordResourceMetrics(entry);
                }
            });
            resourceObserver.observe({ entryTypes: ['resource'] });
            this.observers.push(resourceObserver);
        }
        catch (error) {
            logger.warn('PerformanceMonitor', 'Resource observer failed to initialize', { error });
        }
        // Measure timing
        try {
            const measureObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordMeasureMetrics(entry);
                }
            });
            measureObserver.observe({ entryTypes: ['measure'] });
            this.observers.push(measureObserver);
        }
        catch (error) {
            logger.warn('PerformanceMonitor', 'Measure observer failed to initialize', { error });
        }
    }
    /**
     * Monitor Web Vitals
     */
    monitorWebVitals() {
        // FCP - First Contentful Paint
        this.observeWebVital('first-contentful-paint', (entry) => {
            this.recordWebVital('FCP', entry.startTime);
        });
        // LCP - Largest Contentful Paint
        this.observeWebVital('largest-contentful-paint', (entry) => {
            this.recordWebVital('LCP', entry.startTime);
        });
        // CLS - Cumulative Layout Shift
        let clsValue = 0;
        this.observeWebVital('layout-shift', (entry) => {
            if (!entry.hadRecentInput) {
                clsValue += entry.value;
                this.recordWebVital('CLS', clsValue);
            }
        });
        // FID - First Input Delay
        this.observeWebVital('first-input', (entry) => {
            this.recordWebVital('FID', entry.processingStart - entry.startTime);
        });
    }
    /**
     * Observe specific Web Vital metric
     */
    observeWebVital(entryType, callback) {
        if (!('PerformanceObserver' in window))
            return;
        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    callback(entry);
                }
            });
            observer.observe({ entryTypes: [entryType] });
            this.observers.push(observer);
        }
        catch (error) {
            logger.debug('PerformanceMonitor', `Failed to observe ${entryType}`, { error });
        }
    }
    /**
     * Record Web Vital metric
     */
    recordWebVital(name, value) {
        const rating = this.getWebVitalRating(name, value);
        logger.info('WebVitals', `${name}: ${value.toFixed(2)}ms (${rating})`, {
            metric: name,
            value,
            rating,
        });
    }
    /**
     * Get Web Vital rating based on thresholds
     */
    getWebVitalRating(name, value) {
        const thresholds = {
            FCP: { good: 1800, poor: 3000 },
            LCP: { good: 2500, poor: 4000 },
            FID: { good: 100, poor: 300 },
            CLS: { good: 0.1, poor: 0.25 },
            TTFB: { good: 800, poor: 1800 },
        };
        const threshold = thresholds[name];
        if (!threshold)
            return 'good';
        if (value <= threshold.good)
            return 'good';
        if (value <= threshold.poor)
            return 'needs-improvement';
        return 'poor';
    }
    /**
     * Record navigation timing metrics
     */
    recordNavigationMetrics(entry) {
        const metrics = {
            domainLookup: entry.domainLookupEnd - entry.domainLookupStart,
            tcpConnect: entry.connectEnd - entry.connectStart,
            serverResponse: entry.responseEnd - entry.requestStart,
            domProcessing: entry.domContentLoadedEventEnd - entry.responseEnd,
            pageLoad: entry.loadEventEnd - entry.fetchStart,
        };
        for (const [name, duration] of Object.entries(metrics)) {
            if (duration > 0) {
                this.addMetric({
                    name: `navigation-${name}`,
                    startTime: entry.startTime,
                    duration,
                    category: 'network',
                    metadata: { type: 'navigation' },
                });
            }
        }
    }
    /**
     * Record resource timing metrics
     */
    recordResourceMetrics(entry) {
        const duration = entry.responseEnd - entry.startTime;
        const category = this.getResourceCategory(entry.name);
        this.addMetric({
            name: `resource-${category}`,
            startTime: entry.startTime,
            duration,
            category: 'network',
            metadata: {
                url: entry.name,
                type: category,
                size: entry.transferSize || 0,
            },
        });
        // Log slow resources
        if (duration > 1000) {
            logger.warn('Performance', `Slow resource load: ${entry.name}`, {
                duration: `${duration.toFixed(2)}ms`,
                size: entry.transferSize,
            });
        }
    }
    /**
     * Record measure timing metrics
     */
    recordMeasureMetrics(entry) {
        this.addMetric({
            name: entry.name,
            startTime: entry.startTime,
            duration: entry.duration,
            category: 'user-interaction',
            metadata: { type: 'measure' },
        });
    }
    /**
     * Get resource category based on URL
     */
    getResourceCategory(url) {
        if (url.includes('.js'))
            return 'script';
        if (url.includes('.css'))
            return 'stylesheet';
        if (url.includes('.png') || url.includes('.jpg') || url.includes('.svg'))
            return 'image';
        if (url.includes('.woff') || url.includes('.ttf'))
            return 'font';
        if (url.includes('/api/') || url.includes('/api'))
            return 'api';
        return 'other';
    }
    /**
     * Start timing a custom operation
     */
    startTiming(name) {
        this.startTimes.set(name, performance.now());
        performance.mark(`${name}-start`);
    }
    /**
     * End timing a custom operation
     */
    endTiming(name, category = 'user-interaction', metadata) {
        const startTime = this.startTimes.get(name);
        if (!startTime)
            return;
        const endTime = performance.now();
        const duration = endTime - startTime;
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
        this.addMetric({
            name,
            startTime,
            endTime,
            duration,
            category,
            metadata,
        });
        this.startTimes.delete(name);
        // Log slow operations
        if (duration > PERFORMANCE_CONFIG.SLOW_OPERATION_THRESHOLD) {
            logger.warn('Performance', `Slow operation: ${name}`, {
                duration: `${duration.toFixed(2)}ms`,
                category,
                ...metadata,
            });
        }
    }
    /**
     * Time a function execution
     */
    time(name, fn, category = 'data-processing') {
        this.startTiming(name);
        try {
            const result = fn();
            this.endTiming(name, category);
            return result;
        }
        catch (error) {
            this.endTiming(name, category, { error: error instanceof Error ? error.message : 'Unknown error' });
            throw error;
        }
    }
    /**
     * Time an async function execution
     */
    async timeAsync(name, fn, category = 'network') {
        this.startTiming(name);
        try {
            const result = await fn();
            this.endTiming(name, category);
            return result;
        }
        catch (error) {
            this.endTiming(name, category, { error: error instanceof Error ? error.message : 'Unknown error' });
            throw error;
        }
    }
    /**
     * Add a performance metric
     */
    addMetric(metric) {
        const fullMetric = {
            ...metric,
            endTime: metric.endTime || metric.startTime + (metric.duration || 0),
        };
        this.metrics.push(fullMetric);
        // Prevent memory leaks by limiting metrics
        if (this.metrics.length > this.maxMetrics) {
            this.metrics.splice(0, this.metrics.length - this.maxMetrics);
        }
    }
    /**
     * Get performance metrics by category
     */
    getMetrics(category, limit) {
        let filtered = category ? this.metrics.filter(m => m.category === category) : this.metrics;
        if (limit) {
            filtered = filtered.slice(-limit);
        }
        return filtered;
    }
    /**
     * Get performance summary
     */
    getSummary() {
        const metricsByCategory = this.metrics.reduce((acc, metric) => {
            if (!acc[metric.category]) {
                acc[metric.category] = [];
            }
            acc[metric.category].push(metric.duration || 0);
            return acc;
        }, {});
        const summary = {};
        for (const [category, durations] of Object.entries(metricsByCategory)) {
            const sorted = durations.sort((a, b) => a - b);
            summary[category] = {
                count: durations.length,
                min: Math.min(...durations),
                max: Math.max(...durations),
                avg: durations.reduce((a, b) => a + b, 0) / durations.length,
                p50: sorted[Math.floor(sorted.length * 0.5)],
                p90: sorted[Math.floor(sorted.length * 0.9)],
                p95: sorted[Math.floor(sorted.length * 0.95)],
            };
        }
        return summary;
    }
    /**
     * Clear all metrics
     */
    clearMetrics() {
        this.metrics = [];
        this.startTimes.clear();
    }
    /**
     * Get memory usage information
     */
    getMemoryInfo() {
        if ('memory' in performance) {
            const memory = performance.memory;
            return {
                usedJSHeapSize: memory.usedJSHeapSize,
                totalJSHeapSize: memory.totalJSHeapSize,
                jsHeapSizeLimit: memory.jsHeapSizeLimit,
                usedPercent: ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(2),
            };
        }
        return null;
    }
    /**
     * Export performance data
     */
    exportData() {
        const data = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            metrics: this.metrics,
            summary: this.getSummary(),
            memory: this.getMemoryInfo(),
        };
        return JSON.stringify(data, null, 2);
    }
    /**
     * Cleanup observers
     */
    destroy() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
        this.clearMetrics();
    }
}
// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();
// Helper functions
export const measureFunction = (name, fn) => {
    return performanceMonitor.time(name, fn);
};
export const measureAsyncFunction = (name, fn) => {
    return performanceMonitor.timeAsync(name, fn);
};
// React hook for performance monitoring
import { useEffect, useRef } from 'react';
export function usePerformanceMonitor(componentName) {
    const renderStartRef = useRef();
    useEffect(() => {
        // Measure component mount time
        if (renderStartRef.current) {
            const mountTime = performance.now() - renderStartRef.current;
            logger.debug('Performance', `${componentName} mount time`, {
                duration: `${mountTime.toFixed(2)}ms`,
            });
        }
        return () => {
            // Component unmount
            logger.debug('Performance', `${componentName} unmounted`);
        };
    }, [componentName]);
    // Start render timing
    if (!renderStartRef.current) {
        renderStartRef.current = performance.now();
    }
    return {
        startTiming: (operation) => performanceMonitor.startTiming(`${componentName}-${operation}`),
        endTiming: (operation, metadata) => performanceMonitor.endTiming(`${componentName}-${operation}`, 'render', metadata),
        measureOperation: (operation, fn) => performanceMonitor.time(`${componentName}-${operation}`, fn, 'render'),
    };
}
// Performance utility decorators
export function performanceDecorator(target, propertyName, descriptor) {
    const method = descriptor.value;
    descriptor.value = function (...args) {
        const className = target.constructor.name;
        const operationName = `${className}.${propertyName}`;
        const startTime = performance.now();
        try {
            const result = method.apply(this, args);
            const endTime = performance.now();
            const duration = endTime - startTime;
            if (duration > PERFORMANCE_CONFIG.SLOW_OPERATION_THRESHOLD) {
                logger.warn('Performance', `Slow operation: ${operationName}`, {
                    duration: `${duration.toFixed(2)}ms`,
                });
            }
            return result;
        }
        catch (error) {
            const endTime = performance.now();
            const duration = endTime - startTime;
            logger.error('Performance', `Failed operation: ${operationName}`, {
                duration: `${duration.toFixed(2)}ms`,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    };
    return descriptor;
}
export function asyncPerformanceDecorator(target, propertyName, descriptor) {
    const method = descriptor.value;
    descriptor.value = async function (...args) {
        const className = target.constructor.name;
        const operationName = `${className}.${propertyName}`;
        const startTime = performance.now();
        try {
            const result = await method.apply(this, args);
            const endTime = performance.now();
            const duration = endTime - startTime;
            if (duration > PERFORMANCE_CONFIG.SLOW_ASYNC_OPERATION_THRESHOLD) {
                logger.warn('Performance', `Slow async operation: ${operationName}`, {
                    duration: `${duration.toFixed(2)}ms`,
                });
            }
            return result;
        }
        catch (error) {
            const endTime = performance.now();
            const duration = endTime - startTime;
            logger.error('Performance', `Failed async operation: ${operationName}`, {
                duration: `${duration.toFixed(2)}ms`,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    };
    return descriptor;
}
