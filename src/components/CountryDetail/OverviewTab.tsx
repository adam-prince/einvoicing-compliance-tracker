import React from 'react';
import type { Country } from '@types';
import { getFormatSpecifications, getLegislationDocuments } from '../../data/formatSpecifications';
import { useI18n } from '../../i18n';
import { sanitizeUrl, sanitizeText } from '../../utils/security';

interface OverviewTabProps {
	country: Country;
	linkStatuses: Record<string, 'ok' | 'not-found' | 'unknown'>;
	onSmartLink: (url: string, title: string, source: string, countryCode: string) => void;
}

export function OverviewTab({ country, linkStatuses, onSmartLink }: OverviewTabProps) {
	const { t, formatDate } = useI18n();

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
			if (specifications.length > 0) {
				// Create buttons for each specification version
				specifications.forEach((spec, specIndex) => {
					const buttonKey = `${index}-${specIndex}`;
					const status = linkStatuses[spec.url] || 'unknown';
					const isDead = status === 'not-found';

					const handleClick = () => {
						onSmartLink(spec.url, `${spec.name} ${spec.version ? 'v' + spec.version : ''} specification`, spec.authority || 'Format Authority', country.isoCode3);
					};

					formatButtons.push(
						<button
							key={buttonKey}
							onClick={handleClick}
							className={`format-spec-button ${isDead ? 'button-amber' : ''}`}
							title={`${isDead ? 'Unavailable link' : (status === 'ok' ? 'Validated link' : 'Status unknown')} — ${(spec.description || spec.name)}${isDead ? '' : ' - Click to view official specification'}`}
							aria-describedby={isDead ? `dead-link-hint-${buttonKey}` : undefined}
						>
							<span className={`status-dot ${isDead ? 'dot-dead' : (status === 'ok' ? 'dot-ok' : 'dot-unknown')}`} aria-hidden="true" />
							<span className="sr-only">Link status: {isDead ? 'unavailable' : (status === 'ok' ? 'validated' : 'unknown')}</span>
							<span className="format-name">{spec.name}</span>
							{spec.version && <span className="format-version">v{spec.version}</span>}
							<span className="format-authority">{spec.authority}</span>
							<span className="external-link-icon">↗</span>
							{isDead && (
								<span
									id={`dead-link-hint-${buttonKey}`}
									style={{
										position: 'absolute',
										left: -9999,
										top: 'auto',
										width: 1,
										height: 1,
										overflow: 'hidden'
									}}
								>
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

		return <div className="format-buttons-container">{formatButtons}</div>;
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
							onSmartLink(doc.url, doc.name, 'Government Document', country.isoCode3);
						};

						return (
							<button
								key={index}
								onClick={handleClick}
								className={`legislation-button ${isDead ? 'button-amber' : ''}`}
								title={`${isDead ? 'Unavailable link' : (status === 'ok' ? 'Validated link' : 'Status unknown')} — ${doc.name}`}
							>
								<span className={`status-dot ${isDead ? 'dot-dead' : (status === 'ok' ? 'dot-ok' : 'dot-unknown')}`} aria-hidden="true" />
								<span className="sr-only">Link status: {isDead ? 'unavailable' : (status === 'ok' ? 'validated' : 'unknown')}</span>
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
			const candidateLinks = [];
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
								onSmartLink(l.url, `${legislationName} (${l.label})`, 'Government Legislation', country.isoCode3);
							};

							return (
								<button
									key={idx}
									onClick={handleClick}
									className={`legislation-button ${isDead ? 'button-amber' : ''}`}
									title={`${isDead ? 'Unavailable link' : (status === 'ok' ? 'Validated link' : 'Status unknown')} — ${legislationName} (${l.label})`}
								>
									<span className={`status-dot ${isDead ? 'dot-dead' : (status === 'ok' ? 'dot-ok' : 'dot-unknown')}`} aria-hidden="true" />
									<span className="sr-only">Link status: {isDead ? 'unavailable' : (status === 'ok' ? 'validated' : 'unknown')}</span>
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
					onClick={() => onSmartLink(
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
							<span className={`badge ${
								country.eInvoicing.b2g.status === 'mandated' ? 'green' :
								country.eInvoicing.b2g.status === 'planned' ? 'yellow' :
								country.eInvoicing.b2g.status === 'permitted' ? 'yellow' : 'gray'
							}`}>
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

				{/* B2B Section */}
				<div className="card">
					<h4 style={{ margin: '0 0 12px 0', color: 'var(--primary)' }}>
						{t('b2b_title') || 'Business-to-Business (B2B)'}
					</h4>
					<div style={{ marginBottom: 12 }}>
						<strong>{t('overview_status')}:</strong>
						<span style={{ marginLeft: 8 }}>
							<span className={`badge ${
								country.eInvoicing.b2b.status === 'mandated' ? 'green' :
								country.eInvoicing.b2b.status === 'planned' ? 'yellow' :
								country.eInvoicing.b2b.status === 'permitted' ? 'yellow' : 'gray'
							}`}>
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

				{/* B2C Section */}
				<div className="card">
					<h4 style={{ margin: '0 0 12px 0', color: 'var(--primary)' }}>
						{t('b2c_title') || 'Business-to-Consumer (B2C)'}
					</h4>
					<div style={{ marginBottom: 12 }}>
						<strong>{t('overview_status')}:</strong>
						<span style={{ marginLeft: 8 }}>
							<span className={`badge ${
								country.eInvoicing.b2c.status === 'mandated' ? 'green' :
								country.eInvoicing.b2c.status === 'planned' ? 'yellow' :
								country.eInvoicing.b2c.status === 'permitted' ? 'yellow' : 'gray'
							}`}>
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

			<div style={{
				fontSize: 12,
				color: 'var(--muted)',
				padding: 12,
				background: 'var(--panel-2)',
				borderRadius: 8
			}}>
				<strong>{t('overview_last_updated')}</strong> {formatDate(country.eInvoicing.lastUpdated)}
			</div>
		</div>
	);
}