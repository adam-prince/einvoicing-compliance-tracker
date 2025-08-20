import React, { useState, useEffect } from 'react';
import type { Country } from '@types';
import { ComplianceDataService, type EnhancedComplianceData, type TimelineEvent, type ProgressUpdate } from '../../services/complianceDataService';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { getFormatSpecifications, getLegislationDocuments, type FormatSpecification, type LegislationDocument } from '../../data/formatSpecifications';

interface CountryDetailProps {
	country: Country;
	onClose: () => void;
}

export function CountryDetail({ country, onClose }: CountryDetailProps) {
	const [activeTab, setActiveTab] = useState('overview');
	const [timelineData, setTimelineData] = useState<EnhancedComplianceData | null>(null);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [refreshError, setRefreshError] = useState<string>('');
	const [progress, setProgress] = useState<ProgressUpdate>({ percentage: 0, message: '', stage: '' });

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

	// Enhanced format rendering with clickable specification buttons
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

	// Enhanced legislation rendering with clickable document buttons
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
			// No documents found, show the original legislation name
			if (legislation.url || legislation.link) {
				return (
					<button
						onClick={() => window.open(legislation.url || legislation.link, '_blank', 'noopener,noreferrer')}
						className="legislation-button"
						title="Click to view legislation"
					>
						<span className="legislation-name">{legislationName}</span>
						<span className="external-link-icon">↗</span>
					</button>
				);
			} else {
				return (
					<span className="legislation-tag-no-link" title="No official document link available">
						{legislationName}
						<span className="no-link-indicator">?</span>
					</span>
				);
			}
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
				</div>

				{/* Progress Bar */}
				{isRefreshing && (
					<div className="progress-container">
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
				</div>
			</div>
		</div>
	);
}