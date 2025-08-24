/**
 * Performance monitoring and optimization utilities
 */

import { logger } from './logger';
import { PERFORMANCE_CONFIG } from '../config/constants';

// Performance metrics interface
export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  category: 'render' | 'network' | 'user-interaction' | 'data-processing' | 'system';
  metadata?: Record<string, any>;
}

// Web Vitals metrics
export interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  delta: number;
  id: string;
  rating: 'good' | 'needs-improvement' | 'poor';
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private startTimes = new Map<string, number>();
  private maxMetrics = 1000;

  constructor() {
    this.initializeObservers();
    this.monitorWebVitals();
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers(): void {
    if (!('PerformanceObserver' in window)) return;

    // Navigation timing
    try {
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordNavigationMetrics(entry as PerformanceNavigationTiming);
        }
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);
    } catch (error) {
      logger.warn('PerformanceMonitor', 'Navigation observer failed to initialize', { error });
    }

    // Resource timing
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordResourceMetrics(entry as PerformanceResourceTiming);
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (error) {
      logger.warn('PerformanceMonitor', 'Resource observer failed to initialize', { error });
    }

    // Measure timing
    try {
      const measureObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMeasureMetrics(entry as PerformanceMeasure);
        }
      });
      measureObserver.observe({ entryTypes: ['measure'] });
      this.observers.push(measureObserver);
    } catch (error) {
      logger.warn('PerformanceMonitor', 'Measure observer failed to initialize', { error });
    }
  }

  /**
   * Monitor Web Vitals
   */
  private monitorWebVitals(): void {
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
  private observeWebVital(entryType: string, callback: (entry: any) => void): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          callback(entry);
        }
      });
      observer.observe({ entryTypes: [entryType] });
      this.observers.push(observer);
    } catch (error) {
      logger.debug('PerformanceMonitor', `Failed to observe ${entryType}`, { error });
    }
  }

  /**
   * Record Web Vital metric
   */
  private recordWebVital(name: WebVitalsMetric['name'], value: number): void {
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
  private getWebVitalRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      TTFB: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[name as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Record navigation timing metrics
   */
  private recordNavigationMetrics(entry: PerformanceNavigationTiming): void {
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
  private recordResourceMetrics(entry: PerformanceResourceTiming): void {
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
  private recordMeasureMetrics(entry: PerformanceMeasure): void {
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
  private getResourceCategory(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.includes('.png') || url.includes('.jpg') || url.includes('.svg')) return 'image';
    if (url.includes('.woff') || url.includes('.ttf')) return 'font';
    if (url.includes('/api/') || url.includes('/api')) return 'api';
    return 'other';
  }

  /**
   * Start timing a custom operation
   */
  startTiming(name: string): void {
    this.startTimes.set(name, performance.now());
    performance.mark(`${name}-start`);
  }

  /**
   * End timing a custom operation
   */
  endTiming(name: string, category: PerformanceMetric['category'] = 'user-interaction', metadata?: Record<string, any>): void {
    const startTime = this.startTimes.get(name);
    if (!startTime) return;

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
  time<T>(name: string, fn: () => T, category: PerformanceMetric['category'] = 'data-processing'): T {
    this.startTiming(name);
    try {
      const result = fn();
      this.endTiming(name, category);
      return result;
    } catch (error) {
      this.endTiming(name, category, { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Time an async function execution
   */
  async timeAsync<T>(name: string, fn: () => Promise<T>, category: PerformanceMetric['category'] = 'network'): Promise<T> {
    this.startTiming(name);
    try {
      const result = await fn();
      this.endTiming(name, category);
      return result;
    } catch (error) {
      this.endTiming(name, category, { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Add a performance metric
   */
  private addMetric(metric: Omit<PerformanceMetric, 'endTime'> & { endTime?: number }): void {
    const fullMetric: PerformanceMetric = {
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
  getMetrics(category?: PerformanceMetric['category'], limit?: number): PerformanceMetric[] {
    let filtered = category ? this.metrics.filter(m => m.category === category) : this.metrics;
    
    if (limit) {
      filtered = filtered.slice(-limit);
    }

    return filtered;
  }

  /**
   * Get performance summary
   */
  getSummary(): Record<string, any> {
    const metricsByCategory = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.category]) {
        acc[metric.category] = [];
      }
      acc[metric.category].push(metric.duration || 0);
      return acc;
    }, {} as Record<string, number[]>);

    const summary: Record<string, any> = {};

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
  clearMetrics(): void {
    this.metrics = [];
    this.startTimes.clear();
  }

  /**
   * Get memory usage information
   */
  getMemoryInfo(): Record<string, any> | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
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
  exportData(): string {
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
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.clearMetrics();
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Helper functions
export const measureFunction = <T>(name: string, fn: () => T): T => {
  return performanceMonitor.time(name, fn);
};

export const measureAsyncFunction = <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  return performanceMonitor.timeAsync(name, fn);
};

// React hook for performance monitoring
import { useEffect, useRef } from 'react';

export function usePerformanceMonitor(componentName: string) {
  const renderStartRef = useRef<number>();

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
    startTiming: (operation: string) => performanceMonitor.startTiming(`${componentName}-${operation}`),
    endTiming: (operation: string, metadata?: Record<string, any>) => 
      performanceMonitor.endTiming(`${componentName}-${operation}`, 'render', metadata),
    measureOperation: <T>(operation: string, fn: () => T): T => 
      performanceMonitor.time(`${componentName}-${operation}`, fn, 'render'),
  };
}

// Performance utility decorators
export function performanceDecorator(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;
  
  descriptor.value = function (...args: any[]) {
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
    } catch (error) {
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

export function asyncPerformanceDecorator(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;
  
  descriptor.value = async function (...args: any[]) {
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
    } catch (error) {
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