import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCountryDetail } from './useCountryDetail';
// Mock i18n
vi.mock('../i18n', () => ({
    useI18n: () => ({
        t: (key) => key,
    }),
}));
// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;
// Mock country data
const mockCountry = {
    id: 'US',
    name: 'United States',
    isoCode2: 'US',
    isoCode3: 'USA',
    continent: 'Americas',
    region: 'Northern America',
    eInvoicing: {
        b2g: {
            status: 'mandated',
            implementationDate: '2020-01-01',
            formats: [],
            legislation: null,
        },
        b2b: {
            status: 'permitted',
            implementationDate: null,
            formats: [],
            legislation: null,
        },
        b2c: {
            status: 'none',
            implementationDate: null,
            formats: [],
            legislation: null,
        },
        lastUpdated: '2024-01-01',
    },
};
describe('useCountryDetail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });
    it('should initialize with default values', () => {
        const { result } = renderHook(() => useCountryDetail(mockCountry));
        expect(result.current.activeTab).toBe('overview');
        expect(result.current.timelineData).toEqual([]);
        expect(result.current.newsData).toEqual([]);
        expect(result.current.isRefreshing).toBe(false);
    });
    it('should change active tab', () => {
        const { result } = renderHook(() => useCountryDetail(mockCountry));
        act(() => {
            result.current.setActiveTab('timeline');
        });
        expect(result.current.activeTab).toBe('timeline');
    });
    it('should handle refresh timeline data', async () => {
        const mockTimelineData = [
            {
                date: '2024-01-01',
                events: [
                    {
                        type: 'status_change',
                        channel: 'b2g',
                        description: 'Status changed to mandated',
                        oldValue: 'permitted',
                        newValue: 'mandated',
                    },
                ],
            },
        ];
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ timeline: mockTimelineData }),
        });
        const { result } = renderHook(() => useCountryDetail(mockCountry));
        await act(async () => {
            await result.current.refreshTimelineData();
        });
        expect(mockFetch).toHaveBeenCalledWith(`http://localhost:4321/country/${mockCountry.id}/timeline`, expect.objectContaining({
            signal: expect.any(AbortSignal),
        }));
        await waitFor(() => {
            expect(result.current.timelineData).toEqual(mockTimelineData);
        });
    });
    it('should handle failed timeline refresh', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        mockFetch.mockRejectedValueOnce(new Error('Network error'));
        const { result } = renderHook(() => useCountryDetail(mockCountry));
        await act(async () => {
            await result.current.refreshTimelineData();
        });
        expect(consoleSpy).toHaveBeenCalledWith('Failed to refresh timeline data:', expect.any(Error));
    });
    it('should handle refresh news data', async () => {
        const mockNewsData = [
            {
                id: '1',
                title: 'New e-invoicing regulations',
                summary: 'Summary of changes',
                date: '2024-01-01',
                source: 'Government',
                sourceType: 'official',
                url: 'https://example.com/news/1',
                relevanceScore: 0.9,
            },
        ];
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ news: mockNewsData }),
        });
        const { result } = renderHook(() => useCountryDetail(mockCountry));
        await act(async () => {
            await result.current.refreshNewsData();
        });
        expect(mockFetch).toHaveBeenCalledWith(`http://localhost:4321/country/${mockCountry.id}/news`, expect.objectContaining({
            signal: expect.any(AbortSignal),
        }));
        await waitFor(() => {
            expect(result.current.newsData).toEqual(mockNewsData);
        });
    });
    it('should start background refresh when enabled', () => {
        renderHook(() => useCountryDetail(mockCountry));
        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 300000 // 5 minutes
        );
    });
    it('should cleanup timers and abort controllers on unmount', () => {
        const { unmount } = renderHook(() => useCountryDetail(mockCountry));
        const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
        unmount();
        expect(clearTimeoutSpy).toHaveBeenCalled();
    });
    it('should abort ongoing requests when component unmounts', async () => {
        let abortController;
        mockFetch.mockImplementationOnce((url, options) => {
            abortController = options?.signal?.constructor === AbortSignal
                ? options.signal.constructor
                : new AbortController();
            return new Promise((resolve) => {
                setTimeout(() => resolve({
                    ok: true,
                    json: () => Promise.resolve({ timeline: [] }),
                }), 1000);
            });
        });
        const { result, unmount } = renderHook(() => useCountryDetail(mockCountry));
        // Start a request
        act(() => {
            result.current.refreshTimelineData();
        });
        // Unmount before request completes
        unmount();
        // Advance timers to trigger the request timeout
        act(() => {
            vi.advanceTimersByTime(1000);
        });
    });
    it('should not update state after component is unmounted', async () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ timeline: [{ date: '2024-01-01', events: [] }] }),
        });
        const { result, unmount } = renderHook(() => useCountryDetail(mockCountry));
        // Start refresh
        const refreshPromise = act(async () => {
            await result.current.refreshTimelineData();
        });
        // Unmount immediately
        unmount();
        // Wait for the promise to resolve
        await refreshPromise;
        // Should not have updated timeline data since component was unmounted
        expect(result.current.timelineData).toEqual([]);
    });
    it('should handle network errors gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        // Mock network failure
        mockFetch.mockRejectedValueOnce(new Error('Network error'));
        const { result } = renderHook(() => useCountryDetail(mockCountry));
        await act(async () => {
            await result.current.refreshNewsData();
        });
        expect(consoleSpy).toHaveBeenCalled();
        expect(result.current.newsData).toEqual([]);
    });
    it('should handle invalid response data', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        // Mock invalid JSON response
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ invalid: 'data' }),
        });
        const { result } = renderHook(() => useCountryDetail(mockCountry));
        await act(async () => {
            await result.current.refreshTimelineData();
        });
        // Should handle missing timeline property gracefully
        expect(result.current.timelineData).toEqual([]);
    });
});
