const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api/v1';
class ApiService {
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
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
                throw new Error(errorData.error?.message ||
                    `HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        }
        catch (error) {
            console.error(`API request failed: ${url}`, error);
            throw error;
        }
    }
    // Countries API
    async getCountries(params = {}) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, value.toString());
            }
        });
        const queryString = searchParams.toString();
        return this.request(`/countries${queryString ? `?${queryString}` : ''}`);
    }
    async getCountryById(countryId) {
        return this.request(`/countries/${countryId}`);
    }
    // Search API
    async searchCountries(query, options = {}) {
        const searchParams = new URLSearchParams({ q: query });
        Object.entries(options).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    searchParams.append(key, value.join(','));
                }
                else {
                    searchParams.append(key, value.toString());
                }
            }
        });
        return this.request(`/search/countries?${searchParams.toString()}`);
    }
    async searchLegislation(query, options = {}) {
        const searchParams = new URLSearchParams({ q: query });
        Object.entries(options).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, value.toString());
            }
        });
        return this.request(`/search/legislation?${searchParams.toString()}`);
    }
    async searchFormats(query, options = {}) {
        const searchParams = new URLSearchParams({ q: query });
        Object.entries(options).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, value.toString());
            }
        });
        return this.request(`/search/formats?${searchParams.toString()}`);
    }
    // Export API
    async exportToExcel(data) {
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
    async exportToCSV(data) {
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
    async exportToJSON(data) {
        return this.request('/export/json', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    // News API
    async getNews(params = {}) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, value.toString());
            }
        });
        const queryString = searchParams.toString();
        return this.request(`/news${queryString ? `?${queryString}` : ''}`);
    }
    // Compliance API
    async getCompliance(params = {}) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, value.toString());
            }
        });
        const queryString = searchParams.toString();
        return this.request(`/compliance${queryString ? `?${queryString}` : ''}`);
    }
    async updateCountryCompliance(countryId, data) {
        return this.request(`/compliance/${countryId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }
    // Data refresh
    async refreshData() {
        return this.request('/refresh', {
            method: 'POST',
            body: JSON.stringify({})
        });
    }
    // Health check
    async healthCheck() {
        try {
            const response = await fetch(`${API_BASE_URL.replace('/api/v1', '')}/health`);
            return await response.json();
        }
        catch (error) {
            console.error('Health check failed:', error);
            return { success: false, data: null };
        }
    }
}
export const apiService = new ApiService();
