import React from 'react';
import { Button } from 'carbon-react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useI18n } from '../../i18n';

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

interface NewsTabProps {
	newsItems: NewsItem[];
	loadingNews: boolean;
	onRefreshNews: () => void;
	onSmartLink: (url: string, title: string, source: string, countryCode: string) => void;
	countryCode: string;
	generateSourceUrl: (sourceType: string, source: string, countryCode: string, title: string) => string;
}

export function NewsTab({ 
	newsItems, 
	loadingNews, 
	onRefreshNews, 
	onSmartLink, 
	countryCode,
	generateSourceUrl 
}: NewsTabProps) {
	const { t, formatDate } = useI18n();

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

	return (
		<div id="panel-news" role="tabpanel" aria-labelledby="tab-news">
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
				<h3 style={{ margin: 0 }}>{t('news_title')}</h3>
				<Button
					onClick={onRefreshNews}
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
							<div
								key={item.id}
								className={`news-item ${item.relevance}-relevance`}
								style={{
									background: 'var(--panel-2)',
									border: '1px solid var(--border)',
									borderRadius: 8,
									padding: 16,
									marginBottom: 12,
									position: 'relative',
									transition: 'all 0.2s ease'
								}}
							>
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

								<div className="news-meta" style={{ 
									display: 'flex', 
									justifyContent: 'space-between', 
									alignItems: 'center', 
									fontSize: 11, 
									color: 'var(--muted)', 
									marginTop: 12 
								}}>
									<div className="news-source">
										<strong>{t('news_source')}</strong> {item.source}
									</div>
									<div className="news-date">
										{formatDate(item.date)}
									</div>
								</div>

								<div style={{ marginTop: 8 }}>
									<Button
										onClick={() => onSmartLink(
											item.url || generateSourceUrl(item.sourceType, item.source, countryCode, item.title),
											item.title,
											item.source,
											countryCode
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
							<p style={{ margin: '8px 0', fontSize: 14 }}>
								{t('no_news_available')}
							</p>
							<p style={{ fontSize: 12, color: 'var(--muted)' }}>
								{t('check_back_later')}
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}