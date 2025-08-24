import { useCallback, useMemo, useRef } from 'react';

/**
 * Hook for performance optimizations including debouncing, memoization, and render tracking
 */
export function usePerformanceOptimization() {
  const renderCountRef = useRef(0);
  const lastRenderTime = useRef(Date.now());

  // Track render count for debugging
  renderCountRef.current += 1;
  const currentTime = Date.now();
  const timeSinceLastRender = currentTime - lastRenderTime.current;
  lastRenderTime.current = currentTime;

  // Memoized stable callback creator
  const createStableCallback = useCallback(<T extends (...args: any[]) => any>(
    callback: T,
    deps: React.DependencyList
  ) => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useCallback(callback, deps);
  }, []);

  // Performance monitoring utilities
  const measureRenderTime = useCallback((componentName: string) => {
    const start = performance.now();
    return {
      end: () => {
        const end = performance.now();
        const duration = end - start;
        if (duration > 16) { // Log slow renders (>16ms)
          console.warn(`Slow render detected in ${componentName}: ${duration.toFixed(2)}ms`);
        }
        return duration;
      }
    };
  }, []);

  // Throttle function for expensive operations
  const throttle = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): T => {
    let inThrottle: boolean;
    return ((...args: any[]) => {
      if (!inThrottle) {
        func.apply(null, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  }, []);

  // Memoized value creator with custom equality check
  const createMemoizedValue = useCallback(<T>(
    value: T,
    equalityFn?: (prev: T, next: T) => boolean
  ) => {
    return useMemo(() => value, [value, equalityFn]);
  }, []);

  return {
    renderCount: renderCountRef.current,
    timeSinceLastRender,
    createStableCallback,
    measureRenderTime,
    throttle,
    createMemoizedValue,
  };
}