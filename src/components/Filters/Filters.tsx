import React, { useEffect, useState } from 'react';
import { Textbox, Select, Option } from 'carbon-react';
import { useStore } from '../../store/useStore';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useI18n } from '../../i18n';
import { sanitizeSearchQuery } from '../../utils/security';

export const Filters = React.memo(function Filters() {
	const { filters, setFilters } = useStore();
	const { t } = useI18n();
	const [search, setSearch] = useState(filters.search);
	const debouncedSearch = useDebouncedValue(search, 250);

	useEffect(() => {
		setFilters({ search: debouncedSearch });
	}, [debouncedSearch, setFilters]);

	return (
		<div className="card">
			<div className="row wrap" style={{ gap: 16, alignItems: 'flex-end' }}>
				<div style={{ minWidth: '250px', flex: '1 1 250px' }}>
					<Textbox
						label={t('filters_search_countries')}
						placeholder={t('filters_search_placeholder')}
						value={search}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
							const sanitizedValue = sanitizeSearchQuery(e.target.value);
							setSearch(sanitizedValue);
						}}
						size="medium"
					/>
				</div>
				<div style={{ minWidth: '180px', flex: '0 1 180px' }}>
					<Textbox
						type="date"
						label={t('filters_updated_after')}
						value={filters.lastChangeAfter || ''}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({ lastChangeAfter: e.target.value })}
						size="medium"
					/>
				</div>
				<div style={{ minWidth: '140px', flex: '0 1 140px' }}>
					<Select 
						label={t('filters_status')}
						value={filters.status || 'all'} 
						onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters({ status: e.target.value === 'all' ? '' : e.target.value })}
						size="medium"
					>
						<Option value="all" text={t('filters_all_statuses')} />
						<Option value="mandated" text={t('status_mandated')} />
						<Option value="permitted" text={t('status_permitted')} />
						<Option value="planned" text={t('status_planned')} />
						<Option value="none" text={t('status_none')} />
					</Select>
				</div>
			</div>
		</div>
	);
});