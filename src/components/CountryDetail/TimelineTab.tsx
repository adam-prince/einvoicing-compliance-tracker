import React, { useMemo } from 'react';
import { Button } from 'carbon-react';
import type { EnhancedComplianceData } from '../../services/complianceDataService';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useI18n } from '../../i18n';

interface TimelineTabProps {
	timelineData: EnhancedComplianceData | null;
	isRefreshing: boolean;
	refreshError: string;
	onRefresh: () => void;
}

export function TimelineTab({ timelineData, isRefreshing, refreshError, onRefresh }: TimelineTabProps) {
	const { t, formatDate } = useI18n();

	// Group timeline events by category
	const groupedTimeline = useMemo(() => {
		if (!timelineData) {
			return {
				'B2G': [] as any[],
				'B2B': [] as any[],
				'B2C': [] as any[],
				'reporting': [] as any[]
			};
		}

		const groups = {
			'B2G': [] as any[],
			'B2B': [] as any[],
			'B2C': [] as any[],
			'reporting': [] as any[]
		};

		timelineData.timeline.forEach((event) => {
			const category = event.category as keyof typeof groups;
			if (groups[category]) {
				groups[category].push(event);
			}
		});

		// Sort events by date within each group
		Object.keys(groups).forEach(key => {
			groups[key as keyof typeof groups].sort((a, b) => 
				new Date(a.date).getTime() - new Date(b.date).getTime()
			);
		});

		return groups;
	}, [timelineData]);

	const getStatusBadgeClass = (status: string) => {
		switch (status) {
			case 'mandated': return 'timeline-status mandated';
			case 'planned': return 'timeline-status planned';
			case 'permitted': return 'timeline-status permitted';
			default: return 'timeline-status';
		}
	};

	const renderTimelineSection = (title: string, events: any[]) => {
		if (events.length === 0) return null;

		return (
			<div key={title} className="timeline-section">
				<h4>
					{title === 'reporting' 
						? (t('timeline_periodic_reporting') || 'Periodic E-Reporting')
						: (t(`timeline_${title}`) || `Business-to-${title.slice(2)} (${title})`)
					}
				</h4>
				{events.map((event, index) => (
					<div key={index} className="timeline-item">
						<div className="timeline-date">{formatDate(event.date)}</div>
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

	return (
		<div id="panel-timeline" role="tabpanel" aria-labelledby="tab-timeline">
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
				<h3 style={{ margin: 0 }}>{t('timeline_title')}</h3>
				<Button
					onClick={onRefresh}
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
	);
}