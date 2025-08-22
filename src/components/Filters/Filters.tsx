import { useEffect, useState } from 'react';
import { Textbox, Select, Option } from 'carbon-react/lib';
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
				<Textbox
					label={t('filters_search_countries')}
					placeholder={t('filters_search_placeholder')}
					value={search}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
					labelWidth="25%"
				/>
			</div>
			<div>
				<Textbox
					type="date"
					label={t('filters_updated_after')}
					value={filters.lastChangeAfter || ''}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({ lastChangeAfter: e.target.value })}
					labelWidth="25%"
				/>
			</div>
			<div>
				<Select 
					label={t('filters_continent')}
					value={filters.continent || 'all'} 
					onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters({ continent: e.target.value === 'all' ? '' : e.target.value })}
					labelWidth="25%"
				>
					<Option value="all" text={t('filters_all_continents')} />
					<Option value="Europe" text={t('filters_continent_europe')} />
					<Option value="Asia" text={t('filters_continent_asia')} />
					<Option value="Africa" text={t('filters_continent_africa')} />
					<Option value="Americas" text={t('filters_continent_americas')} />
					<Option value="Oceania" text={t('filters_continent_oceania')} />
				</Select>
			</div>
			<div>
				<Select 
					label={t('filters_status')}
					value={filters.status || 'all'} 
					onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters({ status: e.target.value === 'all' ? '' : e.target.value })}
					labelWidth="25%"
				>
					<Option value="all" text={t('filters_all_statuses')} />
					<Option value="mandated" text={t('status_mandated')} />
					<Option value="permitted" text={t('status_permitted')} />
					<Option value="planned" text={t('status_planned')} />
					<Option value="none" text={t('status_none')} />
				</Select>
			</div>
		</div>
	);
}