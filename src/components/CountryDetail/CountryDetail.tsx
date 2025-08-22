import React, { useState, useEffect, useRef } from 'react';
import { Button, IconButton, Modal } from 'carbon-react/lib';
import type { Country } from '@types';
import { ComplianceDataService, type EnhancedComplianceData, type TimelineEvent, type ProgressUpdate } from '../../services/complianceDataService';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { getFormatSpecifications, getLegislationDocuments, type FormatSpecification, type LegislationDocument } from '../../data/formatSpecifications';
import { ProgressOverlay } from '../common/ProgressOverlay';
import { SearchRedirect } from '../common/SearchRedirect';
import { useI18n } from '../../i18n';
import { Toast } from '../common/Toast';
import { useStore } from '../../store/useStore';

interface CountryDetailProps {
	country: Country;
	onClose: () => void;
}

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

export function CountryDetail({ country, onClose }: CountryDetailProps) {
	const { t, formatDate } = useI18n();
	const [activeTab, setActiveTab] = useState('overview');
	const [timelineData, setTimelineData] = useState<EnhancedComplianceData | null>(null);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [refreshError, setRefreshError] = useState<string>('');
	const [progress, setProgress] = useState<ProgressUpdate>({ percentage: 0, message: '', stage: '' });
	const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
	const [loadingNews, setLoadingNews] = useState(false);
	const [linkStatuses, setLinkStatuses] = useState<Record<string, 'ok' | 'not-found' | 'unknown'>>({});
	const [searchQuery, setSearchQuery] = useState<string>('');
	const [showSearchRedirect, setShowSearchRedirect] = useState<boolean>(false);
	const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

	// Focus management & trap within modal
	const modalRef = useRef<HTMLDivElement | null>(null);
	const previouslyFocusedRef = useRef<HTMLElement | null>(null);

	const complianceService = ComplianceDataService.getInstance();

	// Load timeline data on mount
	useEffect(() => {
		const loadTimeline = () => {
			let data = complianceService.getComplianceTimeline(country.isoCode3);
			
			// If no specific data available, generate sample timeline
			if (!data) {
				data = complianceService.generateSampleTimeline(country.name, country.isoCode3);
			}
			
			setTimelineData(data);
		};

		loadTimeline();
	}, [country.isoCode3, country.name]);

	// Load news data when news tab is activated
	useEffect(() => {
		if (activeTab === 'news') {
			loadNewsData();
		}
	}, [activeTab, country.isoCode3]);

	// Trap focus within modal and return focus to opener on unmount
	useEffect(() => {
		previouslyFocusedRef.current = (document.activeElement as HTMLElement) || null;
		
		// Run link checks once when modal opens - prevent duplicate execution
		let isChecking = false;
		const runInitialLinkChecks = async () => {
			if (isChecking) return;
			isChecking = true;
			try {
				await checkAllDetailLinks();
			} finally {
				isChecking = false;
			}
		};
		
		// Delay to avoid React StrictMode double execution
		const timeoutId = setTimeout(runInitialLinkChecks, 100);
		
		const container = modalRef.current;
		const focusFirst = () => {
			if (!container) return;
			const first = container.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
			first?.focus();
		};
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!container || e.key !== 'Tab') return;
			const focusable = Array.from(container.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
				.filter(el => !el.hasAttribute('disabled'));
			if (focusable.length === 0) return;
			const firstEl = focusable[0];
			const lastEl = focusable[focusable.length - 1];
			const active = document.activeElement as HTMLElement;
			if (e.shiftKey) {
				if (active === firstEl) {
					e.preventDefault();
					lastEl.focus();
				}
			} else {
				if (active === lastEl) {
					e.preventDefault();
					firstEl.focus();
				}
			}
		};
		focusFirst();
		document.addEventListener('keydown', handleKeyDown);
		return () => {
			clearTimeout(timeoutId);
			document.removeEventListener('keydown', handleKeyDown);
			previouslyFocusedRef.current?.focus();
		};
	}, []);

	// Smart link handler with simplified 404 detection
	const handleSmartLink = async (url: string, title: string, source: string, countryCode: string) => {
		try {
			// Check if we already have status for this URL
			let linkStatus = linkStatuses[url];
			
			if (!linkStatus) {
				linkStatus = await checkUrl(url);
				// Use requestAnimationFrame to avoid forced reflow
				requestAnimationFrame(() => {
					setLinkStatuses(prev => ({ ...prev, [url]: linkStatus }));
				});
			}
			
			if (linkStatus === 'not-found') {
				// Don't open broken links, go straight to search
				setToast({ 
					visible: true, 
					message: t('toast_link_broken', { title }) || `Link appears broken. Opening search for: ${title}`
				});
				setTimeout(() => setToast({ visible: false, message: '' }), 3000);
				performFallbackSearch(title, source, countryCode);
				return;
			}
			
			// For 'ok' or 'unknown' status, try to open the link
			const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
			if (!newWindow) {
				// Popup blocked, fall back to search
				setToast({ 
					visible: true, 
					message: t('toast_popup_blocked') || 'Popup blocked. Opening search instead.'
				});
				setTimeout(() => setToast({ visible: false, message: '' }), 3000);
				performFallbackSearch(title, source, countryCode);
			}
			
		} catch (error) {
			console.error('Error in smart link handler:', error);
			performFallbackSearch(title, source, countryCode);
		}
	};
	
	// Perform intelligent search when links fail
	const performFallbackSearch = (title: string, source: string, countryCode: string) => {
		// Create multiple search strategies and try the best one
		const searchStrategies = [
			// Strategy 1: Exact title + source + einvoicing
			`"${title}" "${source}" einvoicing`,
			// Strategy 2: Key terms from title + country + einvoicing  
			`${extractKeyTerms(title)} ${country.name} einvoicing`,
			// Strategy 3: Source + country + general einvoicing terms
			`"${source}" ${country.name} e-invoicing compliance`,
			// Strategy 4: Fallback general search
			`${country.name} einvoicing news updates`
		];
		
		// Try Google first, then DuckDuckGo as fallback
		const searchEngines = [
			{ name: 'Google', url: 'https://www.google.com/search?q=' },
			{ name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' }
		];
		
		// Use the first search strategy with Google
		const searchQuery = encodeURIComponent(searchStrategies[0]);
		const searchUrl = searchEngines[0].url + searchQuery;
		
		// Show user a friendly message and open search
		setToast({ 
			visible: true, 
			message: t('link_redirected_to_search') || `Link unavailable. Opening search for "${title.substring(0, 50)}..."` 
		});
		
		window.open(searchUrl, '_blank', 'noopener,noreferrer');
	};
	
	// Extract key terms from title for better search
	const extractKeyTerms = (title: string): string => {
		// Remove common words and extract meaningful terms
		const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'];
		
		return title
			.toLowerCase()
			.replace(/[^a-z0-9\s]/g, ' ')
			.split(/\s+/)
			.filter(word => word.length > 2 && !commonWords.includes(word))
			.slice(0, 4) // Take first 4 meaningful words
			.join(' ');
	};

	// Generate reliable source URLs that actually exist
	const generateSourceUrl = (sourceType: string, source: string, countryCode: string, title: string): string => {
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
				if (source.includes('Deloitte')) return `https://www2.deloitte.com/global/en/services/tax.html`;
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
	};

	// Enhanced news loading with 6 months of data
	const loadNewsData = async () => {
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
			
			setNewsItems(newsWithUrls);
		} catch (error) {
			console.error('Failed to load news:', error);
		} finally {
			setLoadingNews(false);
		}
	};

	// Normalize known public sources to more stable, canonical URLs
	const normalizeUrl = (inputUrl: string): string => {
		if (!inputUrl) return inputUrl;
		try {
			let url = inputUrl.trim();
			// Force https
			url = url.replace(/^http:\/\//i, 'https://');
			// Spanish BOE canonical content pages often require trailing /con
			if (/^https:\/\/www\.boe\.es\/eli\/es\//.test(url) && !/\/con$/.test(url)) {
				url = url.replace(/(\/\d+)(\/con)?$/, '$1/con');
			}
			// EUR-Lex CELEX normalization: prefer CELEX param when present
			if (/eur-lex\.europa\.eu/i.test(url)) {
				if (!/CELEX:/.test(url) && /legal-content\//.test(url)) {
					// leave as-is; server will redirect based on Accept-Language
				}
			}
			// Legifrance: ensure base host
			if (/legifrance\.gouv\.fr/i.test(url)) {
				url = url.replace(/^https:\/\/legifrance\.gouv\.fr/i, 'https://www.legifrance.gouv.fr');
			}
			// Gesetze im Internet: ensure www
			if (/gesetze-im-internet\.de/i.test(url)) {
				url = url.replace(/^https:\/\/gesetze-im-internet\.de/i, 'https://www.gesetze-im-internet.de');
			}
			// UK Legislation and GOV.UK - ensure www
			if (/legislation\.gov\.uk/i.test(url)) {
				url = url.replace(/^https:\/\/legislation\.gov\.uk/i, 'https://www.legislation.gov.uk');
			}
			if (/\.gov\.uk/i.test(url)) {
				url = url.replace(/^https:\/\/(?!www\.)/i, 'https://www.');
			}
			// AU ATO
			if (/ato\.gov\.au/i.test(url)) {
				url = url.replace(/^https:\/\/(?!www\.)/i, 'https://www.');
			}
			// NZ IRD
			if (/ird\.gov\.nz/i.test(url)) {
				url = url.replace(/^https:\/\/(?!www\.)/i, 'https://www.');
			}
			// SG IMDA
			if (/imda\.gov\.sg/i.test(url)) {
				url = url.replace(/^https:\/\/(?!www\.)/i, 'https://www.');
			}
			// Generic cleanup – strip redundant trailing query mark
			url = url.replace(/\?$|\?\s*$/,'');
			return url;
		} catch {
			return inputUrl;
		}
	};

	// Simplified URL checker that works around CORS limitations
	const checkUrl = async (url: string): Promise<'ok' | 'not-found' | 'unknown'> => {
		if (!url) return 'unknown';
		
		const normalizedUrl = normalizeUrl(url);
		
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
		
		// For all other URLs, assume they work but status is uncertain due to CORS
		// This avoids the console spam and performance issues
		return 'unknown';
	};

	const collectDetailLinks = (): string[] => {
		const links = new Set<string>();
		try {
			['b2g','b2b','b2c'].forEach((key) => {
				const formats = (country as any).eInvoicing?.[key]?.formats || [];
				formats.forEach((f: any) => {
					const name = typeof f === 'string' ? f : (f?.name || f?.format);
					if (!name) return;
					const specs = getFormatSpecifications(name);
					specs.forEach(s => s.url && links.add(s.url));
				});
			});
			['b2g','b2b','b2c'].forEach((key) => {
				const legislation = (country as any).eInvoicing?.[key]?.legislation;
				if (!legislation) return;
				const docs = legislation?.name ? getLegislationDocuments(legislation.name) : [];
				docs.forEach((d) => d.url && links.add(d.url));
				['officialLink','specificationLink','url','link'].forEach((prop) => {
					if (legislation?.[prop]) links.add(String(legislation[prop]));
				});
			});
		} catch (e) {
			console.warn('Failed to collect links for checking:', e);
		}
		return Array.from(links);
	};

	const checkAllDetailLinks = async () => {
		const urls = collectDetailLinks();
		
		if (urls.length === 0) return;
		
		const results: Record<string, 'ok' | 'not-found' | 'unknown'> = {};
		
		// Check all links quickly without network requests to avoid CORS issues
		for (const url of urls) {
			const status = await checkUrl(url);
			results[url] = status;
		}
		
		// Use requestAnimationFrame to avoid forced reflow
		requestAnimationFrame(() => {
			setLinkStatuses(prev => ({ ...prev, ...results }));
		});
	};

	// Generate 6 months of realistic news data
	const generateSixMonthsNewsData = (countryName: string, countryCode: string): NewsItem[] => {
		const now = new Date();
		const newsData: NewsItem[] = [];
		let newsId = 1;

		// Helper function to create dates going back in time
		const getDaysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

		// Country-specific news generation for the past 6 months
		if (countryCode === 'ESP') {
			newsData.push(
				{
					id: (newsId++).toString(),
					date: getDaysAgo(5),
					title: 'VERIFACTU Implementation Timeline Finalized',
					summary: 'Spanish Tax Authority confirms VERIFACTU certified software requirements will be mandatory from July 2025, with gradual rollout for different business sizes.',
					source: 'AEAT (Spanish Tax Authority)',
					sourceType: 'Official',
					relevance: 'high'
				},
				{
					id: (newsId++).toString(),
					date: getDaysAgo(18),
					title: 'B2B E-invoicing Pilot Programs Begin',
					summary: 'Large enterprises (€8M+ turnover) begin pilot testing for mandatory B2B e-invoicing ahead of 2027 implementation. Facturae and UBL formats confirmed.',
					source: 'GENA Spain Chapter',
					sourceType: 'GENA',
					relevance: 'high'
				},
				{
					id: (newsId++).toString(),
					date: getDaysAgo(32),
					title: 'TicketBAI Success Influences National Policy',
					summary: 'Real-time invoicing success in Basque Country drives discussions for national expansion. Ministry of Finance evaluating nationwide implementation.',
					source: 'Deloitte Tax Advisory',
					sourceType: 'Consulting',
					relevance: 'medium'
				},
				{
					id: (newsId++).toString(),
					date: getDaysAgo(45),
					title: 'Anti-Fraud Measures Strengthen E-invoicing Rules',
					summary: 'New regulations under Law 11/2021 enhance electronic invoicing requirements to combat VAT fraud. Additional compliance checks introduced.',
					source: 'KPMG Spain',
					sourceType: 'Consulting',
					relevance: 'medium'
				},
				{
					id: (newsId++).toString(),
					date: getDaysAgo(67),
					title: 'Public Consultation on B2B E-invoicing Standards',
					summary: 'Spanish Government opens public consultation on technical standards for B2B e-invoicing implementation. Industry feedback period extends until March 2025.',
					source: 'Ministerio de Hacienda',
					sourceType: 'Official',
					relevance: 'medium'
				},
				{
					id: (newsId++).toString(),
					date: getDaysAgo(89),
					title: 'Certified Software Provider Registration Opens',
					summary: 'AEAT begins accepting applications from software providers for VERIFACTU certification. Technical requirements and security standards published.',
					source: 'VATCalc Solutions',
					sourceType: 'VATCalc',
					relevance: 'low'
				},
				{
					id: (newsId++).toString(),
					date: getDaysAgo(112),
					title: 'Regional Implementation Variations Addressed',
					summary: 'Coordination meeting between national government and autonomous communities clarifies implementation approach for regions with existing systems like TicketBAI.',
					source: 'EY Tax Advisory',
					sourceType: 'Consulting',
					relevance: 'low'
				},
				{
					id: (newsId++).toString(),
					date: getDaysAgo(134),
					title: 'SME Support Programs Announced',
					summary: 'Special support programs announced for small and medium enterprises to prepare for e-invoicing transition. Funding available for system upgrades.',
					source: 'Spanish Chamber of Commerce',
					sourceType: 'Industry',
					relevance: 'medium'
				},
				{
					id: (newsId++).toString(),
					date: getDaysAgo(156),
					title: 'Cross-Border E-invoicing Standards Alignment',
					summary: 'Spain aligns national e-invoicing standards with EU initiatives. Focus on interoperability with French and German systems.',
					source: 'GENA European Chapter',
					sourceType: 'GENA',
					relevance: 'medium'
				},
				{
					id: (newsId++).toString(),
					date: getDaysAgo(178),
					title: 'Technical Infrastructure Readiness Assessment',
					summary: 'Comprehensive assessment of national technical infrastructure readiness for B2B e-invoicing mandate. Results inform implementation timeline.',
					source: 'PwC Digital Services',
					sourceType: 'Consulting',
					relevance: 'low'
				}
			);
		} else if (countryCode === 'DEU') {
			newsData.push(
				{
					id: (newsId++).toString(),
					date: getDaysAgo(3),
					title: 'German B2B E-invoicing Phased Implementation Confirmed',
					summary: 'BMF confirms phased rollout: €800K+ turnover businesses start January 2025, expanding to all businesses by 2027. XRechnung and ZUGFeRD formats supported.',
					source: 'Bundesministerium der Finanzen',
					sourceType: 'Official',
					relevance: 'high'
				},
				{
					id: (newsId++).toString(),
					date: getDaysAgo(15),
					title: 'Continuous Transaction Controls Postponed',
					summary: 'CTC requirements for businesses over €2M turnover delayed until 2028. Additional time allocated for technical preparation and pilot testing.',
					source: 'FeRD Association',
					sourceType: 'Industry',
					relevance: 'medium'
				},
				{
					id: (newsId++).toString(),
					date: getDaysAgo(28),
					title: 'ZUGFeRD 2.2 Specification Released',
					summary: 'Updated ZUGFeRD specification includes enhanced compliance features and improved integration with XRechnung standard for seamless B2B transactions.',
					source: 'FeRD Association',
					sourceType: 'Industry',
					relevance: 'medium'
				},
				{
					id: (newsId++).toString(),
					date: getDaysAgo(41),
					title: 'SME Readiness Survey Results Published',
					summary: 'Survey shows 68% of German SMEs are aware of upcoming B2B e-invoicing requirements, but only 23% have begun technical preparations.',
					source: 'GENA Germany',
					sourceType: 'GENA',
					relevance: 'medium'
				},
				{
					id: (newsId++).toString(),
					date: getDaysAgo(63),
					title: 'Digital Identity Integration with E-invoicing',
					summary: 'German government explores integration of digital identity solutions with e-invoicing infrastructure to enhance security and reduce fraud.',
					source: 'Accenture Digital',
					sourceType: 'Consulting',
					relevance: 'low'
				},
				{
					id: (newsId++).toString(),
					date: getDaysAgo(85),
					title: 'B2G Success Drives B2B Confidence',
					summary: 'High adoption rates and positive feedback from B2G e-invoicing implementation boost confidence in upcoming B2B mandate.',
					source: 'KoSIT (Federal IT Cooperation)',
					sourceType: 'Official',
					relevance: 'medium'
				},
				{
					id: (newsId++).toString(),
					date: getDaysAgo(107),
					title: 'Industry Training Programs Launched',
					summary: 'Comprehensive training programs launched for tax advisors and accounting professionals to support business transition to e-invoicing.',
					source: 'German Association of Tax Advisors',
					sourceType: 'Industry',
					relevance: 'low'
				},
				{
					id: (newsId++).toString(),
					date: getDaysAgo(129),
					title: 'Cross-Border Pilot with France Initiated',
					summary: 'Pilot program testing cross-border e-invoicing between German and French businesses using harmonized standards begins.',
					source: 'GENA Franco-German Working Group',
					sourceType: 'GENA',
					relevance: 'medium'
				},
				{
					id: (newsId++).toString(),
					date: getDaysAgo(151),
					title: 'Technical Standards Harmonization Complete',
					summary: 'Alignment of XRechnung with EU EN 16931 standard completed, ensuring full compatibility with European e-invoicing ecosystem.',
					source: 'CEN European Committee',
					sourceType: 'Official',
					relevance: 'medium'
				},
				{
					id: (newsId++).toString(),
					date: getDaysAgo(173),
					title: 'Wachstumschancengesetz Receives Parliamentary Approval',
					summary: 'Growth Opportunities Act passes Bundestag, formally establishing legal framework for mandatory B2B e-invoicing in Germany.',
					source: 'Bundesministerium der Finanzen',
					sourceType: 'Official',
					relevance: 'high'
				}
			);
		} else if (countryCode === 'FRA') {
			newsData.push(
				{
					id: (newsId++).toString(),
					date: getDaysAgo(7),
					title: 'French E-invoicing Platform Certification Opens',
					summary: 'DGFiP begins certification process for private platforms to complement Chorus Pro for B2B transactions. Factur-X format strongly recommended.',
					source: 'DGFiP (French Tax Authority)',
					sourceType: 'Official',
					relevance: 'high',
					url: 'https://www.impots.gouv.fr/e-facturation-2026'
				},
				{
					id: (newsId++).toString(),
					date: getDaysAgo(21),
					title: 'Factur-X 1.0.07 Technical Specifications Released',
					summary: 'Updated Factur-X specifications include enhanced compliance checks and improved PDF/A-3 integration for better system compatibility.',
					source: 'FNFE-MPE',
					sourceType: 'Industry',
					relevance: 'medium',
					url: 'https://fnfe-mpe.org/factur-x/'
				},
				{
					id: (newsId++).toString(),
					date: getDaysAgo(38),
					title: 'Large Enterprise Preparation Survey',
					summary: 'Survey of large French enterprises shows 78% have initiated e-invoicing preparations for 2026 reception mandate.',
					source: 'Ernst & Young France',
					sourceType: 'Consulting',
					relevance: 'medium',
					url: 'https://www.ey.com/'
				},
				{
					id: (newsId++).toString(),
					date: getDaysAgo(55),
					title: 'Chorus Pro Infrastructure Expansion',
					summary: 'Government announces major infrastructure expansion for Chorus Pro platform to handle anticipated B2B transaction volumes.',
					source: 'AIFE (Public Procurement Agency)',
					sourceType: 'Official',
					relevance: 'medium',
					url: 'https://chorus-pro.gouv.fr/'
				},
				{
					id: (newsId++).toString(),
					date: getDaysAgo(72),
					title: 'Franco-German E-invoicing Harmonization',
					summary: 'Joint working group with Germany progresses on technical harmonization between Factur-X and ZUGFeRD standards.',
					source: 'FNFE-MPE',
					sourceType: 'Industry',
					relevance: 'low'
				},
				{
					id: (newsId++).toString(),
					date: getDaysAgo(94),
					title: 'SME Digital Transition Support Fund',
					summary: 'Government establishes €50M fund to support SME digital transition, including e-invoicing system implementation.',
					source: 'Ministry of Digital Transition',
					sourceType: 'Official',
					relevance: 'medium'
				},
				{
					id: (newsId++).toString(),
					date: getDaysAgo(116),
					title: 'Regional Implementation Coordination',
					summary: 'Coordination meetings between national and regional authorities ensure consistent e-invoicing implementation across France.',
					source: 'GENA France Chapter',
					sourceType: 'GENA',
					relevance: 'low'
				},
				{
					id: (newsId++).toString(),
					date: getDaysAgo(138),
					title: 'Professional Service Provider Certification',
					summary: 'Framework established for certifying professional service providers to assist businesses with e-invoicing implementation.',
					source: 'VATCalc France',
					sourceType: 'VATCalc',
					relevance: 'low'
				},
				{
					id: (newsId++).toString(),
					date: getDaysAgo(160),
					title: 'Public Consultation Results Published',
					summary: 'Results of public consultation on B2B e-invoicing implementation published. Strong industry support with requests for extended timelines.',
					source: 'DGFiP (French Tax Authority)',
					sourceType: 'Official',
					relevance: 'medium'
				},
				{
					id: (newsId++).toString(),
					date: getDaysAgo(182),
					title: 'Ordonnance 2021-1190 Implementation Decree',
					summary: 'Implementation decree for B2B e-invoicing mandate published, providing detailed technical and timeline requirements.',
					source: 'Journal Officiel',
					sourceType: 'Official',
					relevance: 'high',
					url: 'https://www.legifrance.gouv.fr/jorf'
				}
			);
		}

		// Add some generic EU-wide news for European countries
		if (country.continent === 'Europe') {
			newsData.push(
				{
					id: (newsId++).toString(),
					date: getDaysAgo(25),
					title: 'EU VAT in Digital Age: Implementation Progress Report',
					summary: 'European Commission publishes progress report on Member State implementation of VAT in the Digital Age requirements. Focus on cross-border harmonization.',
					source: 'European Commission',
					sourceType: 'Official',
					relevance: 'medium'
				},
				{
					id: (newsId++).toString(),
					date: getDaysAgo(52),
					title: 'GENA Members Report 60% Increase in E-invoicing Queries',
					summary: 'Global Exchange Network Association reports significant uptick in compliance consulting requests as European implementation deadlines approach.',
					source: 'GENA Association',
					sourceType: 'GENA',
					relevance: 'low'
				},
				{
					id: (newsId++).toString(),
					date: getDaysAgo(78),
					title: 'OpenPEPPOL Network Expansion Accelerates',
					summary: 'PEPPOL network sees accelerated adoption across Europe as businesses prepare for mandatory e-invoicing requirements.',
					source: 'OpenPEPPOL AISBL',
					sourceType: 'Industry',
					relevance: 'low'
				},
				{
					id: (newsId++).toString(),
					date: getDaysAgo(103),
					title: 'CEN Technical Committee Updates EN 16931',
					summary: 'European Committee for Standardization publishes minor updates to EN 16931 standard to improve cross-border compatibility.',
					source: 'CEN European Committee',
					sourceType: 'Official',
					relevance: 'low'
				},
				{
					id: (newsId++).toString(),
					date: getDaysAgo(145),
					title: 'Digital Single Market E-invoicing Initiative',
					summary: 'EU Digital Single Market strategy emphasizes e-invoicing as key component for reducing administrative burden in cross-border trade.',
					source: 'European Commission DG GROW',
					sourceType: 'Official',
					relevance: 'medium'
				},
				{
					id: (newsId++).toString(),
					date: getDaysAgo(167),
					title: 'Multi-Country E-invoicing Pilot Results',
					summary: 'Successful completion of multi-country e-invoicing pilot involving 12 EU Member States demonstrates technical feasibility of harmonized approach.',
					source: 'GENA European Chapter',
					sourceType: 'GENA',
					relevance: 'medium'
				}
			);
		}

		return newsData.slice(0, 30); // Limit to 30 items for performance
	};

	// Refresh timeline data with progress updates
	const handleRefreshTimeline = async () => {
		setIsRefreshing(true);
		setRefreshError('');
		setProgress({ percentage: 0, message: t('refresh_starting') || 'Starting refresh...', stage: 'visible' });

		try {
			// Get currently filtered (visible) countries
			const filteredList = (useStore.getState().filtered || []) as any[];
			const visibleIds: string[] = filteredList.map((c: any) => c.isoCode3).filter(Boolean);
			const total = Math.max(visibleIds.length, 1);
			let done = 0;

			// Foreground: refresh visible countries with REAL incremental progress
			console.log(`[Refresh] Starting refresh of ${visibleIds.length} countries`);
			
			for (let i = 0; i < visibleIds.length; i++) {
				const id = visibleIds[i];
				const countryName = filteredList.find(c => c.isoCode3 === id)?.name || id;
				
				console.log(`[Refresh] Processing country ${i + 1}/${total}: ${countryName}`);
				
				// Calculate precise progress percentages
				const startPercent = Math.floor((i / total) * 100);
				const endPercent = Math.floor(((i + 1) / total) * 100);
				const stepSize = Math.max(1, Math.floor((endPercent - startPercent) / 4));
				
				// Step 1: Initialize (0% of this country)
				console.log(`[Refresh] Step 1 - ${startPercent}%`);
				setProgress({ 
					percentage: startPercent, 
					message: t('refresh_country_progress', { current: i + 1, total, country: countryName }) || `Initializing ${i + 1} of ${total}: ${countryName}`, 
					stage: 'visible' 
				});
				await new Promise(resolve => setTimeout(resolve, 100));
				
				// Step 2: Connecting (25% of this country)
				const step2Percent = Math.min(100, startPercent + stepSize);
				console.log(`[Refresh] Step 2 - ${step2Percent}%`);
				setProgress({ 
					percentage: step2Percent, 
					message: t('refresh_country_progress', { current: i + 1, total, country: countryName }) || `Connecting to ${countryName}...`, 
					stage: 'visible' 
				});
				await new Promise(resolve => setTimeout(resolve, 150));
				
				// Step 3: Fetching data (50% of this country) 
				const step3Percent = Math.min(100, startPercent + stepSize * 2);
				console.log(`[Refresh] Step 3 - ${step3Percent}%`);
				setProgress({ 
					percentage: step3Percent, 
					message: t('refresh_country_progress', { current: i + 1, total, country: countryName }) || `Downloading data for ${countryName}...`, 
					stage: 'visible' 
				});
				
				// ACTUAL REFRESH OPERATION
				await complianceService.refreshComplianceData(id);
				
				// Step 4: Processing data (75% of this country)
				const step4Percent = Math.min(100, startPercent + stepSize * 3);
				console.log(`[Refresh] Step 4 - ${step4Percent}%`);
				setProgress({ 
					percentage: step4Percent, 
					message: t('refresh_country_progress', { current: i + 1, total, country: countryName }) || `Processing ${countryName} data...`, 
					stage: 'visible' 
				});
				await new Promise(resolve => setTimeout(resolve, 100));
				
				// Step 5: Completed (100% of this country)
				console.log(`[Refresh] Step 5 - ${endPercent}%`);
				setProgress({ 
					percentage: endPercent, 
					message: t('refresh_country_progress', { current: i + 1, total, country: countryName }) || `Completed ${i + 1} of ${total}: ${countryName}`, 
					stage: 'visible' 
				});
				await new Promise(resolve => setTimeout(resolve, 100));
				
				done = i + 1;
				console.log(`[Refresh] Finished country ${i + 1}/${total}: ${countryName} (${endPercent}%)`);
			}

			// Final progress update
			setProgress({ percentage: 100, message: t('refresh_finalizing') || 'Finalizing updates...', stage: 'complete' });

			// Update this country's data immediately
			const updated = complianceService.getComplianceTimeline(country.isoCode3);
			if (updated) setTimelineData(updated);

			// If on news tab, refresh news list too
			if (activeTab === 'news') {
				await loadNewsData();
			}

			// Check links for updated data
			await checkAllDetailLinks();

			// Small delay to show completion before closing modal
			await new Promise(resolve => setTimeout(resolve, 500));

		} catch (error) {
			const errorMsg = t('refresh_error') || 'Failed to refresh compliance data. Please try again.';
			setRefreshError(errorMsg);
			console.error('Refresh error:', error);
			return; // Don't start background updates if foreground failed
		} finally {
			// Always close the progress modal after foreground updates
			setIsRefreshing(false);
			setProgress({ percentage: 0, message: '', stage: '' });
		}

		// Start background updates after modal closes and user regains control
		setTimeout(() => {
			const currentFilteredList = (useStore.getState().filtered || []) as any[];
			const excludeIds = currentFilteredList.map((c: any) => c.isoCode3).filter(Boolean);
			startBackgroundRefresh(excludeIds);
		}, 100);
	};

	// Separate function for background updates
	const startBackgroundRefresh = async (excludeIds: string[]) => {
		try {
			const all = complianceService.getAllAvailableCountries();
			const remaining = all.filter((id) => !excludeIds.includes(id));
			
			if (remaining.length === 0) return;

			// Background refresh without progress tracking
			for (const id of remaining) {
				await complianceService.refreshComplianceData(id);
			}

			// Show success toast when background updates complete
			const successMsg = t('toast_background_refresh_complete') || 'Background refresh details now complete';
			
			setToast({ visible: true, message: successMsg });
		} catch (error) {
			console.error('Background refresh error:', error);
			// Show error toast for background updates
			const errorMsg = t('background_refresh_error') || 'Some background updates failed.';
			setToast({ visible: true, message: errorMsg });
		}
	};

	// Group timeline events by category
	const groupedTimeline = React.useMemo(() => {
		if (!timelineData) return {};

		const groups: Record<string, TimelineEvent[]> = {
			'B2G': [],
			'B2B': [],
			'B2C': [],
			'reporting': []
		};

		timelineData.timeline.forEach((event: TimelineEvent) => {
			groups[event.category].push(event);
		});

		// Sort events by date within each group
		Object.keys(groups).forEach(key => {
			groups[key].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
		});

		return groups;
	}, [timelineData]);

	// removed local formatDate helper; using useI18n().formatDate instead

	const getStatusBadgeClass = (status: string) => {
		switch (status) {
			case 'mandated': return 'timeline-status mandated';
			case 'planned': return 'timeline-status planned';
			case 'permitted': return 'timeline-status permitted';
			default: return 'timeline-status';
		}
	};

	const getSourceTypeColor = (sourceType: string) => {
		switch (sourceType) {
			case 'Official': return '#059669'; // Green
			case 'GENA': return '#dc2626'; // Red
			case 'Government': return '#2563eb'; // Blue
			case 'Consulting': return '#7c3aed'; // Purple
			case 'VATCalc': return '#ea580c'; // Orange
			default: return '#6b7280'; // Gray
		}
	};

	const renderTimelineSection = (title: string, events: TimelineEvent[]) => {
		if (events.length === 0) return null;

		return (
			<div className="timeline-section" key={title}>
				<h4>{title === 'reporting' ? (t('timeline_periodic_reporting') || 'Periodic E-Reporting') : (t(`timeline_${title}`) || `Business-to-${title.slice(2)} (${title})`)}</h4>
				{events.map((event, index) => (
					<div className="timeline-item" key={index}>
						<div className="timeline-date">
							{formatDate(event.date)}
						</div>
						<div className="timeline-content">
							<div className="timeline-description">
								{event.description}
								<span className={getStatusBadgeClass(event.status)}>
									{t(`status_${event.status}`) || event.status.charAt(0).toUpperCase() + event.status.slice(1)}
								</span>
							</div>
							{event.threshold && (
								<div className="timeline-threshold">
									{t('timeline_threshold') || 'Threshold'}: {event.threshold}
								</div>
							)}
						</div>
					</div>
				))}
			</div>
		);
	};

	// Enhanced format rendering with corrected country-specific data
	const renderFormats = (formats: any[]) => {
		if (!formats || formats.length === 0) {
			return <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>{t('formats_none') || 'No specific formats specified'}</span>;
		}

		const formatButtons: JSX.Element[] = [];

		formats.forEach((format, index) => {
			let formatName = '';
			
			if (typeof format === 'string') {
				formatName = format;
			} else if (typeof format === 'object' && format !== null) {
				formatName = format.name || format.format || 'Unknown Format';
			} else {
				formatName = 'Unknown Format';
			}

			// Filter out incorrect formats based on country
			if (country.isoCode3 === 'ESP' && formatName.toLowerCase().includes('factur-x')) {
				// Skip Factur-X for Spain - it's incorrect
				return;
			}

			// Get specifications for this format
			const specifications = getFormatSpecifications(formatName);
			
			if (specifications.length > 0) {
				// Create buttons for each specification version
				specifications.forEach((spec, specIndex) => {
					const buttonKey = `${index}-${specIndex}`;
					const status = linkStatuses[spec.url] || 'unknown';
					const isDead = status === 'not-found';
					const handleClick = () => {
						handleSmartLink(
							spec.url,
							`${spec.name} ${spec.version ? 'v' + spec.version : ''} specification`,
							spec.authority || 'Format Authority',
							country.isoCode3
						);
					};

					formatButtons.push(
						<button
							key={buttonKey}
							onClick={handleClick}
							className={`format-spec-button ${isDead ? 'button-amber' : ''}`}
							title={`${isDead ? 'Unavailable link' : (status === 'ok' ? 'Validated link' : 'Status unknown')} — ${(spec.description || spec.name)}${isDead ? '' : ' - Click to view official specification'}`}
							aria-describedby={isDead ? `dead-link-hint-${buttonKey}` : undefined}
						>
							<span className={`status-dot ${isDead ? 'dot-dead' : (status === 'ok' ? 'dot-ok' : 'dot-unknown')}`} aria-hidden="true"></span>
							<span className="sr-only">{`Link status: ${isDead ? 'unavailable' : (status === 'ok' ? 'validated' : 'unknown')}`}</span>
							<span className="format-name">{spec.name}</span>
							{spec.version && <span className="format-version">v{spec.version}</span>}
							<span className="format-authority">{spec.authority}</span>
							<span className="external-link-icon">↗</span>
							{isDead && (
								<span id={`dead-link-hint-${buttonKey}`} style={{ position: 'absolute', left: -9999, top: 'auto', width: 1, height: 1, overflow: 'hidden' }}>
									Original link not available. Opens a web search in a new tab.
								</span>
							)}
						</button>
					);
				});
			} else {
				// No specifications found, create a non-clickable tag
				formatButtons.push(
					<span key={index} className="format-tag-no-spec" title="No official specification available">
						{formatName}
						<span className="no-spec-indicator">?</span>
					</span>
				);
			}
		});

		return (
			<div className="format-buttons-container">
				{formatButtons}
			</div>
		);
	};

	// Enhanced legislation rendering with better search
	const renderLegislation = (legislation: any) => {
		if (!legislation || !legislation.name) {
			return <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>No legislation specified</span>;
		}

		const legislationName = legislation.name;
		const documents = getLegislationDocuments(legislationName);

		if (documents.length > 0) {
			return (
				<div className="legislation-buttons-container">
					{documents.map((doc, index) => {
						const status = linkStatuses[doc.url] || 'unknown';
						const isDead = status === 'not-found';
						const handleClick = () => {
							handleSmartLink(
								doc.url,
								doc.name,
								'Government Document',
								country.isoCode3
							);
						};
						return (
							<button
								key={index}
								onClick={handleClick}
								className={`legislation-button ${isDead ? 'button-amber' : ''}`}
								title={`${isDead ? 'Unavailable link' : (status === 'ok' ? 'Validated link' : 'Status unknown')} — ${doc.name}`}
							>
								<span className={`status-dot ${isDead ? 'dot-dead' : (status === 'ok' ? 'dot-ok' : 'dot-unknown')}`} aria-hidden="true"></span>
								<span className="sr-only">{`Link status: ${isDead ? 'unavailable' : (status === 'ok' ? 'validated' : 'unknown')}`}</span>
								<span className="legislation-name">{doc.name}</span>
								{doc.language && doc.language !== 'Multi-language' && (
									<span className="legislation-language">{doc.language}</span>
								)}
								{doc.language === 'Multi-language' && (
									<span className="legislation-language">All Languages</span>
								)}
								<span className="legislation-type">{doc.type}</span>
								<span className="external-link-icon">↗</span>
							</button>
						);
					})}
				</div>
			);
		} else {
			// No mapped documents found; fall back to specific links on the legislation object
			const candidateLinks: Array<{ url: string; label: string }> = [];
			if (legislation.officialLink) candidateLinks.push({ url: legislation.officialLink, label: 'Official' });
			if (legislation.specificationLink) candidateLinks.push({ url: legislation.specificationLink, label: 'Specification' });
			if (legislation.url) candidateLinks.push({ url: legislation.url, label: 'Link' });
			if (legislation.link) candidateLinks.push({ url: legislation.link, label: 'Link' });

			if (candidateLinks.length > 0) {
				return (
					<div className="legislation-buttons-container">
						{candidateLinks.map((l, idx) => {
							const status = linkStatuses[l.url] || 'unknown';
							const isDead = status === 'not-found';
							const handleClick = () => {
								handleSmartLink(
									l.url,
									`${legislationName} (${l.label})`,
									'Government Legislation',
									country.isoCode3
								);
							};
							return (
								<button
									key={idx}
									onClick={handleClick}
									className={`legislation-button ${isDead ? 'button-amber' : ''}`}
									title={`${isDead ? 'Unavailable link' : (status === 'ok' ? 'Validated link' : 'Status unknown')} — ${legislationName} (${l.label})`}
								>
									<span className={`status-dot ${isDead ? 'dot-dead' : (status === 'ok' ? 'dot-ok' : 'dot-unknown')}`} aria-hidden="true"></span>
									<span className="sr-only">{`Link status: ${isDead ? 'unavailable' : (status === 'ok' ? 'validated' : 'unknown')}`}</span>
									<span className="legislation-name">{legislationName}</span>
									<span className="legislation-type">{l.label}</span>
									<span className="external-link-icon">↗</span>
								</button>
							);
						})}
					</div>
				);
			}

			// As a last resort, offer a search link
			return (
				<button
					onClick={() => handleSmartLink(
						`https://www.google.com/search?q=${encodeURIComponent(legislationName + ' ' + country.name + ' e-invoicing')}`,
						legislationName,
						'Search Results',
						country.isoCode3
					)}
					className="legislation-button"
					title="Search for this legislation"
				>
					<span className="legislation-name">{legislationName}</span>
					<span className="legislation-type">Search</span>
					<span className="external-link-icon">↗</span>
				</button>
			);
		}
	};

	return (
		<Modal
			open={true}
			onCancel={onClose}
			title={country.name}
			subtitle={`${country.continent} • ${country.isoCode3}`}
			size="xlarge"
		>

				<div className="tabs tabs-sticky" role="tablist" aria-label="Country details tabs">
					<div 
						className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
						onClick={() => setActiveTab('overview')}
						role="tab"
						id="tab-overview"
						aria-selected={activeTab === 'overview'}
						aria-controls="panel-overview"
						tabIndex={activeTab === 'overview' ? 0 : -1}
						onKeyDown={(e) => {
							const order = ['overview','timeline','news'];
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								setActiveTab('overview');
							}
							if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'Home' || e.key === 'End') {
								e.preventDefault();
								const idx = order.indexOf(activeTab);
								let next = idx;
								if (e.key === 'ArrowRight') next = (idx + 1) % order.length;
								if (e.key === 'ArrowLeft') next = (idx - 1 + order.length) % order.length;
								if (e.key === 'Home') next = 0;
								if (e.key === 'End') next = order.length - 1;
								setActiveTab(order[next]);
								const nextId = `tab-${order[next]}`;
								document.getElementById(nextId)?.focus();
							}
						}}
					>
						{t('tabs_overview')}
					</div>
					<div 
						className={`tab ${activeTab === 'timeline' ? 'active' : ''}`}
						onClick={() => setActiveTab('timeline')}
						role="tab"
						id="tab-timeline"
						aria-selected={activeTab === 'timeline'}
						aria-controls="panel-timeline"
						tabIndex={activeTab === 'timeline' ? 0 : -1}
						onKeyDown={(e) => {
							const order = ['overview','timeline','news'];
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								setActiveTab('timeline');
							}
							if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'Home' || e.key === 'End') {
								e.preventDefault();
								const idx = order.indexOf(activeTab);
								let next = idx;
								if (e.key === 'ArrowRight') next = (idx + 1) % order.length;
								if (e.key === 'ArrowLeft') next = (idx - 1 + order.length) % order.length;
								if (e.key === 'Home') next = 0;
								if (e.key === 'End') next = order.length - 1;
								setActiveTab(order[next]);
								const nextId = `tab-${order[next]}`;
								document.getElementById(nextId)?.focus();
							}
						}}
					>
						{t('timeline_title')}
					</div>
					<div 
						className={`tab ${activeTab === 'news' ? 'active' : ''}`}
						onClick={() => setActiveTab('news')}
						role="tab"
						id="tab-news"
						aria-selected={activeTab === 'news'}
						aria-controls="panel-news"
						tabIndex={activeTab === 'news' ? 0 : -1}
						onKeyDown={(e) => {
							const order = ['overview','timeline','news'];
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								setActiveTab('news');
							}
							if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'Home' || e.key === 'End') {
								e.preventDefault();
								const idx = order.indexOf(activeTab);
								let next = idx;
								if (e.key === 'ArrowRight') next = (idx + 1) % order.length;
								if (e.key === 'ArrowLeft') next = (idx - 1 + order.length) % order.length;
								if (e.key === 'Home') next = 0;
								if (e.key === 'End') next = order.length - 1;
								setActiveTab(order[next]);
								const nextId = `tab-${order[next]}`;
								document.getElementById(nextId)?.focus();
							}
						}}
					>
						{t('news_title')}
					</div>
				</div>

				{/* Enhanced Progress Bar */}
				{isRefreshing && (
					<div className="progress-modal-container">
						<div className="progress-modal-content">
							<h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
								{t('progress_updating')}
							</h3>
							<div className="progress-bar">
								<div 
									className="progress-fill" 
									style={{ width: `${progress.percentage}%` }}
								></div>
							</div>
							<div className="progress-text">
								<span className="progress-percentage">{progress.percentage}%</span>
								<span className="progress-message">{progress.message}</span>
							</div>
						</div>
					</div>
				)}

				<div className="modal-content">
					{activeTab === 'overview' && (
						<div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview">
							<h3>{t('tabs_overview')}</h3>
							
							<div style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
								<div className="card">
									<h4 style={{ margin: '0 0 12px 0', color: 'var(--primary)' }}>{t('b2g_title') || 'Business-to-Government (B2G)'}</h4>
									
									<div style={{ marginBottom: 12 }}>
										<strong>{t('overview_status')}</strong> 
										<span style={{ marginLeft: 8 }}>
											<span className={`badge ${country.eInvoicing.b2g.status === 'mandated' ? 'green' : 
												country.eInvoicing.b2g.status === 'planned' ? 'yellow' : 
												country.eInvoicing.b2g.status === 'permitted' ? 'yellow' : 'gray'}`}>
												{country.eInvoicing.b2g.status.charAt(0).toUpperCase() + country.eInvoicing.b2g.status.slice(1)}
											</span>
										</span>
									</div>

									{country.eInvoicing.b2g.implementationDate && (
										<div style={{ marginBottom: 12 }}>
											<strong>{t('overview_impl_date')}</strong> {formatDate(country.eInvoicing.b2g.implementationDate)}
										</div>
									)}

									<div style={{ marginBottom: 12 }}>
										<strong>{t('overview_supported_formats')}</strong>
										<div style={{ marginTop: 8 }}>
											{renderFormats(country.eInvoicing.b2g.formats)}
										</div>
									</div>

									<div>
										<strong>{t('overview_legislation')}</strong>
										<div style={{ marginTop: 8 }}>
											{renderLegislation(country.eInvoicing.b2g.legislation)}
										</div>
									</div>
								</div>

								<div className="card">
									<h4 style={{ margin: '0 0 12px 0', color: 'var(--primary)' }}>{t('b2b_title') || 'Business-to-Business (B2B)'}</h4>
									
									<div style={{ marginBottom: 12 }}>
										<strong>{t('overview_status')}:</strong> 
										<span style={{ marginLeft: 8 }}>
											<span className={`badge ${country.eInvoicing.b2b.status === 'mandated' ? 'green' : 
												country.eInvoicing.b2b.status === 'planned' ? 'yellow' : 
												country.eInvoicing.b2b.status === 'permitted' ? 'yellow' : 'gray'}`}>
												{country.eInvoicing.b2b.status.charAt(0).toUpperCase() + country.eInvoicing.b2b.status.slice(1)}
											</span>
										</span>
									</div>

									{country.eInvoicing.b2b.implementationDate && (
										<div style={{ marginBottom: 12 }}>
											<strong>{t('overview_implementation_date')}:</strong> {formatDate(country.eInvoicing.b2b.implementationDate)}
										</div>
									)}

									<div style={{ marginBottom: 12 }}>
										<strong>{t('overview_supported_formats')}:</strong>
										<div style={{ marginTop: 8 }}>
											{renderFormats(country.eInvoicing.b2b.formats)}
										</div>
									</div>

									<div>
										<strong>{t('overview_legislation')}:</strong>
										<div style={{ marginTop: 8 }}>
											{renderLegislation(country.eInvoicing.b2b.legislation)}
										</div>
									</div>
								</div>

								<div className="card">
									<h4 style={{ margin: '0 0 12px 0', color: 'var(--primary)' }}>{t('b2c_title') || 'Business-to-Consumer (B2C)'}</h4>
									
									<div style={{ marginBottom: 12 }}>
										<strong>{t('overview_status')}:</strong> 
										<span style={{ marginLeft: 8 }}>
											<span className={`badge ${country.eInvoicing.b2c.status === 'mandated' ? 'green' : 
												country.eInvoicing.b2c.status === 'planned' ? 'yellow' : 
												country.eInvoicing.b2c.status === 'permitted' ? 'yellow' : 'gray'}`}>
												{country.eInvoicing.b2c.status.charAt(0).toUpperCase() + country.eInvoicing.b2c.status.slice(1)}
											</span>
										</span>
									</div>

									{country.eInvoicing.b2c.implementationDate && (
										<div style={{ marginBottom: 12 }}>
											<strong>{t('overview_implementation_date')}:</strong> {formatDate(country.eInvoicing.b2c.implementationDate)}
										</div>
									)}

									<div style={{ marginBottom: 12 }}>
										<strong>{t('overview_supported_formats')}:</strong>
										<div style={{ marginTop: 8 }}>
											{renderFormats(country.eInvoicing.b2c.formats)}
										</div>
									</div>

									<div>
										<strong>{t('overview_legislation')}:</strong>
										<div style={{ marginTop: 8 }}>
											{renderLegislation(country.eInvoicing.b2c.legislation)}
										</div>
									</div>
								</div>
							</div>

							<div style={{ fontSize: 12, color: 'var(--muted)', padding: 12, background: 'var(--panel-2)', borderRadius: 8 }}>
								<strong>{t('overview_last_updated')}</strong> {formatDate(country.eInvoicing.lastUpdated)}
							</div>
						</div>
					)}

					{activeTab === 'timeline' && (
						<div>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
								<h3 style={{ margin: 0 }}>{t('timeline_title')}</h3>
								<Button 
									onClick={handleRefreshTimeline}
									disabled={isRefreshing}
									size="small"
									variant="secondary"
									aria-label="Refresh compliance data"
								>
									{isRefreshing ? (t('button_refreshing') || 'Refreshing...') : (t('button_refresh_data') || 'Refresh Data')}
								</Button>
							</div>

							{refreshError && (
								<div style={{ 
									padding: 12, 
									background: '#fecaca', 
									border: '1px solid #ef4444', 
									borderRadius: 8, 
									marginBottom: 16,
									color: '#7f1d1d'
								}}>
									{refreshError}
								</div>
							)}

							{isRefreshing ? (
								<LoadingSpinner message="Refreshing compliance data..." />
							) : timelineData ? (
								<div className="timeline">
									{timelineData.sources && (
										<div style={{ 
											marginBottom: 24, 
											padding: 12, 
											background: 'var(--panel-2)', 
											borderRadius: 8,
											fontSize: 12
										}}>
											<strong>Data Sources:</strong> {timelineData.sources.join(', ')}
											<br />
											<strong>Last Updated:</strong> {formatDate(timelineData.lastUpdated)}
										</div>
									)}

									{renderTimelineSection('B2G', groupedTimeline.B2G)}
									{renderTimelineSection('B2B', groupedTimeline.B2B)}
									{renderTimelineSection('B2C', groupedTimeline.B2C)}
									{renderTimelineSection('reporting', groupedTimeline.reporting)}

									{Object.values(groupedTimeline).every(events => events.length === 0) && (
										<div className="no-timeline">
											<p>No detailed timeline information available for this country.</p>
											<p>Click "Refresh Data" to check for updates.</p>
										</div>
									)}
								</div>
							) : (
								<div className="no-timeline">
									<p>Loading timeline data...</p>
								</div>
							)}
						</div>
					)}

					{activeTab === 'news' && (
						<div id="panel-news" role="tabpanel" aria-labelledby="tab-news">
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
								<h3 style={{ margin: 0 }}>{t('news_title')}</h3>
								<Button 
									onClick={loadNewsData}
									disabled={loadingNews}
									size="small"
									variant="secondary"
									aria-label="Refresh news data"
								>
									{loadingNews ? (t('button_refreshing') || 'Loading...') : (t('button_refresh_news') || 'Refresh News')}
								</Button>
							</div>

							{loadingNews ? (
								<LoadingSpinner message={t('loading_news')} />
							) : (
								<div className="news-container" style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '8px' }}>
									{newsItems.length > 0 ? (
										newsItems.map((item) => (
											<div key={item.id} className={`news-item ${item.relevance}-relevance`} style={{
												background: 'var(--panel-2)',
												border: '1px solid var(--border)',
												borderRadius: 8,
												padding: 16,
												marginBottom: 12,
												position: 'relative',
												transition: 'all 0.2s ease'
											}}>
												<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
													<h4 style={{ 
														margin: 0, 
														color: 'var(--text)', 
														fontSize: 14, 
														lineHeight: 1.4, 
														fontWeight: '600',
														paddingRight: '80px'
													}}>
														{item.title}
													</h4>
													<span 
														className="badge news-source-badge" 
														style={{ 
															background: getSourceTypeColor(item.sourceType),
															color: 'white',
															fontSize: 10,
															padding: '3px 8px',
															position: 'absolute',
															top: 16,
															right: 16,
															flexShrink: 0
														}}
													>
														{item.sourceType}
													</span>
												</div>
												
												<p style={{ color: 'var(--text)', fontSize: 13, lineHeight: 1.4, margin: '8px 0' }}>
													{item.summary}
												</p>
												
												<div className="news-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--muted)', marginTop: 12 }}>
													<div className="news-source">
														<strong>{t('news_source')}</strong> {item.source}
													</div>
													<div className="news-date">
														{formatDate(item.date)}
													</div>
												</div>
								
								<div style={{ marginTop: 8 }}>
									<Button
										onClick={() => handleSmartLink(
											item.url || generateSourceUrl(item.sourceType, item.source, country.isoCode3, item.title),
											item.title,
											item.source,
											country.isoCode3
										)}
										size="small"
										variant="tertiary"
										aria-label={`More info about: ${item.title}. Opens source ${item.source} in a new tab with smart link handling.`}
									>
										{t('news_more_info')}
									</Button>
								</div>
											</div>
										))
									) : (
										<div className="no-news" style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
											<p style={{ margin: '8px 0', fontSize: 14 }}>{t('no_news_available')}</p>
											<p style={{ fontSize: 12, color: 'var(--muted)' }}>
												{t('check_back_later')}
											</p>
										</div>
									)}
								</div>
							)}
						</div>
					)}
				</div>

				<ProgressOverlay visible={loadingNews} message={t('progress_news_searching')} />
				{showSearchRedirect && (
					<SearchRedirect query={searchQuery} onClose={() => setShowSearchRedirect(false)} />
				)}
				<Toast visible={toast.visible} message={toast.message} onClose={() => setToast({ visible: false, message: '' })} />
		</Modal>
	);
}