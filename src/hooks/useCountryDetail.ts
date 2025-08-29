import { useState, useEffect, useRef, useCallback } from 'react';
import type { Country } from '@types';
import { ComplianceDataService, type EnhancedComplianceData, type ProgressUpdate } from '../services/complianceDataService';
import { useI18n } from '../i18n';
import { useStore } from '../store/useStore';
import { sanitizeUrl, sanitizeText, rateLimiter, RATE_LIMITS } from '../utils/security';

interface NewsItem {
	id: string;
	date: string;
	title: string;
	summary: string;
	source: string;
	sourceType: 'GENA' | 'Government' | 'Consulting' | 'VATCalc' | 'Industry' | 'Official';
	url?: string;
	relevance: 'high' | 'medium' | 'low';
}

export function useCountryDetail(country: Country) {
	const { t } = useI18n();
	const [activeTab, setActiveTab] = useState('overview');
	const [timelineData, setTimelineData] = useState<EnhancedComplianceData | null>(null);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [refreshError, setRefreshError] = useState<string>('');
	const [progress, setProgress] = useState<ProgressUpdate>({ percentage: 0, message: '', stage: '' });
	const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
	const [loadingNews, setLoadingNews] = useState(false);
	const [linkStatuses, setLinkStatuses] = useState<Record<string, 'ok' | 'not-found' | 'unknown'>>({});
	const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

	// Cleanup tracking refs
	const backgroundRefreshRef = useRef<NodeJS.Timeout | null>(null);
	const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const isMountedRef = useRef(true);
	const abortControllerRef = useRef<AbortController | null>(null);

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

	// Check URL statuses for format specifications on mount
	useEffect(() => {
		const checkFormatUrls = async () => {
			if (!country.eInvoicing) return;
			
			const urlsToCheck: string[] = [];
			
			// Collect URLs from all channels (b2g, b2b, b2c)
			['b2g', 'b2b', 'b2c'].forEach(channel => {
				const channelData = country.eInvoicing[channel as keyof typeof country.eInvoicing];
				if (channelData && channelData.formats) {
					channelData.formats.forEach((format: any) => {
						// Import format specifications to get URLs
						import('../data/formatSpecifications').then(({ getFormatSpecifications }) => {
							const specs = getFormatSpecifications(format.name || format);
							specs.forEach(spec => {
								if (spec.url && !urlsToCheck.includes(spec.url)) {
									urlsToCheck.push(spec.url);
								}
							});
						});
					});
				}
			});

			// Check each URL and update status
			const newStatuses: Record<string, 'ok' | 'not-found' | 'unknown'> = {};
			for (const url of urlsToCheck) {
				try {
					const status = await checkUrl(url);
					newStatuses[url] = status;
				} catch (error) {
					newStatuses[url] = 'unknown';
				}
			}
			
			if (Object.keys(newStatuses).length > 0 && isMountedRef.current) {
				setLinkStatuses(prev => ({ ...prev, ...newStatuses }));
			}
		};

		// Delay URL checking to avoid blocking initial render
		const timer = setTimeout(checkFormatUrls, 500);
		return () => clearTimeout(timer);
	}, [country.eInvoicing, checkUrl]);

	// Load news data when news tab is activated
	useEffect(() => {
		if (activeTab === 'news' && isMountedRef.current) {
			loadNewsData();
		}
	}, [activeTab, country.isoCode3]);

	const showToast = useCallback((message: string, duration = 3000) => {
		if (!isMountedRef.current) return;

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

	const checkUrl = useCallback(async (url: string) => {
		if (!url) return 'unknown';
		
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
		
		// Check for known working URL patterns
		const knownWorkingPatterns = [
			'docs.peppol.eu', // PEPPOL documentation
			'docs.oasis-open.org', // OASIS specifications
			'unece.org', // UN/CEFACT specifications
			'european-standard.eu', // European standards
			'ec.europa.eu', // European Commission
			'eur-lex.europa.eu', // EU legal documents
			'cenfr.gouv.fr' // French official sites that work
		];
		
		// Return 'ok' for known working domains
		if (knownWorkingPatterns.some(pattern => normalizedUrl.includes(pattern))) {
			return 'ok';
		}
		
		return 'unknown';
	}, []);

	const handleSmartLink = useCallback(async (url: string, title: string, source: string, countryCode: string) => {
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
		} catch (error) {
			console.error('Error in smart link handler:', error);
			performFallbackSearch(title, source, countryCode);
		}
	}, [linkStatuses, checkUrl, showToast, t]);

	const performFallbackSearch = useCallback((title: string, source: string, countryCode: string) => {
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

	const extractKeyTerms = useCallback((title: string) => {
		const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'];
		return title
			.toLowerCase()
			.replace(/[^a-z0-9\s]/g, ' ')
			.split(/\s+/)
			.filter(word => word.length > 2 && !commonWords.includes(word))
			.slice(0, 4)
			.join(' ');
	}, []);

	const generateSourceUrl = useCallback((sourceType: string, source: string, countryCode: string, title: string) => {
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
				if (source.includes('Deloitte')) return 'https://www2.deloitte.com/global/en/services/tax.html';
				if (source.includes('PwC')) return 'https://www.pwc.com/gx/en/services/tax.html';
				if (source.includes('EY')) return 'https://www.ey.com/en_gl/tax';
				if (source.includes('KPMG')) return 'https://home.kpmg/xx/en/home/services/tax.html';
				if (source.includes('Accenture')) return 'https://www.accenture.com/us-en/services/consulting-index';
				return `https://www.google.com/search?q=${searchTerm}+einvoicing`;
			case 'VATCalc':
				return 'https://www.vatcalc.com/';
			case 'Industry':
				if (source.includes('FeRD')) return 'https://www.ferd-net.de/';
				if (source.includes('Chamber')) return `https://www.google.com/search?q="${source}"+einvoicing`;
				return `https://www.google.com/search?q=${searchTerm}+einvoicing`;
			default:
				return `https://www.google.com/search?q=${searchTerm}+einvoicing`;
		}
	}, []);

	const loadNewsData = useCallback(async () => {
		if (!isMountedRef.current) return;
		
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
		} catch (error) {
			console.error('Failed to load news:', error);
		} finally {
			if (isMountedRef.current) {
				setLoadingNews(false);
			}
		}
	}, [country.name, country.isoCode3, generateSourceUrl]);

	const generateSixMonthsNewsData = useCallback((countryName: string, countryCode: string): NewsItem[] => {
		// This would normally be moved to a separate service, but keeping it simple for now
		const now = new Date();
		const newsData: NewsItem[] = [];
		let newsId = 1;

		const getDaysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

		// Expanded news sources with more diverse organizations
		const newsSources = [
			// Government and official sources
			{ name: 'Tax Authority', sourceType: 'Official' as const, weight: 0.3 },
			{ name: 'Finance Ministry', sourceType: 'Government' as const, weight: 0.25 },
			{ name: 'Digital Government Office', sourceType: 'Government' as const, weight: 0.2 },
			
			// GENA members and e-invoicing networks
			{ name: 'GENA Global E-invoicing Network', sourceType: 'GENA' as const, weight: 0.15 },
			{ name: 'GENA Technology Partners', sourceType: 'GENA' as const, weight: 0.12 },
			{ name: 'DBNAlliance Network', sourceType: 'Industry' as const, weight: 0.13 },
			
			// Industry and consulting sources
			{ name: 'The Invoicing Hub', sourceType: 'Industry' as const, weight: 0.14 },
			{ name: 'VATCalc Compliance', sourceType: 'VATCalc' as const, weight: 0.12 },
			{ name: 'International Trade Association', sourceType: 'Industry' as const, weight: 0.11 },
			{ name: 'Supply Chain Digital Alliance', sourceType: 'Industry' as const, weight: 0.10 },
			{ name: 'E-commerce Trade Council', sourceType: 'Industry' as const, weight: 0.09 },
			
			// Consulting and advisory
			{ name: 'Tax Compliance Advisory', sourceType: 'Consulting' as const, weight: 0.08 },
			{ name: 'Digital Transformation Partners', sourceType: 'Consulting' as const, weight: 0.07 },
			{ name: 'Business Process Excellence', sourceType: 'Consulting' as const, weight: 0.06 }
		];

		// Generate varied news content templates
		const newsTemplates = [
			{
				titleTemplate: 'New E-invoicing Requirements Announced for {country}',
				summaryTemplate: 'Latest regulatory updates introduce new compliance requirements for electronic invoicing in {country}, affecting businesses across various sectors.',
				relevanceBySource: { 'Official': 'high', 'Government': 'high', 'GENA': 'medium', 'default': 'medium' }
			},
			{
				titleTemplate: 'Digital Invoice Format Standards Updated in {country}',
				summaryTemplate: 'Technical specifications for digital invoice formats have been revised, with new validation rules and data requirements coming into effect.',
				relevanceBySource: { 'Industry': 'high', 'VATCalc': 'high', 'GENA': 'high', 'default': 'medium' }
			},
			{
				titleTemplate: '{country} Extends E-invoicing Implementation Timeline',
				summaryTemplate: 'Businesses in {country} receive extended deadlines for electronic invoicing compliance following industry consultation and feedback.',
				relevanceBySource: { 'Government': 'high', 'Official': 'high', 'default': 'medium' }
			},
			{
				titleTemplate: 'Industry Survey: E-invoicing Adoption Rates in {country}',
				summaryTemplate: 'Recent industry analysis reveals current adoption patterns and challenges faced by businesses implementing electronic invoicing solutions.',
				relevanceBySource: { 'Industry': 'medium', 'Consulting': 'medium', 'default': 'low' }
			},
			{
				titleTemplate: 'Cross-Border E-invoicing Standards for {country}',
				summaryTemplate: 'International harmonization efforts continue with new interoperability standards for cross-border electronic invoice exchange.',
				relevanceBySource: { 'GENA': 'high', 'Industry': 'high', 'default': 'medium' }
			},
			{
				titleTemplate: 'VAT Compliance Updates Impact E-invoicing in {country}',
				summaryTemplate: 'Changes to VAT reporting requirements create new obligations for electronic invoice data capture and transmission processes.',
				relevanceBySource: { 'VATCalc': 'high', 'Official': 'high', 'default': 'medium' }
			},
			{
				titleTemplate: 'Technology Platform Certifications for {country} E-invoicing',
				summaryTemplate: 'New certification processes established for service providers and technology platforms supporting electronic invoicing compliance.',
				relevanceBySource: { 'Industry': 'medium', 'Government': 'medium', 'default': 'low' }
			},
			{
				titleTemplate: 'Small Business E-invoicing Support Programs in {country}',
				summaryTemplate: 'Government and industry initiatives provide resources and assistance for small businesses transitioning to electronic invoicing systems.',
				relevanceBySource: { 'Government': 'medium', 'Industry': 'medium', 'default': 'low' }
			}
		];

		// Generate diverse news items
		for (let i = 0; i < 16; i++) {
			const source = newsSources[i % newsSources.length];
			const template = newsTemplates[i % newsTemplates.length];
			const daysAgo = (i * 11) + Math.floor(Math.random() * 10); // More varied timing
			
			// Determine relevance based on source type and template
			let relevance: 'high' | 'medium' | 'low' = 'low';
			if (template.relevanceBySource[source.sourceType]) {
				relevance = template.relevanceBySource[source.sourceType] as 'high' | 'medium' | 'low';
			} else {
				relevance = template.relevanceBySource.default as 'high' | 'medium' | 'low';
			}

			newsData.push({
				id: (newsId++).toString(),
				date: getDaysAgo(daysAgo),
				title: template.titleTemplate.replace('{country}', countryName),
				summary: template.summaryTemplate.replace('{country}', countryName),
				source: source.name,
				sourceType: source.sourceType,
				relevance: relevance
			});
		}

		// Sort by relevance and date, with some randomization for realism
		return newsData
			.sort((a, b) => {
				const relevanceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
				const relevanceDiff = relevanceOrder[b.relevance] - relevanceOrder[a.relevance];
				if (relevanceDiff !== 0) return relevanceDiff;
				return new Date(b.date).getTime() - new Date(a.date).getTime();
			})
			.slice(0, 12); // Return top 12 most relevant items
	}, []);

	const handleRefreshTimeline = useCallback(async () => {
		if (!isMountedRef.current) return;
		
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
		} catch (error) {
			if (isMountedRef.current) {
				const errorMsg = t('refresh_error') || 'Failed to refresh compliance data. Please try again.';
				setRefreshError(errorMsg);
			}
			console.error('Refresh error:', error);
		} finally {
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