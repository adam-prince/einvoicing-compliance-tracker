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
    const createStableCallback = useCallback((callback, deps) => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        return useCallback(callback, deps);
    }, []);
    // Performance monitoring utilities
    const measureRenderTime = useCallback((componentName) => {
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
    const throttle = useCallback((func, limit) => {
        let inThrottle;
        return ((...args) => {
            if (!inThrottle) {
                func.apply(null, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        });
    }, []);
    // Memoized value creator with custom equality check
    const createMemoizedValue = useCallback((value, equalityFn) => {
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
