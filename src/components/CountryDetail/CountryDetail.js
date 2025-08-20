import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { ComplianceDataService } from '../../services/complianceDataService';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { getFormatSpecifications, getLegislationDocuments } from '../../data/formatSpecifications';
export function CountryDetail({ country, onClose }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [timelineData, setTimelineData] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshError, setRefreshError] = useState('');
    const [progress, setProgress] = useState({ percentage: 0, message: '', stage: '' });
    const [newsItems, setNewsItems] = useState([]);
    const [loadingNews, setLoadingNews] = useState(false);
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
                relevance: 'high'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(21),
                title: 'Factur-X 1.0.07 Technical Specifications Released',
                summary: 'Updated Factur-X specifications include enhanced compliance checks and improved PDF/A-3 integration for better system compatibility.',
                source: 'FNFE-MPE',
                sourceType: 'Industry',
                relevance: 'medium'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(38),
                title: 'Large Enterprise Preparation Survey',
                summary: 'Survey of large French enterprises shows 78% have initiated e-invoicing preparations for 2026 reception mandate.',
                source: 'Ernst & Young France',
                sourceType: 'Consulting',
                relevance: 'medium'
            }, {
                id: (newsId++).toString(),
                date: getDaysAgo(55),
                title: 'Chorus Pro Infrastructure Expansion',
                summary: 'Government announces major infrastructure expansion for Chorus Pro platform to handle anticipated B2B transaction volumes.',
                source: 'AIFE (Public Procurement Agency)',
                sourceType: 'Official',
                relevance: 'medium'
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
                relevance: 'high'
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
        setProgress({ percentage: 0, message: 'Starting refresh...', stage: 'init' });
        try {
            const refreshedData = await complianceService.refreshComplianceData(country.isoCode3, (progressUpdate) => {
                setProgress(progressUpdate);
            });
            if (refreshedData.length > 0) {
                setTimelineData(refreshedData[0]);
            }
            else {
                // Generate updated sample data
                const sampleData = complianceService.generateSampleTimeline(country.name, country.isoCode3);
                setTimelineData(sampleData);
            }
            // Also refresh news when refreshing data
            if (activeTab === 'news') {
                await loadNewsData();
            }
        }
        catch (error) {
            setRefreshError('Failed to refresh compliance data. Please try again.');
            console.error('Refresh error:', error);
        }
        finally {
            setIsRefreshing(false);
            // Clear progress after a short delay to show completion
            setTimeout(() => {
                setProgress({ percentage: 0, message: '', stage: '' });
            }, 1000);
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
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        }
        catch {
            return dateString;
        }
    };
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
                    formatButtons.push(_jsxs("button", { onClick: () => window.open(spec.url, '_blank', 'noopener,noreferrer'), className: "format-spec-button", title: `${spec.description || spec.name} - Click to view official specification`, children: [_jsx("span", { className: "format-name", children: spec.name }), spec.version && _jsxs("span", { className: "format-version", children: ["v", spec.version] }), _jsx("span", { className: "format-authority", children: spec.authority }), _jsx("span", { className: "external-link-icon", children: "\u2197" })] }, buttonKey));
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
            return (_jsx("div", { className: "legislation-buttons-container", children: documents.map((doc, index) => (_jsxs("button", { onClick: () => window.open(doc.url, '_blank', 'noopener,noreferrer'), className: "legislation-button", title: `${doc.name} - Click to view official document`, children: [_jsx("span", { className: "legislation-name", children: doc.name }), doc.language && doc.language !== 'Multi-language' && (_jsx("span", { className: "legislation-language", children: doc.language })), doc.language === 'Multi-language' && (_jsx("span", { className: "legislation-language", children: "All Languages" })), _jsx("span", { className: "legislation-type", children: doc.type }), _jsx("span", { className: "external-link-icon", children: "\u2197" })] }, index))) }));
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
                return (_jsx("div", { className: "legislation-buttons-container", children: candidateLinks.map((l, idx) => (_jsxs("button", { onClick: () => window.open(l.url, '_blank', 'noopener,noreferrer'), className: "legislation-button", title: "Click to view legislation", children: [_jsx("span", { className: "legislation-name", children: legislationName }), _jsx("span", { className: "legislation-type", children: l.label }), _jsx("span", { className: "external-link-icon", children: "\u2197" })] }, idx))) }));
            }
            return (_jsxs("span", { className: "legislation-tag-no-link", title: "No official document link available", children: [legislationName, _jsx("span", { className: "no-link-indicator", children: "?" })] }));
        }
    };
    return (_jsx("div", { className: "modal-backdrop", onClick: onClose, children: _jsxs("div", { className: "modal", onClick: (e) => e.stopPropagation(), children: [_jsxs("header", { className: "modal-header-sticky", children: [_jsxs("div", { children: [_jsx("h2", { style: { margin: 0 }, children: country.name }), _jsxs("p", { style: { margin: '4px 0 0 0', color: 'var(--muted)', fontSize: 14 }, children: [country.continent, " \u2022 ", country.isoCode3] })] }), _jsx("button", { onClick: onClose, className: "modal-close-button", "aria-label": `Close details for ${country.name}`, children: "\u2715" })] }), _jsxs("div", { className: "tabs tabs-sticky", children: [_jsx("div", { className: `tab ${activeTab === 'overview' ? 'active' : ''}`, onClick: () => setActiveTab('overview'), role: "tab", tabIndex: 0, onKeyDown: (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setActiveTab('overview');
                                }
                            }, children: "Overview" }), _jsx("div", { className: `tab ${activeTab === 'timeline' ? 'active' : ''}`, onClick: () => setActiveTab('timeline'), role: "tab", tabIndex: 0, onKeyDown: (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setActiveTab('timeline');
                                }
                            }, children: "Implementation Timeline" }), _jsx("div", { className: `tab ${activeTab === 'news' ? 'active' : ''}`, onClick: () => setActiveTab('news'), role: "tab", tabIndex: 0, onKeyDown: (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setActiveTab('news');
                                }
                            }, children: "Latest News" })] }), isRefreshing && (_jsx("div", { className: "progress-modal-container", children: _jsxs("div", { className: "progress-modal-content", children: [_jsx("h3", { style: { margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }, children: "Updating Compliance Data" }), _jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-fill", style: { width: `${progress.percentage}%` } }) }), _jsxs("div", { className: "progress-text", children: [_jsxs("span", { className: "progress-percentage", children: [progress.percentage, "%"] }), _jsx("span", { className: "progress-message", children: progress.message })] })] }) })), _jsxs("div", { className: "modal-content", children: [activeTab === 'overview' && (_jsxs("div", { children: [_jsx("h3", { children: "Current E-Invoicing Status" }), _jsxs("div", { style: { display: 'grid', gap: 16, marginBottom: 24 }, children: [_jsxs("div", { className: "card", children: [_jsx("h4", { style: { margin: '0 0 12px 0', color: 'var(--primary)' }, children: "Business-to-Government (B2G)" }), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsx("strong", { children: "Status:" }), _jsx("span", { style: { marginLeft: 8 }, children: _jsx("span", { className: `badge ${country.eInvoicing.b2g.status === 'mandated' ? 'green' :
                                                                    country.eInvoicing.b2g.status === 'planned' ? 'yellow' :
                                                                        country.eInvoicing.b2g.status === 'permitted' ? 'yellow' : 'gray'}`, children: country.eInvoicing.b2g.status.charAt(0).toUpperCase() + country.eInvoicing.b2g.status.slice(1) }) })] }), country.eInvoicing.b2g.implementationDate && (_jsxs("div", { style: { marginBottom: 12 }, children: [_jsx("strong", { children: "Implementation Date:" }), " ", formatDate(country.eInvoicing.b2g.implementationDate)] })), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsx("strong", { children: "Supported Formats:" }), _jsx("div", { style: { marginTop: 8 }, children: renderFormats(country.eInvoicing.b2g.formats) })] }), _jsxs("div", { children: [_jsx("strong", { children: "Legislation:" }), _jsx("div", { style: { marginTop: 8 }, children: renderLegislation(country.eInvoicing.b2g.legislation) })] })] }), _jsxs("div", { className: "card", children: [_jsx("h4", { style: { margin: '0 0 12px 0', color: 'var(--primary)' }, children: "Business-to-Business (B2B)" }), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsx("strong", { children: "Status:" }), _jsx("span", { style: { marginLeft: 8 }, children: _jsx("span", { className: `badge ${country.eInvoicing.b2b.status === 'mandated' ? 'green' :
                                                                    country.eInvoicing.b2b.status === 'planned' ? 'yellow' :
                                                                        country.eInvoicing.b2b.status === 'permitted' ? 'yellow' : 'gray'}`, children: country.eInvoicing.b2b.status.charAt(0).toUpperCase() + country.eInvoicing.b2b.status.slice(1) }) })] }), country.eInvoicing.b2b.implementationDate && (_jsxs("div", { style: { marginBottom: 12 }, children: [_jsx("strong", { children: "Implementation Date:" }), " ", formatDate(country.eInvoicing.b2b.implementationDate)] })), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsx("strong", { children: "Supported Formats:" }), _jsx("div", { style: { marginTop: 8 }, children: renderFormats(country.eInvoicing.b2b.formats) })] }), _jsxs("div", { children: [_jsx("strong", { children: "Legislation:" }), _jsx("div", { style: { marginTop: 8 }, children: renderLegislation(country.eInvoicing.b2b.legislation) })] })] }), _jsxs("div", { className: "card", children: [_jsx("h4", { style: { margin: '0 0 12px 0', color: 'var(--primary)' }, children: "Business-to-Consumer (B2C)" }), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsx("strong", { children: "Status:" }), _jsx("span", { style: { marginLeft: 8 }, children: _jsx("span", { className: `badge ${country.eInvoicing.b2c.status === 'mandated' ? 'green' :
                                                                    country.eInvoicing.b2c.status === 'planned' ? 'yellow' :
                                                                        country.eInvoicing.b2c.status === 'permitted' ? 'yellow' : 'gray'}`, children: country.eInvoicing.b2c.status.charAt(0).toUpperCase() + country.eInvoicing.b2c.status.slice(1) }) })] }), country.eInvoicing.b2c.implementationDate && (_jsxs("div", { style: { marginBottom: 12 }, children: [_jsx("strong", { children: "Implementation Date:" }), " ", formatDate(country.eInvoicing.b2c.implementationDate)] })), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsx("strong", { children: "Supported Formats:" }), _jsx("div", { style: { marginTop: 8 }, children: renderFormats(country.eInvoicing.b2c.formats) })] }), _jsxs("div", { children: [_jsx("strong", { children: "Legislation:" }), _jsx("div", { style: { marginTop: 8 }, children: renderLegislation(country.eInvoicing.b2c.legislation) })] })] })] }), _jsxs("div", { style: { fontSize: 12, color: 'var(--muted)', padding: 12, background: 'var(--panel-2)', borderRadius: 8 }, children: [_jsx("strong", { children: "Data Last Updated:" }), " ", formatDate(country.eInvoicing.lastUpdated)] })] })), activeTab === 'timeline' && (_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, children: [_jsx("h3", { style: { margin: 0 }, children: "Implementation Timeline" }), _jsx("button", { onClick: handleRefreshTimeline, disabled: isRefreshing, className: "refresh-button", "aria-label": "Refresh compliance data", children: isRefreshing ? 'Refreshing...' : 'Refresh Data' })] }), refreshError && (_jsx("div", { style: {
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
                                            }, children: [_jsx("strong", { children: "Data Sources:" }), " ", timelineData.sources.join(', '), _jsx("br", {}), _jsx("strong", { children: "Last Updated:" }), " ", formatDate(timelineData.lastUpdated)] })), renderTimelineSection('B2G', groupedTimeline.B2G), renderTimelineSection('B2B', groupedTimeline.B2B), renderTimelineSection('B2C', groupedTimeline.B2C), renderTimelineSection('reporting', groupedTimeline.reporting), Object.values(groupedTimeline).every(events => events.length === 0) && (_jsxs("div", { className: "no-timeline", children: [_jsx("p", { children: "No detailed timeline information available for this country." }), _jsx("p", { children: "Click \"Refresh Data\" to check for updates." })] }))] })) : (_jsx("div", { className: "no-timeline", children: _jsx("p", { children: "Loading timeline data..." }) }))] })), activeTab === 'news' && (_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, children: [_jsx("h3", { style: { margin: 0 }, children: "Latest News & Updates" }), _jsx("button", { onClick: loadNewsData, disabled: loadingNews, className: "refresh-button", "aria-label": "Refresh news data", children: loadingNews ? 'Loading...' : 'Refresh News' })] }), loadingNews ? (_jsx(LoadingSpinner, { message: "Loading latest news..." })) : (_jsx("div", { className: "news-container", style: { maxHeight: '600px', overflowY: 'auto', paddingRight: '8px' }, children: newsItems.length > 0 ? (newsItems.map((item) => (_jsxs("div", { className: `news-item ${item.relevance}-relevance`, style: {
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
                                                        }, children: item.sourceType })] }), _jsx("p", { style: { color: 'var(--text)', fontSize: 13, lineHeight: 1.4, margin: '8px 0' }, children: item.summary }), _jsxs("div", { className: "news-meta", style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--muted)', marginTop: 12 }, children: [_jsxs("div", { className: "news-source", children: [_jsx("strong", { children: "Source:" }), " ", item.source] }), _jsx("div", { className: "news-date", children: formatDate(item.date) })] }), item.url && (_jsx("div", { style: { marginTop: 8 }, children: _jsx("button", { onClick: () => window.open(item.url || `https://www.google.com/search?q=${encodeURIComponent(item.title + ' ' + country.name)}`, '_blank', 'noopener,noreferrer'), className: "news-read-more", style: {
                                                        background: 'var(--primary)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: 4,
                                                        padding: '4px 8px',
                                                        fontSize: 11,
                                                        cursor: 'pointer',
                                                        fontWeight: '500'
                                                    }, children: "more info" }) }))] }, item.id)))) : (_jsxs("div", { className: "no-news", style: { textAlign: 'center', padding: 48, color: 'var(--muted)' }, children: [_jsxs("p", { style: { margin: '8px 0', fontSize: 14 }, children: ["No recent news available for ", country.name, "."] }), _jsx("p", { style: { fontSize: 12, color: 'var(--muted)' }, children: "Check back later for updates from official sources, GENA members, and industry publications." })] })) }))] }))] })] }) }));
}
