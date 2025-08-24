import { Country, FilterQuery, ApiResponse } from '../types/index';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api/v1';

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

    try {
      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(url, { 
        ...config, 
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || 
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
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
  async refreshData(): Promise<ApiResponse<{
    refreshId: string;
    operations: Array<{
      id: string;
      name: string;
      status: string;
      updated: string;
    }>;
    totalCountries: number;
    lastRefresh: string;
  }>> {
    return this.request('/refresh', {
      method: 'POST',
      body: JSON.stringify({})
    });
  }

  // Health check
  async healthCheck(): Promise<{ success: boolean; data: any }> {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/api/v1', '')}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return { success: false, data: null };
    }
  }
}

export const apiService = new ApiService();