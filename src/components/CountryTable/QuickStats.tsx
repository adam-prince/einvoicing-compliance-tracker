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
			
			// Count each country only once per category, with priority: mandatory > planned > permitted > none
			if (statuses.includes('mandated')) {
				mandated++;
			} else if (statuses.includes('planned')) {
				planned++;
			} else if (statuses.includes('permitted')) {
				permitted++;
			} else {
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
				<div className="label">{t('kpi_any_mandate') || 'Any Mandate'}</div>
			</div>
			<div className="item">
				<div className="value">{stats.planned}</div>
				<div className="label">{t('status_planned')}</div>
			</div>
			<div className="item">
				<div className="value">{stats.permitted}</div>
				<div className="label">{t('kpi_permitted_only') || 'Permitted Only'}</div>
			</div>
		</div>
	);
}


