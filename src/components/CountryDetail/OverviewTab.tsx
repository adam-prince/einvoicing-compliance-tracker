import React, { useState, useCallback, useEffect } from 'react';
import type { Country } from '@types';
import { getFormatSpecifications, getLegislationDocuments } from '../../data/formatSpecifications';
import type { FormatSpecification, LegislationDocument } from '../../data/formatSpecifications';
import { useI18n } from '../../i18n';
import { sanitizeUrl, sanitizeText } from '../../utils/security';
import { EnhancedLink } from '../common/EnhancedLink';
import { EditableStatusBadge } from '../common/EditableStatusBadge';
import { FormatManagementModal } from '../common/FormatManagementModal';
import { LegislationManagementModal } from '../common/LegislationManagementModal';
import { apiService } from '../../services/api';
import '../../styles/management.css';

interface OverviewTabProps {
	country: Country;
	linkStatuses: Record<string, 'ok' | 'not-found' | 'unknown'>;
	onSmartLink: (url: string, title: string, source: string, countryCode: string) => void;
}

export function OverviewTab({ country, linkStatuses, onSmartLink }: OverviewTabProps) {
	const { t, formatDate } = useI18n();
	
	// State for local status overrides (stored in localStorage)
	const [statusOverrides, setStatusOverrides] = useState<Record<string, any>>(() => {
		try {
			const saved = localStorage.getItem('einvoicing-status-overrides');
			return saved ? JSON.parse(saved) : {};
		} catch {
			return {};
		}
	});

	// Modal states
	const [showFormatModal, setShowFormatModal] = useState(false);
	const [showLegislationModal, setShowLegislationModal] = useState(false);
	const [refreshKey, setRefreshKey] = useState(0);

	// Custom formats and legislation from localStorage
	const [customFormats, setCustomFormats] = useState<FormatSpecification[]>([]);
	const [customLegislation, setCustomLegislation] = useState<LegislationDocument[]>([]);

	// Load custom data from backend on mount and when refreshKey changes
	useEffect(() => {
		const loadCustomData = async () => {
			try {
				// Load custom formats for this country
				const formatsResponse = await apiService.getCustomFormats(country.isoCode3);
				if (formatsResponse.success) {
					// Convert backend format to frontend format
					const formats = formatsResponse.data.map((item: any) => ({
						name: item.name,
						version: item.version,
						url: item.url,
						description: item.description,
						authority: item.authority,
						type: item.type
					}));
					setCustomFormats(formats);
				}

				// Load custom legislation for this country
				const legislationResponse = await apiService.getCustomLegislation(country.isoCode3);
				if (legislationResponse.success) {
					// Convert backend legislation to frontend format
					const legislation = legislationResponse.data.map((item: any) => ({
						name: item.name,
						url: item.url,
						language: item.language,
						jurisdiction: item.jurisdiction,
						type: item.type,
						documentId: item.documentId
					}));
					setCustomLegislation(legislation);
				}
			} catch (error) {
				console.warn('Failed to load custom content from backend:', error);
				// Fallback to empty arrays
				setCustomFormats([]);
				setCustomLegislation([]);
			}
		};

		loadCustomData();
	}, [country.isoCode3, refreshKey]);

	// Handle adding new format
	const handleFormatAdded = useCallback((format: FormatSpecification) => {
		setRefreshKey(prev => prev + 1);
	}, []);

	// Handle adding new legislation
	const handleLegislationAdded = useCallback((legislation: LegislationDocument) => {
		setRefreshKey(prev => prev + 1);
	}, []);

	// Get effective status (override or original)
	const getEffectiveStatus = (channel: 'b2g' | 'b2b' | 'b2c') => {
		const overrideKey = `${country.isoCode3}-${channel}`;
		return statusOverrides[overrideKey]?.status || country.eInvoicing[channel].status;
	};

	// Handle status changes
	const handleStatusChange = useCallback((channel: 'b2g' | 'b2b' | 'b2c', newStatus: string) => {
		const overrideKey = `${country.isoCode3}-${channel}`;
		const updatedOverrides = {
			...statusOverrides,
			[overrideKey]: {
				status: newStatus,
				originalStatus: country.eInvoicing[channel].status,
				timestamp: new Date().toISOString(),
				countryName: country.name
			}
		};
		
		setStatusOverrides(updatedOverrides);
		
		// Save to localStorage
		try {
			localStorage.setItem('einvoicing-status-overrides', JSON.stringify(updatedOverrides));
		} catch (error) {
			console.warn('Failed to save status overrides:', error);
		}
	}, [country, statusOverrides]);

	// Enhanced format rendering with corrected country-specific data
	const renderFormats = (formats: any[]) => {
		if (!formats || formats.length === 0) {
			return <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>{t('formats_none') || 'No specific formats specified'}</span>;
		}

		const formatButtons: React.ReactElement[] = [];

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
			
			// Add custom formats that match this format name
			const matchingCustomFormats = customFormats.filter(cf => 
				cf.name.toLowerCase().includes(formatName.toLowerCase()) ||
				formatName.toLowerCase().includes(cf.name.toLowerCase())
			);
			const allSpecifications = [...specifications, ...matchingCustomFormats];
			
			if (allSpecifications.length > 0) {
				// Create buttons for each specification version
				allSpecifications.forEach((spec, specIndex) => {
					const buttonKey = `${index}-${specIndex}`;
					const status = linkStatuses[spec.url] || 'unknown';
					const isDead = status === 'not-found';

					formatButtons.push(
						<div key={buttonKey} className={`format-spec-button ${isDead ? 'button-amber' : ''}`} style={{ position: 'relative' }}>
							<span className={`status-dot ${isDead ? 'dot-dead' : (status === 'ok' ? 'dot-ok' : 'dot-unknown')}`} aria-hidden="true" />
							<span className="sr-only">Link status: {isDead ? 'unavailable' : (status === 'ok' ? 'validated' : 'unknown')}</span>
							<EnhancedLink
								url={spec.url}
								title={`${spec.name} ${spec.version ? 'v' + spec.version : ''} specification`}
								countryCode={country.isoCode3}
								linkType="specification"
								className="enhanced-link-in-button"
								style={{ 
									color: 'inherit', 
									textDecoration: 'none', 
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'flex-start',
									flex: 1
								}}
							>
								<span className="format-name">{spec.name}</span>
								{spec.version && <span className="format-version">v{spec.version}</span>}
								<span className="format-authority">{spec.authority}</span>
							</EnhancedLink>
						</div>
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

		// Add custom formats that don't match any existing format names
		const unmatchedCustomFormats = customFormats.filter(cf => {
			return !formats.some(format => {
				const formatName = typeof format === 'string' ? format : (format?.name || format?.format || '');
				return cf.name.toLowerCase().includes(formatName.toLowerCase()) ||
					   formatName.toLowerCase().includes(cf.name.toLowerCase());
			});
		});

		unmatchedCustomFormats.forEach((cf, index) => {
			const buttonKey = `custom-${index}`;
			const status = linkStatuses[cf.url] || 'unknown';
			const isDead = status === 'not-found';

			formatButtons.push(
				<div key={buttonKey} className={`format-spec-button custom-format ${isDead ? 'button-amber' : ''}`} style={{ position: 'relative' }}>
					<span className={`status-dot ${isDead ? 'dot-dead' : (status === 'ok' ? 'dot-ok' : 'dot-unknown')}`} aria-hidden="true" />
					<span className="sr-only">Link status: {isDead ? 'unavailable' : (status === 'ok' ? 'validated' : 'unknown')}</span>
					<EnhancedLink
						url={cf.url}
						title={`${cf.name} ${cf.version ? 'v' + cf.version : ''} specification`}
						countryCode={country.isoCode3}
						linkType="specification"
						className="enhanced-link-in-button"
						style={{ 
							color: 'inherit', 
							textDecoration: 'none', 
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'flex-start',
							flex: 1
						}}
					>
						<span className="format-name">{cf.name}</span>
						{cf.version && <span className="format-version">v{cf.version}</span>}
						<span className="format-authority">{cf.authority}</span>
						<span className="custom-indicator">Custom</span>
					</EnhancedLink>
				</div>
			);
		});

		return (
			<div className="format-section">
				<div className="format-buttons-container">{formatButtons}</div>
				<button 
					type="button" 
					className="add-format-btn"
					onClick={() => setShowFormatModal(true)}
					title="Add custom format"
				>
					+ Add Format
				</button>
			</div>
		);
	};

	// Enhanced legislation rendering with better search
	const renderLegislation = (legislation: any) => {
		if (!legislation || !legislation.name) {
			return <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>No legislation specified</span>;
		}

		const legislationName = legislation.name;
		let documents = getLegislationDocuments(legislationName);

		// Add custom legislation that matches this legislation name
		const matchingCustomLegislation = customLegislation.filter(cl => 
			cl.name.toLowerCase().includes(legislationName.toLowerCase()) ||
			legislationName.toLowerCase().includes(cl.name.toLowerCase())
		);
		documents = [...documents, ...matchingCustomLegislation];

		if (documents.length > 0) {
			return (
				<div className="legislation-section">
					<div className="legislation-buttons-container">
						{documents.map((doc, index) => {
							const status = linkStatuses[doc.url] || 'unknown';
							const isDead = status === 'not-found';
							const isCustom = matchingCustomLegislation.includes(doc as any);

							return (
								<div
									key={index}
									className={`legislation-button ${isDead ? 'button-amber' : ''} ${isCustom ? 'custom-legislation' : ''}`}
									title={`${isDead ? 'Unavailable link' : (status === 'ok' ? 'Validated link' : 'Status unknown')} — ${doc.name}`}
								>
									<span className={`status-dot ${isDead ? 'dot-dead' : (status === 'ok' ? 'dot-ok' : 'dot-unknown')}`} aria-hidden="true" />
									<span className="sr-only">Link status: {isDead ? 'unavailable' : (status === 'ok' ? 'validated' : 'unknown')}</span>
									<EnhancedLink
										url={doc.url}
										title={doc.name}
										countryCode={country.isoCode3}
										linkType="legislation"
										className="enhanced-link-in-button"
										style={{ color: 'inherit', textDecoration: 'none' }}
									>
										<span className="legislation-name">{doc.name}</span>
										{doc.language && doc.language !== 'Multi-language' && (
											<span className="legislation-language">{doc.language}</span>
										)}
										{doc.language === 'Multi-language' && (
											<span className="legislation-language">All Languages</span>
										)}
										<span className="legislation-type">{doc.type}</span>
										{isCustom && <span className="custom-indicator">Custom</span>}
									</EnhancedLink>
								</div>
							);
						})}
					</div>
					<button 
						type="button" 
						className="add-legislation-btn"
						onClick={() => setShowLegislationModal(true)}
						title="Add custom legislation"
					>
						+ Add Legislation
					</button>
				</div>
			);
		} else {
			// No mapped documents found; fall back to specific links on the legislation object
			const candidateLinks = [];
			if (legislation.officialLink) candidateLinks.push({ url: legislation.officialLink, label: 'Official' });
			if (legislation.specificationLink) candidateLinks.push({ url: legislation.specificationLink, label: 'Specification' });
			if (legislation.url) candidateLinks.push({ url: legislation.url, label: 'Link' });
			if (legislation.link) candidateLinks.push({ url: legislation.link, label: 'Link' });

			if (candidateLinks.length > 0) {
				return (
					<div className="legislation-section">
						<div className="legislation-buttons-container">
							{candidateLinks.map((l, idx) => {
								const status = linkStatuses[l.url] || 'unknown';
								const isDead = status === 'not-found';

								return (
									<div
										key={idx}
										className={`legislation-button ${isDead ? 'button-amber' : ''}`}
										title={`${isDead ? 'Unavailable link' : (status === 'ok' ? 'Validated link' : 'Status unknown')} — ${legislationName} (${l.label})`}
									>
										<span className={`status-dot ${isDead ? 'dot-dead' : (status === 'ok' ? 'dot-ok' : 'dot-unknown')}`} aria-hidden="true" />
										<span className="sr-only">Link status: {isDead ? 'unavailable' : (status === 'ok' ? 'validated' : 'unknown')}</span>
										<EnhancedLink
											url={l.url}
											title={`${legislationName} (${l.label})`}
											countryCode={country.isoCode3}
											linkType="legislation"
											className="enhanced-link-in-button"
											style={{ color: 'inherit', textDecoration: 'none' }}
										>
											<span className="legislation-name">{legislationName}</span>
											<span className="legislation-type">{l.label}</span>
										</EnhancedLink>
									</div>
								);
							})}
						</div>
						<button 
							type="button" 
							className="add-legislation-btn"
							onClick={() => setShowLegislationModal(true)}
							title="Add custom legislation"
						>
							+ Add Legislation
						</button>
					</div>
				);
			}

			// As a last resort, offer a search link
			return (
				<div className="legislation-section">
					<button
						onClick={() => onSmartLink(
							`https://www.google.com/search?q=${encodeURIComponent(legislationName + ' ' + country.name + ' e-invoicing')}`,
							legislationName,
							'Search Results',
							country.isoCode3
						)}
						className="legislation-button"
						title="Search for this legislation"
					>
						<span className="status-dot dot-unknown" aria-hidden="true" />
						<span className="sr-only">Link status: search required</span>
						<span className="legislation-name">{legislationName}</span>
						<span className="legislation-type">Search</span>
						<span className="external-link-icon">↗</span>
					</button>
					<button 
						type="button" 
						className="add-legislation-btn"
						onClick={() => setShowLegislationModal(true)}
						title="Add custom legislation"
					>
						+ Add Legislation
					</button>
				</div>
			);
		}
	};

	return (
		<div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview">
			<h3>{t('tabs_overview')}</h3>
			<div style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
				{/* B2G Section */}
				<div className="card">
					<h4 style={{ margin: '0 0 12px 0', color: 'var(--primary)' }}>
						{t('b2g_title') || 'Business-to-Government (B2G)'}
					</h4>
					<div style={{ marginBottom: 12 }}>
						<strong>{t('overview_status')}</strong>
						<span style={{ marginLeft: 8 }}>
							<EditableStatusBadge
								status={getEffectiveStatus('b2g') as any}
								onStatusChange={(newStatus) => handleStatusChange('b2g', newStatus)}
							/>
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

				{/* B2B Section */}
				<div className="card">
					<h4 style={{ margin: '0 0 12px 0', color: 'var(--primary)' }}>
						{t('b2b_title') || 'Business-to-Business (B2B)'}
					</h4>
					<div style={{ marginBottom: 12 }}>
						<strong>{t('overview_status')}:</strong>
						<span style={{ marginLeft: 8 }}>
							<EditableStatusBadge
								status={getEffectiveStatus('b2b') as any}
								onStatusChange={(newStatus) => handleStatusChange('b2b', newStatus)}
							/>
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

				{/* B2C Section */}
				<div className="card">
					<h4 style={{ margin: '0 0 12px 0', color: 'var(--primary)' }}>
						{t('b2c_title') || 'Business-to-Consumer (B2C)'}
					</h4>
					<div style={{ marginBottom: 12 }}>
						<strong>{t('overview_status')}:</strong>
						<span style={{ marginLeft: 8 }}>
							<EditableStatusBadge
								status={getEffectiveStatus('b2c') as any}
								onStatusChange={(newStatus) => handleStatusChange('b2c', newStatus)}
							/>
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

			<div style={{
				fontSize: 12,
				color: 'var(--muted)',
				padding: 12,
				background: 'var(--panel-2)',
				borderRadius: 8
			}}>
				<strong>{t('overview_last_updated')}</strong> {formatDate(country.eInvoicing.lastUpdated)}
			</div>

			{/* Management Modals */}
			<FormatManagementModal
				isOpen={showFormatModal}
				onClose={() => setShowFormatModal(false)}
				countryCode={country.isoCode3}
				countryName={country.name}
				onFormatAdded={handleFormatAdded}
			/>

			<LegislationManagementModal
				isOpen={showLegislationModal}
				onClose={() => setShowLegislationModal(false)}
				countryCode={country.isoCode3}
				countryName={country.name}
				onLegislationAdded={handleLegislationAdded}
			/>
		</div>
	);
}