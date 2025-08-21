import { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useI18n } from '../../i18n';

export function Filters() {
	const { filters, setFilters } = useStore();
	const { t } = useI18n();
	const [search, setSearch] = useState(filters.search);
	const debouncedSearch = useDebouncedValue(search, 250);

	useEffect(() => {
		setFilters({ search: debouncedSearch });
	}, [debouncedSearch, setFilters]);

	return (
		<div className="card row wrap" style={{ gap: 12 }}>
			<div>
				<label htmlFor="country-search">{t('filters_search_countries')}</label>
				<input
					type="text"
					placeholder={t('filters_search_placeholder')}
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					style={{ minWidth: 220 }}
					id="country-search"
					name="country-search"
				/>
			</div>
			<div>
				<label htmlFor="last-change-date">{t('filters_updated_after')}</label>
				<input
					type="date"
					id="last-change-date"
					name="last-change-date"
					value={filters.lastChangeAfter || ''}
					onChange={(e) => setFilters({ lastChangeAfter: e.target.value })}
				/>
			</div>
			<div>
				<label htmlFor="continent-filter">{t('filters_continent')}</label>
				<select 
					value={filters.continent || 'all'} 
					onChange={(e) => setFilters({ continent: e.target.value === 'all' ? '' : e.target.value })} 
					id="continent-filter" 
					name="continent-filter"
				>
					<option value="all">{t('filters_all_continents')}</option>
					<option value="Europe">{t('filters_continent_europe')}</option>
					<option value="Asia">{t('filters_continent_asia')}</option>
					<option value="Africa">{t('filters_continent_africa')}</option>
					<option value="Americas">{t('filters_continent_americas')}</option>
					<option value="Oceania">{t('filters_continent_oceania')}</option>
				</select>
			</div>
			<div>
				<label htmlFor="status-filter">{t('filters_status')}</label>
				<select 
					value={filters.status || 'all'} 
					onChange={(e) => setFilters({ status: e.target.value === 'all' ? '' : e.target.value })} 
					id="status-filter" 
					name="status-filter"
				>
					<option value="all">{t('filters_all_statuses')}</option>
					<option value="mandated">{t('status_mandated')}</option>
					<option value="permitted">{t('status_permitted')}</option>
					<option value="planned">{t('status_planned')}</option>
					<option value="none">{t('status_none')}</option>
				</select>
			</div>
		</div>
	);
}