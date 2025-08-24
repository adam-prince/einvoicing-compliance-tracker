import { useState, useEffect, useRef, useCallback } from 'react';
import { apiService } from '../services/api';
import { Country, FilterQuery, ApiResponse } from '../types/index';

export interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  deps: any[] = []
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
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
      } else if (isMountedRef.current) {
        setError('API request failed');
      }
    } catch (err: any) {
      if (isMountedRef.current && err.name !== 'AbortError') {
        setError(err.message || 'Unknown error occurred');
        setData(null);
      }
    } finally {
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
export function useCountries(filters: Partial<FilterQuery> = {}) {
  return useApi(
    () => apiService.getCountries(filters),
    [JSON.stringify(filters)]
  );
}

export function useCountry(countryId: string | null) {
  return useApi(
    () => countryId ? apiService.getCountryById(countryId) : Promise.resolve({ success: true, data: null }),
    [countryId]
  );
}

export function useSearch(
  query: string,
  options: {
    fields?: string[];
    status?: string[];
    type?: string[];
    continent?: string;
    limit?: number;
    fuzzy?: boolean;
    highlight?: boolean;
  } = {}
) {
  return useApi(
    () => query ? apiService.searchCountries(query, options) : Promise.resolve({ success: true, data: { results: [], query: '', totalMatches: 0, searchTime: 0, suggestions: [] } }),
    [query, JSON.stringify(options)]
  );
}

export function useNews(params: {
  page?: number;
  limit?: number;
  countryId?: string;
  source?: string;
  relevance?: string;
  type?: string;
  since?: string;
} = {}) {
  return useApi(
    () => apiService.getNews(params),
    [JSON.stringify(params)]
  );
}

export function useCompliance(params: {
  status?: string;
  type?: string;
  continent?: string;
  hasPeriodicReporting?: boolean;
  updatedSince?: string;
} = {}) {
  return useApi(
    () => apiService.getCompliance(params),
    [JSON.stringify(params)]
  );
}