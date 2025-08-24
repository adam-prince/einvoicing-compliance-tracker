import { useState, useEffect, useRef, useCallback } from 'react';
import { apiService } from '../services/api';
export function useApi(apiCall, deps = []) {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const abortControllerRef = useRef(null);
    const isMountedRef = useRef(true);
    const fetchData = useCallback(async () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        setIsLoading(true);
        setError(null);
        try {
            const response = await apiCall();
            if (isMountedRef.current && response.success) {
                setData(response.data);
            }
            else if (isMountedRef.current) {
                setError('API request failed');
            }
        }
        catch (err) {
            if (isMountedRef.current && err.name !== 'AbortError') {
                setError(err.message || 'Unknown error occurred');
                setData(null);
            }
        }
        finally {
            if (isMountedRef.current) {
                setIsLoading(false);
            }
        }
    }, deps);
    useEffect(() => {
        isMountedRef.current = true;
        fetchData();
        return () => {
            isMountedRef.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, deps);
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);
    return {
        data,
        isLoading,
        error,
        refetch: fetchData,
    };
}
// Specialized hooks for common API calls
export function useCountries(filters = {}) {
    return useApi(() => apiService.getCountries(filters), [JSON.stringify(filters)]);
}
export function useCountry(countryId) {
    return useApi(() => countryId ? apiService.getCountryById(countryId) : Promise.resolve({ success: true, data: null }), [countryId]);
}
export function useSearch(query, options = {}) {
    return useApi(() => query ? apiService.searchCountries(query, options) : Promise.resolve({ success: true, data: { results: [], query: '', totalMatches: 0, searchTime: 0, suggestions: [] } }), [query, JSON.stringify(options)]);
}
export function useNews(params = {}) {
    return useApi(() => apiService.getNews(params), [JSON.stringify(params)]);
}
export function useCompliance(params = {}) {
    return useApi(() => apiService.getCompliance(params), [JSON.stringify(params)]);
}
