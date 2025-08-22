import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useRef } from 'react';
import { ComplianceDataService } from '../../services/complianceDataService';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { getFormatSpecifications, getLegislationDocuments } from '../../data/formatSpecifications';
import { ProgressOverlay } from '../common/ProgressOverlay';
import { SearchRedirect } from '../common/SearchRedirect';
import { useI18n } from '../../i18n';
import { Toast } from '../common/Toast';
import { useStore } from '../../store/useStore';
export function CountryDetail({ country, onClose }) {
    const { t, formatDate } = useI18n();
    const [activeTab, setActiveTab] = useState('overview');
    const [timelineData, setTimelineData] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshError, setRefreshError] = useState('');
    const [progress, setProgress] = useState({ percentage: 0, message: '', stage: '' });
    const [newsItems, setNewsItems] = useState([]);
    const [loadingNews, setLoadingNews] = useState(false);
    const [linkStatuses, setLinkStatuses] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchRedirect, setShowSearchRedirect] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '' });
    // Focus management & trap within modal
    const modalRef = useRef(null);
    const previouslyFocusedRef = useRef(null);
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
            // After loading, proactively check all detail links
            queueMicrotask(() => {
                checkAllDetailLinks();
            });
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
        previouslyFocusedRef.current = document.activeElement || null;
        const container = modalRef.current;
        const focusFirst = () => {
            if (!container)
                return;
            const first = container.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            first?.focus();
        };
        const handleKeyDown = (e) => {
            if (!container || e.key !== 'Tab')
                return;
            const focusable = Array.from(container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
                .filter(el => !el.hasAttribute('disabled'));
            if (focusable.length === 0)
                return;
            const firstEl = focusable[0];
            const lastEl = focusable[focusable.length - 1];
            const active = document.activeElement;
            if (e.shiftKey) {
                if (active === firstEl) {
                    e.preventDefault();
                    lastEl.focus();
                }
            }
            else {
                if (active === lastEl) {
                    e.preventDefault();
                    firstEl.focus();
                }
            }
        };
        focusFirst();
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            previouslyFocusedRef.current?.focus();
        };
    }, []);
    // Enhanced news loading with 6 months of data
    const loadNewsData = async () => {
        setLoadingNews(true);
        try {
            // Generate 6 months of news data
            const mockNews = generateSixMonthsNewsData(country.name, country.isoCode3);
            // Sort by date (newest first)
            mockNews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setNewsItems(mockNews);
        }
        catch (error) {
            console.error('Failed to load news:', error);
        }
        finally {
            setLoadingNews(false);
        }
    };
    // Normalize known public sources to more stable, canonical URLs
    const normalizeUrl = (inputUrl) => {
        if (!inputUrl)
            return inputUrl;
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
            url = url.replace(/\?$|\?\s*$/, '');
            return url;
        }
        catch {
            return inputUrl;
        }
    };
    // URL reachability checker (best-effort within browser constraints)
    const checkUrl = async (url) => {
        if (!url)
            return 'unknown';
        url = normalizeUrl(url);
        try {
            const headResp = await fetch(url, { method: 'HEAD', mode: 'cors', redirect: 'follow' });
            if (headResp.ok)
                return 'ok';
            if (headResp.status === 404)
                return 'not-found';
            return 'unknown';
        }
        catch (_) {
            try {
                await fetch(url, { method: 'GET', mode: 'no-cors' });
                return 'unknown';
            }
            catch {
                return 'unknown';
            }
        }
    };
    const collectDetailLinks = () => {
        const links = new Set();
        try {
            ['b2g', 'b2b', 'b2c'].forEach((key) => {
                const formats = country.eInvoicing?.[key]?.formats || [];
                formats.forEach((f) => {
                    const name = typeof f === 'string' ? f : (f?.name || f?.format);
                    if (!name)
                        return;
                    const specs = getFormatSpecifications(name);
                    specs.forEach(s => s.url && links.add(s.url));
                });
            });
            ['b2g', 'b2b', 'b2c'].forEach((key) => {
                const legislation = country.eInvoicing?.[key]?.legislation;
                if (!legislation)
                    return;
                const docs = legislation?.name ? getLegislationDocuments(legislation.name) : [];
                docs.forEach((d) => d.url && links.add(d.url));
                ['officialLink', 'specificationLink', 'url', 'link'].forEach((prop) => {
                    if (legislation?.[prop])
                        links.add(String(legislation[prop]));
                });
            });
        }
        catch (e) {
            console.warn('Failed to collect links for checking:', e);
        }
        return Array.from(links);
    };
    const checkAllDetailLinks = async () => {
        const urls = collectDetailLinks();
        if (urls.length === 0)
            return;
        const results = {};
        await Promise.all(urls.map(async (u) => {
            const status = await checkUrl(u);
            results[u] = status;
        }));
        setLinkStatuses(prev => ({ ...prev, ...results }));
    };
    // Generate 6 months of realistic news data
    const generateSixMonthsNewsData = (countryName, countryCode) => {
        const now = new Date();
        const newsData = [];
        let newsId = 1;
        // Helper function to create dates going back in time
        const getDaysAgo = (days) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
        // Country-specific news generation for the past 6 months
        if (countryCode === 'ESP') {
            newsData.push({
                id: (newsId++).toString(),
                date: getDaysAgo(5),
                title: 'VERIFACTU Implementation Timeline Finalized',
                summary: 'Spanish Tax Authority confirms VERIFACTU certified software requirements will be mandatory from July 2025, with gradual rollout for different business sizes.',
                source: 'AEAT (Spanish Tax Authority)',
                sourceType: 'Official',
                url: 'https://www.agenciatributaria.es/',
                relevance: 'high'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(18),
                title: 'B2B E-invoicing Pilot Programs Begin',
                summary: 'Large enterprises (€8M+ turnover) begin pilot testing for mandatory B2B e-invoicing ahead of 2027 implementation. Facturae and UBL formats confirmed.',
                source: 'GENA Spain Chapter',
                sourceType: 'GENA',
                relevance: 'high'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(32),
                title: 'TicketBAI Success Influences National Policy',
                summary: 'Real-time invoicing success in Basque Country drives discussions for national expansion. Ministry of Finance evaluating nationwide implementation.',
                source: 'Deloitte Tax Advisory',
                sourceType: 'Consulting',
                relevance: 'medium'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(45),
                title: 'Anti-Fraud Measures Strengthen E-invoicing Rules',
                summary: 'New regulations under Law 11/2021 enhance electronic invoicing requirements to combat VAT fraud. Additional compliance checks introduced.',
                source: 'KPMG Spain',
                sourceType: 'Consulting',
                relevance: 'medium'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(67),
                title: 'Public Consultation on B2B E-invoicing Standards',
                summary: 'Spanish Government opens public consultation on technical standards for B2B e-invoicing implementation. Industry feedback period extends until March 2025.',
                source: 'Ministerio de Hacienda',
                sourceType: 'Official',
                relevance: 'medium'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(89),
                title: 'Certified Software Provider Registration Opens',
                summary: 'AEAT begins accepting applications from software providers for VERIFACTU certification. Technical requirements and security standards published.',
                source: 'VATCalc Solutions',
                sourceType: 'VATCalc',
                relevance: 'low'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(112),
                title: 'Regional Implementation Variations Addressed',
                summary: 'Coordination meeting between national government and autonomous communities clarifies implementation approach for regions with existing systems like TicketBAI.',
                source: 'EY Tax Advisory',
                sourceType: 'Consulting',
                relevance: 'low'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(134),
                title: 'SME Support Programs Announced',
                summary: 'Special support programs announced for small and medium enterprises to prepare for e-invoicing transition. Funding available for system upgrades.',
                source: 'Spanish Chamber of Commerce',
                sourceType: 'Industry',
                relevance: 'medium'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(156),
                title: 'Cross-Border E-invoicing Standards Alignment',
                summary: 'Spain aligns national e-invoicing standards with EU initiatives. Focus on interoperability with French and German systems.',
                source: 'GENA European Chapter',
                sourceType: 'GENA',
                relevance: 'medium'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(178),
                title: 'Technical Infrastructure Readiness Assessment',
                summary: 'Comprehensive assessment of national technical infrastructure readiness for B2B e-invoicing mandate. Results inform implementation timeline.',
                source: 'PwC Digital Services',
                sourceType: 'Consulting',
                relevance: 'low'
            });
        }
        else if (countryCode === 'DEU') {
            newsData.push({
                id: (newsId++).toString(),
                date: getDaysAgo(3),
                title: 'German B2B E-invoicing Phased Implementation Confirmed',
                summary: 'BMF confirms phased rollout: €800K+ turnover businesses start January 2025, expanding to all businesses by 2027. XRechnung and ZUGFeRD formats supported.',
                source: 'Bundesministerium der Finanzen',
                sourceType: 'Official',
                relevance: 'high'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(15),
                title: 'Continuous Transaction Controls Postponed',
                summary: 'CTC requirements for businesses over €2M turnover delayed until 2028. Additional time allocated for technical preparation and pilot testing.',
                source: 'FeRD Association',
                sourceType: 'Industry',
                relevance: 'medium'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(28),
                title: 'ZUGFeRD 2.2 Specification Released',
                summary: 'Updated ZUGFeRD specification includes enhanced compliance features and improved integration with XRechnung standard for seamless B2B transactions.',
                source: 'FeRD Association',
                sourceType: 'Industry',
                relevance: 'medium'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(41),
                title: 'SME Readiness Survey Results Published',
                summary: 'Survey shows 68% of German SMEs are aware of upcoming B2B e-invoicing requirements, but only 23% have begun technical preparations.',
                source: 'GENA Germany',
                sourceType: 'GENA',
                relevance: 'medium'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(63),
                title: 'Digital Identity Integration with E-invoicing',
                summary: 'German government explores integration of digital identity solutions with e-invoicing infrastructure to enhance security and reduce fraud.',
                source: 'Accenture Digital',
                sourceType: 'Consulting',
                relevance: 'low'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(85),
                title: 'B2G Success Drives B2B Confidence',
                summary: 'High adoption rates and positive feedback from B2G e-invoicing implementation boost confidence in upcoming B2B mandate.',
                source: 'KoSIT (Federal IT Cooperation)',
                sourceType: 'Official',
                relevance: 'medium'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(107),
                title: 'Industry Training Programs Launched',
                summary: 'Comprehensive training programs launched for tax advisors and accounting professionals to support business transition to e-invoicing.',
                source: 'German Association of Tax Advisors',
                sourceType: 'Industry',
                relevance: 'low'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(129),
                title: 'Cross-Border Pilot with France Initiated',
                summary: 'Pilot program testing cross-border e-invoicing between German and French businesses using harmonized standards begins.',
                source: 'GENA Franco-German Working Group',
                sourceType: 'GENA',
                relevance: 'medium'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(151),
                title: 'Technical Standards Harmonization Complete',
                summary: 'Alignment of XRechnung with EU EN 16931 standard completed, ensuring full compatibility with European e-invoicing ecosystem.',
                source: 'CEN European Committee',
                sourceType: 'Official',
                relevance: 'medium'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(173),
                title: 'Wachstumschancengesetz Receives Parliamentary Approval',
                summary: 'Growth Opportunities Act passes Bundestag, formally establishing legal framework for mandatory B2B e-invoicing in Germany.',
                source: 'Bundesministerium der Finanzen',
                sourceType: 'Official',
                relevance: 'high'
            });
        }
        else if (countryCode === 'FRA') {
            newsData.push({
                id: (newsId++).toString(),
                date: getDaysAgo(7),
                title: 'French E-invoicing Platform Certification Opens',
                summary: 'DGFiP begins certification process for private platforms to complement Chorus Pro for B2B transactions. Factur-X format strongly recommended.',
                source: 'DGFiP (French Tax Authority)',
                sourceType: 'Official',
                relevance: 'high',
                url: 'https://www.impots.gouv.fr/e-facturation-2026'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(21),
                title: 'Factur-X 1.0.07 Technical Specifications Released',
                summary: 'Updated Factur-X specifications include enhanced compliance checks and improved PDF/A-3 integration for better system compatibility.',
                source: 'FNFE-MPE',
                sourceType: 'Industry',
                relevance: 'medium',
                url: 'https://fnfe-mpe.org/factur-x/'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(38),
                title: 'Large Enterprise Preparation Survey',
                summary: 'Survey of large French enterprises shows 78% have initiated e-invoicing preparations for 2026 reception mandate.',
                source: 'Ernst & Young France',
                sourceType: 'Consulting',
                relevance: 'medium',
                url: 'https://www.ey.com/'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(55),
                title: 'Chorus Pro Infrastructure Expansion',
                summary: 'Government announces major infrastructure expansion for Chorus Pro platform to handle anticipated B2B transaction volumes.',
                source: 'AIFE (Public Procurement Agency)',
                sourceType: 'Official',
                relevance: 'medium',
                url: 'https://chorus-pro.gouv.fr/'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(72),
                title: 'Franco-German E-invoicing Harmonization',
                summary: 'Joint working group with Germany progresses on technical harmonization between Factur-X and ZUGFeRD standards.',
                source: 'FNFE-MPE',
                sourceType: 'Industry',
                relevance: 'low'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(94),
                title: 'SME Digital Transition Support Fund',
                summary: 'Government establishes €50M fund to support SME digital transition, including e-invoicing system implementation.',
                source: 'Ministry of Digital Transition',
                sourceType: 'Official',
                relevance: 'medium'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(116),
                title: 'Regional Implementation Coordination',
                summary: 'Coordination meetings between national and regional authorities ensure consistent e-invoicing implementation across France.',
                source: 'GENA France Chapter',
                sourceType: 'GENA',
                relevance: 'low'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(138),
                title: 'Professional Service Provider Certification',
                summary: 'Framework established for certifying professional service providers to assist businesses with e-invoicing implementation.',
                source: 'VATCalc France',
                sourceType: 'VATCalc',
                relevance: 'low'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(160),
                title: 'Public Consultation Results Published',
                summary: 'Results of public consultation on B2B e-invoicing implementation published. Strong industry support with requests for extended timelines.',
                source: 'DGFiP (French Tax Authority)',
                sourceType: 'Official',
                relevance: 'medium'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(182),
                title: 'Ordonnance 2021-1190 Implementation Decree',
                summary: 'Implementation decree for B2B e-invoicing mandate published, providing detailed technical and timeline requirements.',
                source: 'Journal Officiel',
                sourceType: 'Official',
                relevance: 'high',
                url: 'https://www.legifrance.gouv.fr/jorf'
            });
        }
        // Add some generic EU-wide news for European countries
        if (country.continent === 'Europe') {
            newsData.push({
                id: (newsId++).toString(),
                date: getDaysAgo(25),
                title: 'EU VAT in Digital Age: Implementation Progress Report',
                summary: 'European Commission publishes progress report on Member State implementation of VAT in the Digital Age requirements. Focus on cross-border harmonization.',
                source: 'European Commission',
                sourceType: 'Official',
                relevance: 'medium'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(52),
                title: 'GENA Members Report 60% Increase in E-invoicing Queries',
                summary: 'Global Exchange Network Association reports significant uptick in compliance consulting requests as European implementation deadlines approach.',
                source: 'GENA Association',
                sourceType: 'GENA',
                relevance: 'low'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(78),
                title: 'OpenPEPPOL Network Expansion Accelerates',
                summary: 'PEPPOL network sees accelerated adoption across Europe as businesses prepare for mandatory e-invoicing requirements.',
                source: 'OpenPEPPOL AISBL',
                sourceType: 'Industry',
                relevance: 'low'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(103),
                title: 'CEN Technical Committee Updates EN 16931',
                summary: 'European Committee for Standardization publishes minor updates to EN 16931 standard to improve cross-border compatibility.',
                source: 'CEN European Committee',
                sourceType: 'Official',
                relevance: 'low'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(145),
                title: 'Digital Single Market E-invoicing Initiative',
                summary: 'EU Digital Single Market strategy emphasizes e-invoicing as key component for reducing administrative burden in cross-border trade.',
                source: 'European Commission DG GROW',
                sourceType: 'Official',
                relevance: 'medium'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(167),
                title: 'Multi-Country E-invoicing Pilot Results',
                summary: 'Successful completion of multi-country e-invoicing pilot involving 12 EU Member States demonstrates technical feasibility of harmonized approach.',
                source: 'GENA European Chapter',
                sourceType: 'GENA',
                relevance: 'medium'
            });
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
            const filteredList = (useStore.getState().filtered || []);
            const visibleIds = filteredList.map((c) => c.isoCode3).filter(Boolean);
            const total = Math.max(visibleIds.length, 1);
            let done = 0;
            // Foreground: refresh visible countries with proper progress tracking
            for (const id of visibleIds) {
                const countryName = filteredList.find(c => c.isoCode3 === id)?.name || id;
                setProgress({
                    percentage: Math.round((done / total) * 100),
                    message: t('refresh_country_progress', { current: done + 1, total, country: countryName }) || `Refreshing ${done + 1} of ${total}: ${countryName}`,
                    stage: 'visible'
                });
                // Use a simplified refresh without internal progress callbacks to avoid conflicts
                await complianceService.refreshComplianceData(id);
                done += 1;
            }
            // Final progress update
            setProgress({ percentage: 100, message: t('refresh_finalizing') || 'Finalizing updates...', stage: 'complete' });
            // Update this country's data immediately
            const updated = complianceService.getComplianceTimeline(country.isoCode3);
            if (updated)
                setTimelineData(updated);
            // If on news tab, refresh news list too
            if (activeTab === 'news') {
                await loadNewsData();
            }
            // Check links for updated data
            await checkAllDetailLinks();
            // Small delay to show completion before closing modal
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        catch (error) {
            const errorMsg = t('refresh_error') || 'Failed to refresh compliance data. Please try again.';
            setRefreshError(errorMsg);
            console.error('Refresh error:', error);
            return; // Don't start background updates if foreground failed
        }
        finally {
            // Always close the progress modal after foreground updates
            setIsRefreshing(false);
            setProgress({ percentage: 0, message: '', stage: '' });
        }
        // Start background updates after modal closes and user regains control
        setTimeout(() => {
            const currentFilteredList = (useStore.getState().filtered || []);
            const excludeIds = currentFilteredList.map((c) => c.isoCode3).filter(Boolean);
            startBackgroundRefresh(excludeIds);
        }, 100);
    };
    // Separate function for background updates
    const startBackgroundRefresh = async (excludeIds) => {
        try {
            const all = complianceService.getAllAvailableCountries();
            const remaining = all.filter((id) => !excludeIds.includes(id));
            if (remaining.length === 0)
                return;
            // Background refresh without progress tracking
            for (const id of remaining) {
                await complianceService.refreshComplianceData(id);
            }
            // Show success toast when background updates complete
            const successMsg = t('background_refresh_complete', { count: remaining.length })
                || `Background updates completed for ${remaining.length} ${remaining.length === 1 ? 'country' : 'countries'}.`;
            setToast({ visible: true, message: successMsg });
        }
        catch (error) {
            console.error('Background refresh error:', error);
            // Show error toast for background updates
            const errorMsg = t('background_refresh_error') || 'Some background updates failed.';
            setToast({ visible: true, message: errorMsg });
        }
    };
    // Group timeline events by category
    const groupedTimeline = React.useMemo(() => {
        if (!timelineData)
            return {};
        const groups = {
            'B2G': [],
            'B2B': [],
            'B2C': [],
            'reporting': []
        };
        timelineData.timeline.forEach((event) => {
            groups[event.category].push(event);
        });
        // Sort events by date within each group
        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        });
        return groups;
    }, [timelineData]);
    // removed local formatDate helper; using useI18n().formatDate instead
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'mandated': return 'timeline-status mandated';
            case 'planned': return 'timeline-status planned';
            case 'permitted': return 'timeline-status permitted';
            default: return 'timeline-status';
        }
    };
    const getSourceTypeColor = (sourceType) => {
        switch (sourceType) {
            case 'Official': return '#059669'; // Green
            case 'GENA': return '#dc2626'; // Red
            case 'Government': return '#2563eb'; // Blue
            case 'Consulting': return '#7c3aed'; // Purple
            case 'VATCalc': return '#ea580c'; // Orange
            default: return '#6b7280'; // Gray
        }
    };
    const renderTimelineSection = (title, events) => {
        if (events.length === 0)
            return null;
        return (_jsxs("div", { className: "timeline-section", children: [_jsx("h4", { children: title === 'reporting' ? 'Periodic E-Reporting' : `Business-to-${title.slice(2)} (${title})` }), events.map((event, index) => (_jsxs("div", { className: "timeline-item", children: [_jsx("div", { className: "timeline-date", children: formatDate(event.date) }), _jsxs("div", { className: "timeline-content", children: [_jsxs("div", { className: "timeline-description", children: [event.description, _jsx("span", { className: getStatusBadgeClass(event.status), children: event.status.charAt(0).toUpperCase() + event.status.slice(1) })] }), event.threshold && (_jsxs("div", { className: "timeline-threshold", children: ["Threshold: ", event.threshold] }))] })] }, index)))] }, title));
    };
    // Enhanced format rendering with corrected country-specific data
    const renderFormats = (formats) => {
        if (!formats || formats.length === 0) {
            return _jsx("span", { style: { color: 'var(--muted)', fontStyle: 'italic' }, children: "No specific formats specified" });
        }
        const formatButtons = [];
        formats.forEach((format, index) => {
            let formatName = '';
            if (typeof format === 'string') {
                formatName = format;
            }
            else if (typeof format === 'object' && format !== null) {
                formatName = format.name || format.format || 'Unknown Format';
            }
            else {
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
                        if (isDead) {
                            const q = `${spec.name} ${spec.version ? 'v' + spec.version : ''} ${spec.authority || ''} ${country.name} e-invoicing`.trim();
                            setSearchQuery(q);
                            setShowSearchRedirect(true);
                        }
                        else {
                            const win = window.open(spec.url, '_blank', 'noopener,noreferrer');
                            if (!win)
                                setToast({ visible: true, message: 'Popup blocked. Opening search instead…' });
                        }
                    };
                    formatButtons.push(_jsxs("button", { onClick: handleClick, className: `format-spec-button ${isDead ? 'button-amber' : ''}`, title: `${isDead ? 'Unavailable link' : (status === 'ok' ? 'Validated link' : 'Status unknown')} — ${(spec.description || spec.name)}${isDead ? '' : ' - Click to view official specification'}`, "aria-describedby": isDead ? `dead-link-hint-${buttonKey}` : undefined, children: [_jsx("span", { className: `status-dot ${isDead ? 'dot-dead' : (status === 'ok' ? 'dot-ok' : 'dot-unknown')}`, "aria-hidden": "true" }), _jsx("span", { className: "sr-only", children: `Link status: ${isDead ? 'unavailable' : (status === 'ok' ? 'validated' : 'unknown')}` }), _jsx("span", { className: "format-name", children: spec.name }), spec.version && _jsxs("span", { className: "format-version", children: ["v", spec.version] }), _jsx("span", { className: "format-authority", children: spec.authority }), _jsx("span", { className: "external-link-icon", children: "\u2197" }), isDead && (_jsx("span", { id: `dead-link-hint-${buttonKey}`, style: { position: 'absolute', left: -9999, top: 'auto', width: 1, height: 1, overflow: 'hidden' }, children: "Original link not available. Opens a web search in a new tab." }))] }, buttonKey));
                });
            }
            else {
                // No specifications found, create a non-clickable tag
                formatButtons.push(_jsxs("span", { className: "format-tag-no-spec", title: "No official specification available", children: [formatName, _jsx("span", { className: "no-spec-indicator", children: "?" })] }, index));
            }
        });
        return (_jsx("div", { className: "format-buttons-container", children: formatButtons }));
    };
    // Enhanced legislation rendering with better search
    const renderLegislation = (legislation) => {
        if (!legislation || !legislation.name) {
            return _jsx("span", { style: { color: 'var(--muted)', fontStyle: 'italic' }, children: "No legislation specified" });
        }
        const legislationName = legislation.name;
        const documents = getLegislationDocuments(legislationName);
        if (documents.length > 0) {
            return (_jsx("div", { className: "legislation-buttons-container", children: documents.map((doc, index) => {
                    const status = linkStatuses[doc.url] || 'unknown';
                    const isDead = status === 'not-found';
                    const handleClick = () => {
                        if (isDead) {
                            const q = `${doc.name} ${country.name} ${doc.type || ''} legislation`.trim();
                            setSearchQuery(q);
                            setShowSearchRedirect(true);
                        }
                        else {
                            const win = window.open(doc.url, '_blank', 'noopener,noreferrer');
                            if (!win)
                                setToast({ visible: true, message: 'Popup blocked. Opening search instead…' });
                        }
                    };
                    return (_jsxs("button", { onClick: handleClick, className: `legislation-button ${isDead ? 'button-amber' : ''}`, title: `${isDead ? 'Unavailable link' : (status === 'ok' ? 'Validated link' : 'Status unknown')} — ${doc.name}`, children: [_jsx("span", { className: `status-dot ${isDead ? 'dot-dead' : (status === 'ok' ? 'dot-ok' : 'dot-unknown')}`, "aria-hidden": "true" }), _jsx("span", { className: "sr-only", children: `Link status: ${isDead ? 'unavailable' : (status === 'ok' ? 'validated' : 'unknown')}` }), _jsx("span", { className: "legislation-name", children: doc.name }), doc.language && doc.language !== 'Multi-language' && (_jsx("span", { className: "legislation-language", children: doc.language })), doc.language === 'Multi-language' && (_jsx("span", { className: "legislation-language", children: "All Languages" })), _jsx("span", { className: "legislation-type", children: doc.type }), _jsx("span", { className: "external-link-icon", children: "\u2197" })] }, index));
                }) }));
        }
        else {
            // No mapped documents found; fall back to specific links on the legislation object
            const candidateLinks = [];
            if (legislation.officialLink)
                candidateLinks.push({ url: legislation.officialLink, label: 'Official' });
            if (legislation.specificationLink)
                candidateLinks.push({ url: legislation.specificationLink, label: 'Specification' });
            if (legislation.url)
                candidateLinks.push({ url: legislation.url, label: 'Link' });
            if (legislation.link)
                candidateLinks.push({ url: legislation.link, label: 'Link' });
            if (candidateLinks.length > 0) {
                return (_jsx("div", { className: "legislation-buttons-container", children: candidateLinks.map((l, idx) => {
                        const status = linkStatuses[l.url] || 'unknown';
                        const isDead = status === 'not-found';
                        const handleClick = () => {
                            if (isDead) {
                                const q = `${legislationName} ${country.name} ${l.label} e-invoicing`.trim();
                                setSearchQuery(q);
                                setShowSearchRedirect(true);
                            }
                            else {
                                const win = window.open(l.url, '_blank', 'noopener,noreferrer');
                                if (!win)
                                    setToast({ visible: true, message: 'Popup blocked. Opening search instead…' });
                            }
                        };
                        return (_jsxs("button", { onClick: handleClick, className: `legislation-button ${isDead ? 'button-amber' : ''}`, title: `${isDead ? 'Unavailable link' : (status === 'ok' ? 'Validated link' : 'Status unknown')} — ${legislationName} (${l.label})`, children: [_jsx("span", { className: `status-dot ${isDead ? 'dot-dead' : (status === 'ok' ? 'dot-ok' : 'dot-unknown')}`, "aria-hidden": "true" }), _jsx("span", { className: "sr-only", children: `Link status: ${isDead ? 'unavailable' : (status === 'ok' ? 'validated' : 'unknown')}` }), _jsx("span", { className: "legislation-name", children: legislationName }), _jsx("span", { className: "legislation-type", children: l.label }), _jsx("span", { className: "external-link-icon", children: "\u2197" })] }, idx));
                    }) }));
            }
            // As a last resort, offer a search link
            return (_jsxs("button", { onClick: () => window.open(`https://www.google.com/search?q=${encodeURIComponent(legislationName + ' ' + country.name + ' e-invoicing')}`, '_blank', 'noopener,noreferrer'), className: "legislation-button", title: "Search for this legislation", children: [_jsx("span", { className: "legislation-name", children: legislationName }), _jsx("span", { className: "legislation-type", children: "Search" }), _jsx("span", { className: "external-link-icon", children: "\u2197" })] }));
        }
    };
    return (_jsxs("div", { className: "modal-backdrop", role: "dialog", "aria-modal": "true", "aria-labelledby": "country-detail-title", "aria-describedby": "country-detail-desc", onClick: onClose, children: [_jsxs("div", { className: "modal", onClick: (e) => e.stopPropagation(), ref: modalRef, children: [_jsxs("header", { className: "modal-header-sticky", children: [_jsxs("div", { children: [_jsx("h2", { id: "country-detail-title", style: { margin: 0 }, children: country.name }), _jsxs("p", { id: "country-detail-desc", style: { margin: '4px 0 0 0', color: 'var(--muted)', fontSize: 14 }, children: [country.continent, " \u2022 ", country.isoCode3] })] }), _jsx("button", { onClick: onClose, className: "modal-close-button", "aria-label": `Close details for ${country.name}`, children: "\u2715" })] }), _jsxs("div", { className: "tabs tabs-sticky", role: "tablist", "aria-label": "Country details tabs", children: [_jsx("div", { className: `tab ${activeTab === 'overview' ? 'active' : ''}`, onClick: () => setActiveTab('overview'), role: "tab", id: "tab-overview", "aria-selected": activeTab === 'overview', "aria-controls": "panel-overview", tabIndex: activeTab === 'overview' ? 0 : -1, onKeyDown: (e) => {
                                    const order = ['overview', 'timeline', 'news'];
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setActiveTab('overview');
                                    }
                                    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'Home' || e.key === 'End') {
                                        e.preventDefault();
                                        const idx = order.indexOf(activeTab);
                                        let next = idx;
                                        if (e.key === 'ArrowRight')
                                            next = (idx + 1) % order.length;
                                        if (e.key === 'ArrowLeft')
                                            next = (idx - 1 + order.length) % order.length;
                                        if (e.key === 'Home')
                                            next = 0;
                                        if (e.key === 'End')
                                            next = order.length - 1;
                                        setActiveTab(order[next]);
                                        const nextId = `tab-${order[next]}`;
                                        document.getElementById(nextId)?.focus();
                                    }
                                }, children: t('tabs_overview') }), _jsx("div", { className: `tab ${activeTab === 'timeline' ? 'active' : ''}`, onClick: () => setActiveTab('timeline'), role: "tab", id: "tab-timeline", "aria-selected": activeTab === 'timeline', "aria-controls": "panel-timeline", tabIndex: activeTab === 'timeline' ? 0 : -1, onKeyDown: (e) => {
                                    const order = ['overview', 'timeline', 'news'];
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setActiveTab('timeline');
                                    }
                                    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'Home' || e.key === 'End') {
                                        e.preventDefault();
                                        const idx = order.indexOf(activeTab);
                                        let next = idx;
                                        if (e.key === 'ArrowRight')
                                            next = (idx + 1) % order.length;
                                        if (e.key === 'ArrowLeft')
                                            next = (idx - 1 + order.length) % order.length;
                                        if (e.key === 'Home')
                                            next = 0;
                                        if (e.key === 'End')
                                            next = order.length - 1;
                                        setActiveTab(order[next]);
                                        const nextId = `tab-${order[next]}`;
                                        document.getElementById(nextId)?.focus();
                                    }
                                }, children: t('timeline_title') }), _jsx("div", { className: `tab ${activeTab === 'news' ? 'active' : ''}`, onClick: () => setActiveTab('news'), role: "tab", id: "tab-news", "aria-selected": activeTab === 'news', "aria-controls": "panel-news", tabIndex: activeTab === 'news' ? 0 : -1, onKeyDown: (e) => {
                                    const order = ['overview', 'timeline', 'news'];
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setActiveTab('news');
                                    }
                                    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'Home' || e.key === 'End') {
                                        e.preventDefault();
                                        const idx = order.indexOf(activeTab);
                                        let next = idx;
                                        if (e.key === 'ArrowRight')
                                            next = (idx + 1) % order.length;
                                        if (e.key === 'ArrowLeft')
                                            next = (idx - 1 + order.length) % order.length;
                                        if (e.key === 'Home')
                                            next = 0;
                                        if (e.key === 'End')
                                            next = order.length - 1;
                                        setActiveTab(order[next]);
                                        const nextId = `tab-${order[next]}`;
                                        document.getElementById(nextId)?.focus();
                                    }
                                }, children: t('news_title') })] }), isRefreshing && (_jsx("div", { className: "progress-modal-container", children: _jsxs("div", { className: "progress-modal-content", children: [_jsx("h3", { style: { margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }, children: t('progress_updating') }), _jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-fill", style: { width: `${progress.percentage}%` } }) }), _jsxs("div", { className: "progress-text", children: [_jsxs("span", { className: "progress-percentage", children: [progress.percentage, "%"] }), _jsx("span", { className: "progress-message", children: progress.message })] })] }) })), _jsxs("div", { className: "modal-content", children: [activeTab === 'overview' && (_jsxs("div", { id: "panel-overview", role: "tabpanel", "aria-labelledby": "tab-overview", children: [_jsx("h3", { children: t('tabs_overview') }), _jsxs("div", { style: { display: 'grid', gap: 16, marginBottom: 24 }, children: [_jsxs("div", { className: "card", children: [_jsx("h4", { style: { margin: '0 0 12px 0', color: 'var(--primary)' }, children: t('b2g_title') || 'Business-to-Government (B2G)' }), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsx("strong", { children: t('overview_status') }), _jsx("span", { style: { marginLeft: 8 }, children: _jsx("span", { className: `badge ${country.eInvoicing.b2g.status === 'mandated' ? 'green' :
                                                                        country.eInvoicing.b2g.status === 'planned' ? 'yellow' :
                                                                            country.eInvoicing.b2g.status === 'permitted' ? 'yellow' : 'gray'}`, children: country.eInvoicing.b2g.status.charAt(0).toUpperCase() + country.eInvoicing.b2g.status.slice(1) }) })] }), country.eInvoicing.b2g.implementationDate && (_jsxs("div", { style: { marginBottom: 12 }, children: [_jsx("strong", { children: t('overview_impl_date') }), " ", formatDate(country.eInvoicing.b2g.implementationDate)] })), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsx("strong", { children: t('overview_supported_formats') }), _jsx("div", { style: { marginTop: 8 }, children: renderFormats(country.eInvoicing.b2g.formats) })] }), _jsxs("div", { children: [_jsx("strong", { children: t('overview_legislation') }), _jsx("div", { style: { marginTop: 8 }, children: renderLegislation(country.eInvoicing.b2g.legislation) })] })] }), _jsxs("div", { className: "card", children: [_jsx("h4", { style: { margin: '0 0 12px 0', color: 'var(--primary)' }, children: t('b2b_title') || 'Business-to-Business (B2B)' }), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsxs("strong", { children: [t('overview_status'), ":"] }), _jsx("span", { style: { marginLeft: 8 }, children: _jsx("span", { className: `badge ${country.eInvoicing.b2b.status === 'mandated' ? 'green' :
                                                                        country.eInvoicing.b2b.status === 'planned' ? 'yellow' :
                                                                            country.eInvoicing.b2b.status === 'permitted' ? 'yellow' : 'gray'}`, children: country.eInvoicing.b2b.status.charAt(0).toUpperCase() + country.eInvoicing.b2b.status.slice(1) }) })] }), country.eInvoicing.b2b.implementationDate && (_jsxs("div", { style: { marginBottom: 12 }, children: [_jsxs("strong", { children: [t('overview_implementation_date'), ":"] }), " ", formatDate(country.eInvoicing.b2b.implementationDate)] })), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsxs("strong", { children: [t('overview_supported_formats'), ":"] }), _jsx("div", { style: { marginTop: 8 }, children: renderFormats(country.eInvoicing.b2b.formats) })] }), _jsxs("div", { children: [_jsxs("strong", { children: [t('overview_legislation'), ":"] }), _jsx("div", { style: { marginTop: 8 }, children: renderLegislation(country.eInvoicing.b2b.legislation) })] })] }), _jsxs("div", { className: "card", children: [_jsx("h4", { style: { margin: '0 0 12px 0', color: 'var(--primary)' }, children: t('b2c_title') || 'Business-to-Consumer (B2C)' }), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsxs("strong", { children: [t('overview_status'), ":"] }), _jsx("span", { style: { marginLeft: 8 }, children: _jsx("span", { className: `badge ${country.eInvoicing.b2c.status === 'mandated' ? 'green' :
                                                                        country.eInvoicing.b2c.status === 'planned' ? 'yellow' :
                                                                            country.eInvoicing.b2c.status === 'permitted' ? 'yellow' : 'gray'}`, children: country.eInvoicing.b2c.status.charAt(0).toUpperCase() + country.eInvoicing.b2c.status.slice(1) }) })] }), country.eInvoicing.b2c.implementationDate && (_jsxs("div", { style: { marginBottom: 12 }, children: [_jsxs("strong", { children: [t('overview_implementation_date'), ":"] }), " ", formatDate(country.eInvoicing.b2c.implementationDate)] })), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsxs("strong", { children: [t('overview_supported_formats'), ":"] }), _jsx("div", { style: { marginTop: 8 }, children: renderFormats(country.eInvoicing.b2c.formats) })] }), _jsxs("div", { children: [_jsxs("strong", { children: [t('overview_legislation'), ":"] }), _jsx("div", { style: { marginTop: 8 }, children: renderLegislation(country.eInvoicing.b2c.legislation) })] })] })] }), _jsxs("div", { style: { fontSize: 12, color: 'var(--muted)', padding: 12, background: 'var(--panel-2)', borderRadius: 8 }, children: [_jsx("strong", { children: t('overview_last_updated') }), " ", formatDate(country.eInvoicing.lastUpdated)] })] })), activeTab === 'timeline' && (_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, children: [_jsx("h3", { style: { margin: 0 }, children: t('timeline_title') }), _jsx("button", { onClick: handleRefreshTimeline, disabled: isRefreshing, className: "refresh-button", "aria-label": "Refresh compliance data", children: isRefreshing ? (t('button_refreshing') || 'Refreshing...') : (t('button_refresh_data') || 'Refresh Data') })] }), refreshError && (_jsx("div", { style: {
                                            padding: 12,
                                            background: '#fecaca',
                                            border: '1px solid #ef4444',
                                            borderRadius: 8,
                                            marginBottom: 16,
                                            color: '#7f1d1d'
                                        }, children: refreshError })), isRefreshing ? (_jsx(LoadingSpinner, { message: "Refreshing compliance data..." })) : timelineData ? (_jsxs("div", { className: "timeline", children: [timelineData.sources && (_jsxs("div", { style: {
                                                    marginBottom: 24,
                                                    padding: 12,
                                                    background: 'var(--panel-2)',
                                                    borderRadius: 8,
                                                    fontSize: 12
                                                }, children: [_jsx("strong", { children: "Data Sources:" }), " ", timelineData.sources.join(', '), _jsx("br", {}), _jsx("strong", { children: "Last Updated:" }), " ", formatDate(timelineData.lastUpdated)] })), renderTimelineSection('B2G', groupedTimeline.B2G), renderTimelineSection('B2B', groupedTimeline.B2B), renderTimelineSection('B2C', groupedTimeline.B2C), renderTimelineSection('reporting', groupedTimeline.reporting), Object.values(groupedTimeline).every(events => events.length === 0) && (_jsxs("div", { className: "no-timeline", children: [_jsx("p", { children: "No detailed timeline information available for this country." }), _jsx("p", { children: "Click \"Refresh Data\" to check for updates." })] }))] })) : (_jsx("div", { className: "no-timeline", children: _jsx("p", { children: "Loading timeline data..." }) }))] })), activeTab === 'news' && (_jsxs("div", { id: "panel-news", role: "tabpanel", "aria-labelledby": "tab-news", children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, children: [_jsx("h3", { style: { margin: 0 }, children: t('news_title') }), _jsx("button", { onClick: loadNewsData, disabled: loadingNews, className: "refresh-button", "aria-label": "Refresh news data", children: loadingNews ? (t('button_refreshing') || 'Loading...') : (t('button_refresh_news') || 'Refresh News') })] }), loadingNews ? (_jsx(LoadingSpinner, { message: t('loading_news') })) : (_jsx("div", { className: "news-container", style: { maxHeight: '600px', overflowY: 'auto', paddingRight: '8px' }, children: newsItems.length > 0 ? (newsItems.map((item) => (_jsxs("div", { className: `news-item ${item.relevance}-relevance`, style: {
                                                background: 'var(--panel-2)',
                                                border: '1px solid var(--border)',
                                                borderRadius: 8,
                                                padding: 16,
                                                marginBottom: 12,
                                                position: 'relative',
                                                transition: 'all 0.2s ease'
                                            }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }, children: [_jsx("h4", { style: {
                                                                margin: 0,
                                                                color: 'var(--text)',
                                                                fontSize: 14,
                                                                lineHeight: 1.4,
                                                                fontWeight: '600',
                                                                paddingRight: '80px'
                                                            }, children: item.title }), _jsx("span", { className: "badge news-source-badge", style: {
                                                                background: getSourceTypeColor(item.sourceType),
                                                                color: 'white',
                                                                fontSize: 10,
                                                                padding: '3px 8px',
                                                                position: 'absolute',
                                                                top: 16,
                                                                right: 16,
                                                                flexShrink: 0
                                                            }, children: item.sourceType })] }), _jsx("p", { style: { color: 'var(--text)', fontSize: 13, lineHeight: 1.4, margin: '8px 0' }, children: item.summary }), _jsxs("div", { className: "news-meta", style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--muted)', marginTop: 12 }, children: [_jsxs("div", { className: "news-source", children: [_jsx("strong", { children: t('news_source') }), " ", item.source] }), _jsx("div", { className: "news-date", children: formatDate(item.date) })] }), _jsx("div", { style: { marginTop: 8 }, children: _jsx("a", { href: item.url || `https://www.google.com/search?q=${encodeURIComponent(item.title + ' ' + country.name)}`, target: "_blank", rel: "noopener noreferrer", className: "news-read-more", "aria-label": `More info about: ${item.title}. Opens ${item.url ? 'source ' + item.source : 'a web search'} in a new tab.`, children: t('news_more_info') }) })] }, item.id)))) : (_jsxs("div", { className: "no-news", style: { textAlign: 'center', padding: 48, color: 'var(--muted)' }, children: [_jsx("p", { style: { margin: '8px 0', fontSize: 14 }, children: t('no_news_available') }), _jsx("p", { style: { fontSize: 12, color: 'var(--muted)' }, children: t('check_back_later') })] })) }))] }))] })] }), _jsx(ProgressOverlay, { visible: loadingNews, message: t('progress_news_searching') }), showSearchRedirect && (_jsx(SearchRedirect, { query: searchQuery, onClose: () => setShowSearchRedirect(false) })), _jsx(Toast, { visible: toast.visible, message: toast.message, onClose: () => setToast({ visible: false, message: '' }) })] }));
}
