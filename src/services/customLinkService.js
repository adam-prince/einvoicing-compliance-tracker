class CustomLinkService {
    constructor() {
        Object.defineProperty(this, "baseUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'
        });
    }
    async getAllLinks() {
        const response = await fetch(`${this.baseUrl}/api/v1/custom-links`);
        const data = await response.json();
        return data.success ? data.data : [];
    }
    async getLinksByCountry(countryCode) {
        const response = await fetch(`${this.baseUrl}/api/v1/custom-links/country/${countryCode}`);
        const data = await response.json();
        return data.success ? data.data : [];
    }
    async createOrUpdateLink(request) {
        try {
            const response = await fetch(`${this.baseUrl}/api/v1/custom-links`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });
            const data = await response.json();
            return data.success ? data.data : null;
        }
        catch (error) {
            console.error('Failed to create/update custom link:', error);
            return null;
        }
    }
    async deleteLink(id) {
        try {
            const response = await fetch(`${this.baseUrl}/api/v1/custom-links/${id}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            return data.success;
        }
        catch (error) {
            console.error('Failed to delete custom link:', error);
            return false;
        }
    }
    async resolveUrl(countryCode, originalUrl, linkType, lastUpdated) {
        const params = new URLSearchParams({
            originalUrl,
            linkType,
        });
        if (lastUpdated) {
            params.append('lastUpdated', lastUpdated);
        }
        try {
            const response = await fetch(`${this.baseUrl}/api/v1/custom-links/resolve/${countryCode}?${params}`);
            const data = await response.json();
            return data.success ? data.data : {
                hasCustomLink: false,
                customUrl: null,
                shouldUseCustom: false
            };
        }
        catch (error) {
            console.error('Failed to resolve URL:', error);
            return {
                hasCustomLink: false,
                customUrl: null,
                shouldUseCustom: false
            };
        }
    }
    // Helper method to get the best URL to use (custom or original)
    async getBestUrl(countryCode, originalUrl, linkType, lastUpdated) {
        const resolution = await this.resolveUrl(countryCode, originalUrl, linkType, lastUpdated);
        return resolution.shouldUseCustom && resolution.customUrl ? resolution.customUrl : originalUrl;
    }
}
export const customLinkService = new CustomLinkService();
