import { useState, useEffect, useRef, useCallback } from 'react';
import { ComplianceDataService } from '../services/complianceDataService';
import { useI18n } from '../i18n';
import { sanitizeUrl, sanitizeText, rateLimiter, RATE_LIMITS } from '../utils/security';
export function useCountryDetail(country) {
    const { t } = useI18n();
    const [activeTab, setActiveTab] = useState('overview');
    const [timelineData, setTimelineData] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshError, setRefreshError] = useState('');
    const [progress, setProgress] = useState({ percentage: 0, message: '', stage: '' });
    const [newsItems, setNewsItems] = useState([]);
    const [loadingNews, setLoadingNews] = useState(false);
    const [linkStatuses, setLinkStatuses] = useState({});
    const [toast, setToast] = useState({ visible: false, message: '' });
    // Cleanup tracking refs
    const backgroundRefreshRef = useRef(null);
    const toastTimeoutRef = useRef(null);
    const isMountedRef = useRef(true);
    const abortControllerRef = useRef(null);
    const complianceService = ComplianceDataService.getInstance();
    // Component cleanup effect
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            // Clear background refresh
            if (backgroundRefreshRef.current) {
                clearTimeout(backgroundRefreshRef.current);
                backgroundRefreshRef.current = null;
            }
            // Clear toast timeout
            if (toastTimeoutRef.current) {
                clearTimeout(toastTimeoutRef.current);
                toastTimeoutRef.current = null;
            }
            // Abort any ongoing async operations
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
        };
    }, []);
    // Load timeline data on mount
    useEffect(() => {
        const loadTimeline = () => {
            let data = complianceService.getComplianceTimeline(country.isoCode3);
            // If no specific data available, generate sample timeline
            if (!data) {
                data = complianceService.generateSampleTimeline(country.name, country.isoCode3);
            }
            if (isMountedRef.current) {
                setTimelineData(data);
            }
        };
        loadTimeline();
    }, [country.isoCode3, country.name, complianceService]);
    // Load news data when news tab is activated
    useEffect(() => {
        if (activeTab === 'news' && isMountedRef.current) {
            loadNewsData();
        }
    }, [activeTab, country.isoCode3]);
    const showToast = useCallback((message, duration = 3000) => {
        if (!isMountedRef.current)
            return;
        setToast({ visible: true, message });
        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
        }
        toastTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
                setToast({ visible: false, message: '' });
            }
        }, duration);
    }, []);
    const checkUrl = useCallback(async (url) => {
        if (!url)
            return 'unknown';
        const normalizedUrl = sanitizeUrl(url);
        // Check for obviously broken URL patterns first
        if (normalizedUrl.includes('404') || normalizedUrl.includes('not-found') ||
            normalizedUrl.includes('error') || normalizedUrl.includes('missing')) {
            return 'not-found';
        }
        // Quick check for known broken domains/paths
        const knownBrokenPatterns = [
            'entreprises.service-public.fr', // DNS resolution fails
            'www.ferd-net.de/factur-x/index.html', // 404
            'www.impots.gouv.fr/e-facturation-2026' // 404
        ];
        if (knownBrokenPatterns.some(pattern => normalizedUrl.includes(pattern))) {
            return 'not-found';
        }
        return 'unknown';
    }, []);
    const handleSmartLink = useCallback(async (url, title, source, countryCode) => {
        try {
            // Sanitize and validate URL first
            const sanitizedUrl = sanitizeUrl(url);
            if (!sanitizedUrl) {
                showToast(t('toast_invalid_url') || 'Invalid or unsafe URL detected');
                return;
            }
            // Rate limiting check
            const userId = 'current-user';
            if (!rateLimiter.isAllowed(userId, RATE_LIMITS.search.maxRequests, RATE_LIMITS.search.windowMs)) {
                showToast(t('toast_rate_limit') || 'Too many requests. Please wait before trying again.');
                return;
            }
            // Sanitize text inputs
            const sanitizedTitle = sanitizeText(title);
            const sanitizedSource = sanitizeText(source);
            const sanitizedCountryCode = sanitizeText(countryCode);
            // Check if we already have status for this URL
            let linkStatus = linkStatuses[sanitizedUrl];
            if (!linkStatus) {
                linkStatus = await checkUrl(sanitizedUrl);
                // Use requestAnimationFrame to avoid forced reflow
                requestAnimationFrame(() => {
                    if (isMountedRef.current) {
                        setLinkStatuses(prev => ({ ...prev, [sanitizedUrl]: linkStatus }));
                    }
                });
            }
            if (linkStatus === 'not-found') {
                showToast(t('toast_link_broken', { title: sanitizedTitle }) || `Link appears broken. Opening search for: ${sanitizedTitle}`);
                performFallbackSearch(sanitizedTitle, sanitizedSource, sanitizedCountryCode);
                return;
            }
            // For 'ok' or 'unknown' status, try to open the link
            const newWindow = window.open(sanitizedUrl, '_blank', 'noopener,noreferrer');
            if (!newWindow) {
                // Popup blocked, fall back to search
                showToast(t('toast_popup_blocked') || 'Popup blocked. Opening search instead.');
                performFallbackSearch(sanitizedTitle, sanitizedSource, sanitizedCountryCode);
            }
        }
        catch (error) {
            console.error('Error in smart link handler:', error);
            performFallbackSearch(title, source, countryCode);
        }
    }, [linkStatuses, checkUrl, showToast, t]);
    const performFallbackSearch = useCallback((title, source, countryCode) => {
        const searchStrategies = [
            `"${title}" "${source}" einvoicing`,
            `${extractKeyTerms(title)} ${country.name} einvoicing`,
            `"${source}" ${country.name} e-invoicing compliance`,
            `${country.name} einvoicing news updates`
        ];
        const searchEngines = [
            { name: 'Google', url: 'https://www.google.com/search?q=' },
            { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' }
        ];
        const searchQuery = encodeURIComponent(searchStrategies[0]);
        const searchUrl = searchEngines[0].url + searchQuery;
        showToast(t('link_redirected_to_search') || `Link unavailable. Opening search for "${title.substring(0, 50)}..."`);
        window.open(searchUrl, '_blank', 'noopener,noreferrer');
    }, [country.name, showToast, t]);
    const extractKeyTerms = useCallback((title) => {
        const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'];
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !commonWords.includes(word))
            .slice(0, 4)
            .join(' ');
    }, []);
    const generateSourceUrl = useCallback((sourceType, source, countryCode, title) => {
        const searchTerm = encodeURIComponent(title.substring(0, 50));
        switch (sourceType) {
            case 'Official':
                switch (countryCode) {
                    case 'ESP': return 'https://www.agenciatributaria.es/AEAT/Contenidos_Comunes/La_Agencia_Tributaria/Novedades_empresas_y_profesionales/index.shtml';
                    case 'DEU': return 'https://www.bundesfinanzministerium.de/Web/DE/Presse/presse.html';
                    case 'FRA': return 'https://www.impots.gouv.fr/accueil';
                    case 'ITA': return 'https://www.agenziaentrate.gov.it/portale/web/guest/normativa-e-prassi/comunicati-stampa';
                    case 'POL': return 'https://www.gov.pl/web/finanse';
                    default: return `https://www.google.com/search?q=${searchTerm}+einvoicing+${countryCode}`;
                }
            case 'GENA':
                return 'https://gena-einvoicing.com/';
            case 'Consulting':
                if (source.includes('Deloitte'))
                    return 'https://www2.deloitte.com/global/en/services/tax.html';
                if (source.includes('PwC'))
                    return 'https://www.pwc.com/gx/en/services/tax.html';
                if (source.includes('EY'))
                    return 'https://www.ey.com/en_gl/tax';
                if (source.includes('KPMG'))
                    return 'https://home.kpmg/xx/en/home/services/tax.html';
                if (source.includes('Accenture'))
                    return 'https://www.accenture.com/us-en/services/consulting-index';
                return `https://www.google.com/search?q=${searchTerm}+einvoicing`;
            case 'VATCalc':
                return 'https://www.vatcalc.com/';
            case 'Industry':
                if (source.includes('FeRD'))
                    return 'https://www.ferd-net.de/';
                if (source.includes('Chamber'))
                    return `https://www.google.com/search?q="${source}"+einvoicing`;
                return `https://www.google.com/search?q=${searchTerm}+einvoicing`;
            default:
                return `https://www.google.com/search?q=${searchTerm}+einvoicing`;
        }
    }, []);
    const loadNewsData = useCallback(async () => {
        if (!isMountedRef.current)
            return;
        setLoadingNews(true);
        try {
            // Generate 6 months of news data with proper URLs
            const mockNews = generateSixMonthsNewsData(country.name, country.isoCode3);
            // Add proper URLs to each news item but keep original content
            const newsWithUrls = mockNews.map(item => ({
                ...item,
                url: item.url || generateSourceUrl(item.sourceType, item.source, country.isoCode3, item.title)
            }));
            // Sort by date (newest first)
            newsWithUrls.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            if (isMountedRef.current) {
                setNewsItems(newsWithUrls);
            }
        }
        catch (error) {
            console.error('Failed to load news:', error);
        }
        finally {
            if (isMountedRef.current) {
                setLoadingNews(false);
            }
        }
    }, [country.name, country.isoCode3, generateSourceUrl]);
    const generateSixMonthsNewsData = useCallback((countryName, countryCode) => {
        // This would normally be moved to a separate service, but keeping it simple for now
        const now = new Date();
        const newsData = [];
        let newsId = 1;
        const getDaysAgo = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
        // Simple mock data - in a real app this would come from an API
        for (let i = 0; i < 10; i++) {
            newsData.push({
                id: (newsId++).toString(),
                date: getDaysAgo(i * 15),
                title: `E-invoicing Update ${i + 1} for ${countryName}`,
                summary: `Latest developments in e-invoicing compliance for ${countryName}.`,
                source: 'Compliance News',
                sourceType: 'Official',
                relevance: i < 3 ? 'high' : i < 6 ? 'medium' : 'low'
            });
        }
        return newsData.slice(0, 30);
    }, []);
    const handleRefreshTimeline = useCallback(async () => {
        if (!isMountedRef.current)
            return;
        // Rate limiting check for refresh operations
        const userId = 'current-user';
        if (!rateLimiter.isAllowed(userId + '_refresh', RATE_LIMITS.refresh.maxRequests, RATE_LIMITS.refresh.windowMs)) {
            showToast(t('toast_refresh_rate_limit') || 'Refresh rate limit reached. Please wait before trying again.');
            return;
        }
        // Create abort controller for this operation
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        setIsRefreshing(true);
        setRefreshError('');
        setProgress({ percentage: 0, message: t('refresh_starting') || 'Starting refresh...', stage: 'visible' });
        try {
            // Simulate refresh process
            for (let i = 0; i <= 100; i += 25) {
                if (!isMountedRef.current || abortControllerRef.current?.signal.aborted) {
                    break;
                }
                if (isMountedRef.current) {
                    setProgress({
                        percentage: i,
                        message: `Refreshing data... ${i}%`,
                        stage: 'visible'
                    });
                }
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            // Update timeline data
            const updated = complianceService.getComplianceTimeline(country.isoCode3);
            if (updated && isMountedRef.current) {
                setTimelineData(updated);
            }
            if (isMountedRef.current) {
                setProgress({ percentage: 100, message: t('refresh_finalizing') || 'Finalizing updates...', stage: 'complete' });
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        catch (error) {
            if (isMountedRef.current) {
                const errorMsg = t('refresh_error') || 'Failed to refresh compliance data. Please try again.';
                setRefreshError(errorMsg);
            }
            console.error('Refresh error:', error);
        }
        finally {
            if (isMountedRef.current) {
                setIsRefreshing(false);
                setProgress({ percentage: 0, message: '', stage: '' });
            }
        }
    }, [country.isoCode3, complianceService, showToast, t]);
    return {
        activeTab,
        setActiveTab,
        timelineData,
        isRefreshing,
        refreshError,
        progress,
        newsItems,
        loadingNews,
        linkStatuses,
        toast,
        setToast,
        handleSmartLink,
        generateSourceUrl,
        loadNewsData,
        handleRefreshTimeline,
        isMountedRef
    };
}
