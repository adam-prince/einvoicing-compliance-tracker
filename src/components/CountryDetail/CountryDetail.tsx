import React, { useRef, useEffect } from 'react';
import { Modal } from 'carbon-react';
import type { Country } from '@types';
import { ProgressOverlay } from '../common/ProgressOverlay';
import { SearchRedirect } from '../common/SearchRedirect';
import { Toast } from '../common/Toast';
import { OverviewTab } from './OverviewTab';
import { TimelineTab } from './TimelineTab';
import { NewsTab } from './NewsTab';
import { TabNavigation } from './TabNavigation';
import { useCountryDetail } from '../../hooks/useCountryDetail';
import { AriaUtils, announcer, focusManager } from '../../utils/accessibility';

interface CountryDetailProps {
	country: Country;
	onClose: () => void;
}

export function CountryDetail({ country, onClose }: CountryDetailProps) {
	const modalRef = useRef<HTMLDivElement | null>(null);
	const previouslyFocusedRef = useRef<HTMLElement | null>(null);

	const {
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
		handleRefreshTimeline
	} = useCountryDetail(country);

	// Focus management & accessibility setup
	useEffect(() => {
		const container = modalRef.current;
		if (!container) return;

		// Set up modal ARIA attributes and focus management
		AriaUtils.setupModalAria(container);
		
		// Announce modal opening
		announcer.announce(`${country.name} country details dialog opened`, 'assertive');
		
		return () => {
			// Cleanup modal ARIA and focus management
			AriaUtils.cleanupModalAria(container);
			announcer.announce('Country details dialog closed', 'polite');
		};
	}, [country.name]);

	// Announce tab changes
	useEffect(() => {
		const tabNames: Record<string, string> = {
			overview: 'Overview',
			timeline: 'Timeline',
			news: 'News & Updates'
		};
		announcer.announce(`${tabNames[activeTab] || 'Unknown'} tab selected`, 'polite');
	}, [activeTab]);

	return (
		<Modal 
			open={true} 
			onCancel={onClose} 
			title="Country Details" 
			subtitle={`${country.name} • ${country.continent} • ${country.isoCode3}`} 
			size="xlarge"
			aria-describedby="country-detail-description"
		>
			<div ref={modalRef} role="dialog" aria-labelledby="modal-title">
				<div id="country-detail-description" className="sr-only">
					Detailed information about {country.name} e-invoicing compliance status including overview, timeline, and news updates.
				</div>
				<TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

				{/* Progress Modal for Refresh */}
				{isRefreshing && (
					<div className="progress-modal-container">
						<div className="progress-modal-content">
							<h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
								Updating Progress
							</h3>
							<div className="progress-bar">
								<div className="progress-fill" style={{ width: `${progress.percentage}%` }} />
							</div>
							<div className="progress-text">
								<span className="progress-percentage">{progress.percentage}%</span>
								<span className="progress-message">{progress.message}</span>
							</div>
						</div>
					</div>
				)}

				{/* Tab Content */}
				<div className="modal-content">
					{activeTab === 'overview' && (
						<OverviewTab 
							country={country}
							linkStatuses={linkStatuses}
							onSmartLink={handleSmartLink}
						/>
					)}

					{activeTab === 'timeline' && (
						<TimelineTab
							timelineData={timelineData}
							isRefreshing={isRefreshing}
							refreshError={refreshError}
							onRefresh={handleRefreshTimeline}
						/>
					)}

					{activeTab === 'news' && (
						<NewsTab
							newsItems={newsItems}
							loadingNews={loadingNews}
							onRefreshNews={loadNewsData}
							onSmartLink={handleSmartLink}
							countryCode={country.isoCode3}
							generateSourceUrl={generateSourceUrl}
						/>
					)}
				</div>

				{/* Additional Overlays */}
				<ProgressOverlay visible={loadingNews} message="Searching for news updates..." />
				
				<Toast 
					visible={toast.visible} 
					message={toast.message} 
					onClose={() => setToast({ visible: false, message: '' })} 
				/>
			</div>
		</Modal>
	);
}