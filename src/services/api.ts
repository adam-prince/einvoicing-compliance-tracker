import { Country, FilterQuery, ApiResponse } from '../types/index';

// Use relative URLs in development to work with Vite proxy, absolute in production
const API_BASE_URL = import.meta.env.DEV 
  ? '/api/v1'  // Vite proxy will forward to backend
  : (import.meta.env.VITE_API_URL || 'http://localhost:3003/api/v1');

console.log('API Service initialized with base URL:', API_BASE_URL);
console.log('Development mode:', import.meta.env.DEV);
console.log('Environment variables:', import.meta.env);

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    console.log(`🔍 API Request Details:`, {
      url,
      method: config.method || 'GET',
      headers: config.headers,
      body: options.body ? JSON.parse(options.body as string) : null,
      timestamp: new Date().toISOString()
    });

    try {
      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // Increased to 5 seconds
      
      console.log(`⏳ Making fetch request to: ${url}`);
      const response = await fetch(url, { 
        ...config, 
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      console.log(`📡 Response received:`, {
        url,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString()
      });
      
      if (!response.ok) {
        console.error(`❌ Response not OK:`, response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ Error data:`, errorData);
        throw new Error(
          errorData.error?.message || 
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const responseData = await response.json();
      console.log(`✅ Response data:`, responseData);
      return responseData;
    } catch (error) {
      const err = error as Error;
      console.error(`💥 API request failed: ${url}`, {
        error: err?.message || 'Unknown error',
        name: err?.name || 'Unknown',
        stack: err?.stack || 'No stack trace',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  // Countries API
  async getCountries(params: Partial<FilterQuery> = {}): Promise<ApiResponse<Country[]>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    return this.request<Country[]>(`/countries${queryString ? `?${queryString}` : ''}`);
  }

  async getCountryById(countryId: string): Promise<ApiResponse<Country>> {
    return this.request<Country>(`/countries/${countryId}`);
  }

  // Search API
  async searchCountries(query: string, options: {
    fields?: string[];
    status?: string[];
    type?: string[];
    continent?: string;
    limit?: number;
    fuzzy?: boolean;
    highlight?: boolean;
  } = {}): Promise<ApiResponse<{
    results: (Country & { relevanceScore?: number; highlights?: any })[];
    query: string;
    totalMatches: number;
    searchTime: number;
    suggestions: string[];
  }>> {
    const searchParams = new URLSearchParams({ q: query });
    
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          searchParams.append(key, value.join(','));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    return this.request(`/search/countries?${searchParams.toString()}`);
  }

  async searchLegislation(query: string, options: {
    country?: string;
    type?: string;
    language?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  } = {}): Promise<ApiResponse<any>> {
    const searchParams = new URLSearchParams({ q: query });
    
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request(`/search/legislation?${searchParams.toString()}`);
  }

  async searchFormats(query: string, options: {
    country?: string;
    type?: string;
    version?: string;
    authority?: string;
    limit?: number;
  } = {}): Promise<ApiResponse<any>> {
    const searchParams = new URLSearchParams({ q: query });
    
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request(`/search/formats?${searchParams.toString()}`);
  }

  // Export API
  async exportToExcel(data: {
    filters?: any;
    format?: 'basic' | 'detailed' | 'summary';
  }): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/export/excel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  }

  async exportToCSV(data: {
    filters?: any;
    format?: 'basic' | 'detailed' | 'summary';
  }): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/export/csv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  }

  async exportToJSON(data: {
    filters?: any;
    format?: 'basic' | 'detailed' | 'summary';
  }): Promise<ApiResponse<any>> {
    return this.request('/export/json', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // News API
  async getNews(params: {
    page?: number;
    limit?: number;
    countryId?: string;
    source?: string;
    relevance?: string;
    type?: string;
    since?: string;
  } = {}): Promise<ApiResponse<any[]>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    return this.request<any[]>(`/news${queryString ? `?${queryString}` : ''}`);
  }

  // Compliance API
  async getCompliance(params: {
    status?: string;
    type?: string;
    continent?: string;
    hasPeriodicReporting?: boolean;
    updatedSince?: string;
  } = {}): Promise<ApiResponse<any[]>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    return this.request<any[]>(`/compliance${queryString ? `?${queryString}` : ''}`);
  }

  async updateCountryCompliance(countryId: string, data: any): Promise<ApiResponse<any>> {
    return this.request(`/compliance/${countryId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Data refresh
  async refreshData(options: {
    dataSources?: Array<{
      id: string;
      name: string;
      url: string;
      type: 'official' | 'hint';
      category: 'compliance' | 'news' | 'formats' | 'legislation';
      enabled: boolean;
      lastChecked?: string;
      status?: 'active' | 'inactive' | 'error';
    }>;
  } = {}): Promise<ApiResponse<{
    refreshId: string;
    operations: Array<{
      id: string;
      name: string;
      status: string;
      updated?: string;
    }>;
    totalCountries: number;
    lastRefresh: string;
    sourcesUsed?: {
      total: number;
      enabled: number;
      official: number;
      hints: number;
    };
  }>> {
    return this.request('/compliance/refresh', {
      method: 'POST',
      body: JSON.stringify(options)
    });
  }

  // Health check with rate limiting
  private lastHealthCheck = 0;
  private healthCheckInterval = 2000; // Minimum 2 seconds between health checks
  
  async healthCheck(): Promise<{ success: boolean; data: any }> {
    // Rate limiting to prevent spam
    const now = Date.now();
    if (now - this.lastHealthCheck < this.healthCheckInterval) {
      console.log('🚫 Health check rate limited, using cached result');
      return { success: true, data: { status: 'cached', timestamp: new Date().toISOString() } };
    }
    this.lastHealthCheck = now;
    
    try {
      // In dev mode, use proxy route; in prod, use full URL
      const healthUrl = import.meta.env.DEV 
        ? '/health'  // Vite proxy will forward to backend
        : 'http://localhost:3003/health';
      
      // Add cache-busting parameter to ensure fresh response
      const urlWithCacheBuster = `${healthUrl}?_t=${now}`;
      
      console.log('🩺 Calling health check URL:', urlWithCacheBuster);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(urlWithCacheBuster, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error('❌ Health check HTTP error:', response.status, response.statusText);
        return { success: false, data: { error: `HTTP ${response.status}: ${response.statusText}` } };
      }
      
      const result = await response.json();
      console.log('✅ Health check successful response:', result);
      return result;
    } catch (error) {
      const err = error as Error;
      console.error('❌ Health check failed:', {
        name: err.name,
        message: err.message,
        stack: err.stack?.substring(0, 200) + '...'
      });
      
      if (err.name === 'AbortError') {
        return { success: false, data: { error: 'Health check timed out after 5 seconds' } };
      }
      
      return { success: false, data: { error: err.message || 'Unknown error' } };
    }
  }

  // Custom Content Management APIs
  async createCustomFormat(data: {
    countryCode: string;
    name: string;
    version?: string;
    url: string;
    description?: string;
    authority: string;
    type: 'specification' | 'standard' | 'schema';
  }): Promise<ApiResponse<any>> {
    return this.request('/custom-content/formats', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCustomFormats(countryCode?: string): Promise<ApiResponse<any[]>> {
    const params = countryCode ? `?countryCode=${countryCode}` : '';
    return this.request(`/custom-content/formats${params}`);
  }

  async createCustomLegislation(data: {
    countryCode: string;
    name: string;
    url: string;
    language?: string;
    jurisdiction: string;
    type: 'directive' | 'regulation' | 'law' | 'decree' | 'guideline';
    documentId?: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/custom-content/legislation', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCustomLegislation(countryCode?: string): Promise<ApiResponse<any[]>> {
    const params = countryCode ? `?countryCode=${countryCode}` : '';
    return this.request(`/custom-content/legislation${params}`);
  }

  async deleteCustomFormat(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    return this.request(`/custom-content/formats/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteCustomLegislation(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    return this.request(`/custom-content/legislation/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();