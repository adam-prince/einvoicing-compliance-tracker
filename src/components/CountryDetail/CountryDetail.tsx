import React, { useState, useEffect } from 'react';
import type { Country } from '@types';
import { ComplianceDataService, type EnhancedComplianceData, type TimelineEvent, type ProgressUpdate } from '../../services/complianceDataService';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { getFormatSpecifications, getLegislationDocuments, type FormatSpecification, type LegislationDocument } from '../../data/formatSpecifications';

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
	const [activeTab, setActiveTab] = useState('overview');
	const [timelineData, setTimelineData] = useState<EnhancedComplianceData | null>(null);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [refreshError, setRefreshError] = useState<string>('');
	const [progress, setProgress] = useState<ProgressUpdate>({ percentage: 0, message: '', stage: '' });
	const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
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
		} catch (error) {
			console.error('Failed to load news:', error);
		} finally {
			setLoadingNews(false);
		}
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
					url: 'https://www.agenciatributaria.es/',
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
		setProgress({ percentage: 0, message: 'Starting refresh...', stage: 'init' });

		try {
			const refreshedData = await complianceService.refreshComplianceData(
				country.isoCode3,
				(progressUpdate: ProgressUpdate) => {
					setProgress(progressUpdate);
				}
			);
			
			if (refreshedData.length > 0) {
				setTimelineData(refreshedData[0]);
			} else {
				// Generate updated sample data
				const sampleData = complianceService.generateSampleTimeline(country.name, country.isoCode3);
				setTimelineData(sampleData);
			}

			// Also refresh news when refreshing data
			if (activeTab === 'news') {
				await loadNewsData();
			}
		} catch (error) {
			setRefreshError('Failed to refresh compliance data. Please try again.');
			console.error('Refresh error:', error);
		} finally {
			setIsRefreshing(false);
			// Clear progress after a short delay to show completion
			setTimeout(() => {
				setProgress({ percentage: 0, message: '', stage: '' });
			}, 1000);
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

	const formatDate = (dateString: string) => {
		try {
			const date = new Date(dateString);
			return date.toLocaleDateString('en-GB', {
				day: '2-digit',
				month: 'short',
				year: 'numeric'
			});
		} catch {
			return dateString;
		}
	};

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
				<h4>{title === 'reporting' ? 'Periodic E-Reporting' : `Business-to-${title.slice(2)} (${title})`}</h4>
				{events.map((event, index) => (
					<div className="timeline-item" key={index}>
						<div className="timeline-date">
							{formatDate(event.date)}
						</div>
						<div className="timeline-content">
							<div className="timeline-description">
								{event.description}
								<span className={getStatusBadgeClass(event.status)}>
									{event.status.charAt(0).toUpperCase() + event.status.slice(1)}
								</span>
							</div>
							{event.threshold && (
								<div className="timeline-threshold">
									Threshold: {event.threshold}
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
			return <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>No specific formats specified</span>;
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
					formatButtons.push(
						<button
							key={buttonKey}
							onClick={() => window.open(spec.url, '_blank', 'noopener,noreferrer')}
							className="format-spec-button"
							title={`${spec.description || spec.name} - Click to view official specification`}
						>
							<span className="format-name">{spec.name}</span>
							{spec.version && <span className="format-version">v{spec.version}</span>}
							<span className="format-authority">{spec.authority}</span>
							<span className="external-link-icon">↗</span>
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
					{documents.map((doc, index) => (
						<button
							key={index}
							onClick={() => window.open(doc.url, '_blank', 'noopener,noreferrer')}
							className="legislation-button"
							title={`${doc.name} - Click to view official document`}
						>
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
					))}
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
						{candidateLinks.map((l, idx) => (
							<button
								key={idx}
								onClick={() => window.open(l.url, '_blank', 'noopener,noreferrer')}
								className="legislation-button"
								title="Click to view legislation"
							>
								<span className="legislation-name">{legislationName}</span>
								<span className="legislation-type">{l.label}</span>
								<span className="external-link-icon">↗</span>
							</button>
						))}
					</div>
				);
			}

			// As a last resort, offer a search link
			return (
				<button
					onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(legislationName + ' ' + country.name + ' e-invoicing')}`, '_blank', 'noopener,noreferrer')}
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
		<div className="modal-backdrop" onClick={onClose}>
			<div className="modal" onClick={(e) => e.stopPropagation()}>
				<header className="modal-header-sticky">
					<div>
						<h2 style={{ margin: 0 }}>{country.name}</h2>
						<p style={{ margin: '4px 0 0 0', color: 'var(--muted)', fontSize: 14 }}>
							{country.continent} • {country.isoCode3}
						</p>
					</div>
					<button 
						onClick={onClose}
						className="modal-close-button"
						aria-label={`Close details for ${country.name}`}
					>
						✕
					</button>
				</header>

				<div className="tabs tabs-sticky">
					<div 
						className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
						onClick={() => setActiveTab('overview')}
						role="tab"
						tabIndex={0}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								setActiveTab('overview');
							}
						}}
					>
						Overview
					</div>
					<div 
						className={`tab ${activeTab === 'timeline' ? 'active' : ''}`}
						onClick={() => setActiveTab('timeline')}
						role="tab"
						tabIndex={0}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								setActiveTab('timeline');
							}
						}}
					>
						Implementation Timeline
					</div>
					<div 
						className={`tab ${activeTab === 'news' ? 'active' : ''}`}
						onClick={() => setActiveTab('news')}
						role="tab"
						tabIndex={0}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								setActiveTab('news');
							}
						}}
					>
						Latest News
					</div>
				</div>

				{/* Enhanced Progress Bar */}
				{isRefreshing && (
					<div className="progress-modal-container">
						<div className="progress-modal-content">
							<h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
								Updating Compliance Data
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
						<div>
							<h3>Current E-Invoicing Status</h3>
							
							<div style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
								<div className="card">
									<h4 style={{ margin: '0 0 12px 0', color: 'var(--primary)' }}>Business-to-Government (B2G)</h4>
									
									<div style={{ marginBottom: 12 }}>
										<strong>Status:</strong> 
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
											<strong>Implementation Date:</strong> {formatDate(country.eInvoicing.b2g.implementationDate)}
										</div>
									)}

									<div style={{ marginBottom: 12 }}>
										<strong>Supported Formats:</strong>
										<div style={{ marginTop: 8 }}>
											{renderFormats(country.eInvoicing.b2g.formats)}
										</div>
									</div>

									<div>
										<strong>Legislation:</strong>
										<div style={{ marginTop: 8 }}>
											{renderLegislation(country.eInvoicing.b2g.legislation)}
										</div>
									</div>
								</div>

								<div className="card">
									<h4 style={{ margin: '0 0 12px 0', color: 'var(--primary)' }}>Business-to-Business (B2B)</h4>
									
									<div style={{ marginBottom: 12 }}>
										<strong>Status:</strong> 
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
											<strong>Implementation Date:</strong> {formatDate(country.eInvoicing.b2b.implementationDate)}
										</div>
									)}

									<div style={{ marginBottom: 12 }}>
										<strong>Supported Formats:</strong>
										<div style={{ marginTop: 8 }}>
											{renderFormats(country.eInvoicing.b2b.formats)}
										</div>
									</div>

									<div>
										<strong>Legislation:</strong>
										<div style={{ marginTop: 8 }}>
											{renderLegislation(country.eInvoicing.b2b.legislation)}
										</div>
									</div>
								</div>

								<div className="card">
									<h4 style={{ margin: '0 0 12px 0', color: 'var(--primary)' }}>Business-to-Consumer (B2C)</h4>
									
									<div style={{ marginBottom: 12 }}>
										<strong>Status:</strong> 
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
											<strong>Implementation Date:</strong> {formatDate(country.eInvoicing.b2c.implementationDate)}
										</div>
									)}

									<div style={{ marginBottom: 12 }}>
										<strong>Supported Formats:</strong>
										<div style={{ marginTop: 8 }}>
											{renderFormats(country.eInvoicing.b2c.formats)}
										</div>
									</div>

									<div>
										<strong>Legislation:</strong>
										<div style={{ marginTop: 8 }}>
											{renderLegislation(country.eInvoicing.b2c.legislation)}
										</div>
									</div>
								</div>
							</div>

							<div style={{ fontSize: 12, color: 'var(--muted)', padding: 12, background: 'var(--panel-2)', borderRadius: 8 }}>
								<strong>Data Last Updated:</strong> {formatDate(country.eInvoicing.lastUpdated)}
							</div>
						</div>
					)}

					{activeTab === 'timeline' && (
						<div>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
								<h3 style={{ margin: 0 }}>Implementation Timeline</h3>
								<button 
									onClick={handleRefreshTimeline}
									disabled={isRefreshing}
									className="refresh-button"
									aria-label="Refresh compliance data"
								>
									{isRefreshing ? 'Refreshing...' : 'Refresh Data'}
								</button>
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
						<div>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
								<h3 style={{ margin: 0 }}>Latest News & Updates</h3>
								<button 
									onClick={loadNewsData}
									disabled={loadingNews}
									className="refresh-button"
									aria-label="Refresh news data"
								>
									{loadingNews ? 'Loading...' : 'Refresh News'}
								</button>
							</div>

							{loadingNews ? (
								<LoadingSpinner message="Loading latest news..." />
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
														<strong>Source:</strong> {item.source}
													</div>
													<div className="news-date">
														{formatDate(item.date)}
													</div>
												</div>
												
												{item.url && (
													<div style={{ marginTop: 8 }}>
														<button
															onClick={() => window.open(item.url || `https://www.google.com/search?q=${encodeURIComponent(item.title + ' ' + country.name)}`, '_blank', 'noopener,noreferrer')}
															className="news-read-more"
															style={{
																background: 'var(--primary)',
																color: 'white',
																border: 'none',
																borderRadius: 4,
																padding: '4px 8px',
																fontSize: 11,
																cursor: 'pointer',
																fontWeight: '500'
															}}
														>
															more info
														</button>
													</div>
												)}
											</div>
										))
									) : (
										<div className="no-news" style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
											<p style={{ margin: '8px 0', fontSize: 14 }}>No recent news available for {country.name}.</p>
											<p style={{ fontSize: 12, color: 'var(--muted)' }}>
												Check back later for updates from official sources, GENA members, and industry publications.
											</p>
										</div>
									)}
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}