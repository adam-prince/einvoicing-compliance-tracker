import { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

export function Filters() {
	const { filters, setFilters } = useStore();
	const [search, setSearch] = useState(filters.search);
	const debouncedSearch = useDebouncedValue(search, 250);

	useEffect(() => {
		setFilters({ search: debouncedSearch });
	}, [debouncedSearch, setFilters]);

	return (
		<div className="card row wrap" style={{ gap: 12 }}>
			<input
				type="text"
				placeholder="Search countries..."
				value={search}
				onChange={(e) => setSearch(e.target.value)}
				style={{ minWidth: 220 }}
				id="country-search"
				name="country-search"
			/>
			<input
				type="date"
				id="last-change-date"
				name="last-change-date"
				value={filters.lastChangeAfter || ''}
				onChange={(e) => setFilters({ lastChangeAfter: e.target.value })}
			/>
			<select 
				value={filters.continent || 'all'} 
				onChange={(e) => setFilters({ continent: e.target.value === 'all' ? '' : e.target.value })} 
				id="continent-filter" 
				name="continent-filter"
			>
				<option value="all">All continents</option>
				<option value="Europe">Europe</option>
				<option value="Asia">Asia</option>
				<option value="Africa">Africa</option>
				<option value="Americas">Americas</option>
				<option value="Oceania">Oceania</option>
			</select>
			<select 
				value={filters.status || 'all'} 
				onChange={(e) => setFilters({ status: e.target.value === 'all' ? '' : e.target.value })} 
				id="status-filter" 
				name="status-filter"
			>
				<option value="all">All statuses</option>
				<option value="mandated">Mandated</option>
				<option value="permitted">Permitted</option>
				<option value="planned">Planned</option>
				<option value="none">None</option>
			</select>
		</div>
	);
}