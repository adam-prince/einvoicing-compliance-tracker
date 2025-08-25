import { useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { useI18n } from '../../i18n';

export function QuickStats() {
	const { filtered } = useStore();
	const { t } = useI18n();
	const stats = useMemo(() => {
		let countries = filtered.length;
		let mandated = 0, permitted = 0, planned = 0, none = 0;
		
		for (const c of filtered) {
			const statuses = [c.eInvoicing.b2g.status, c.eInvoicing.b2b.status, c.eInvoicing.b2c.status];
			
			// Count countries in ALL applicable categories
			// If a country has any mandates (B2G, B2B, or B2C), count in mandated
			if (statuses.includes('mandated')) {
				mandated++;
			}
			
			// If a country has any planned implementations, count in planned
			if (statuses.includes('planned')) {
				planned++;
			}
			
			// If a country has any permitted status (including conditional), count in permitted
			if (statuses.includes('permitted') || statuses.includes('permitted-conditional')) {
				permitted++;
			}
			
			// Only count in 'none' if ALL statuses are 'none'
			if (statuses.every(status => status === 'none' || status === undefined)) {
				none++;
			}
		}
		
		return { countries, mandated, planned, permitted, none };
	}, [filtered]);

	return (
		<div className="kpi">
			<div className="item">
				<div className="value">{stats.countries}</div>
				<div className="label">{t('kpi_countries') || 'Countries'}</div>
			</div>
			<div className="item">
				<div className="value">{stats.mandated}</div>
				<div className="label">{t('kpi_any_mandate') || 'With Mandates'}</div>
			</div>
			<div className="item">
				<div className="value">{stats.planned}</div>
				<div className="label">{t('kpi_any_planned') || 'Any Planned'}</div>
			</div>
			<div className="item">
				<div className="value">{stats.permitted}</div>
				<div className="label">{t('kpi_any_permitted') || 'Any Permitted'}</div>
			</div>
		</div>
	);
}


