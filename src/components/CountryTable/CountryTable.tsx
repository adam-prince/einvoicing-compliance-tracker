import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, useReactTable, SortingState, ColumnDef } from '@tanstack/react-table';
import { Button, FlatTable, FlatTableHead, FlatTableHeader, FlatTableBody, FlatTableRow, FlatTableCell } from 'carbon-react/lib';
import type { Country } from '@types';
import { Badge } from '../common/Badge';
import { useStore } from '../../store/useStore';
import { format } from 'date-fns';
import { useI18n } from '../../i18n';
import { ColumnManager, type ColumnConfig } from './ColumnManager';

const columnHelper = createColumnHelper<Country>();

// Memoized components for better performance
const StatusCell = React.memo(({ 
	country, 
	type, 
	onOpenModal 
}: { 
	country: Country; 
	type: 'b2g' | 'b2b' | 'b2c';
	onOpenModal: (country: Country, e: React.MouseEvent) => void;
}) => {
	const handleClick = useCallback((e: React.MouseEvent) => {
		onOpenModal(country, e);
	}, [country, onOpenModal]);

	const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onOpenModal(country, e as any);
		}
	}, [country, onOpenModal]);

	const status = country.eInvoicing[type].status;

	return (
		<button 
			type="button"
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			className="status-cell-button"
			aria-label={`${type.toUpperCase()} compliance status: ${status}. Click for details about ${country.name}`}
			tabIndex={0}
		>
			<Badge status={status} />
		</button>
	);
});

StatusCell.displayName = 'StatusCell';

const ExpandButton = React.memo(({ 
	isExpanded, 
	onToggle, 
	countryName 
}: { 
	isExpanded: boolean; 
	onToggle: () => void;
	countryName: string;
}) => {
	const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onToggle();
		}
	}, [onToggle]);

	return (
		<button
			onClick={onToggle}
			onKeyDown={handleKeyDown}
			className="expand-button"
			aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details for ${countryName}`}
			aria-expanded={isExpanded}
			tabIndex={0}
		>
			{isExpanded ? '▾' : '▸'}
		</button>
	);
});

ExpandButton.displayName = 'ExpandButton';

const DetailsButton = React.memo(({ 
	country, 
	onOpenModal,
	t
}: { 
	country: Country;
	onOpenModal: (country: Country, e: React.MouseEvent) => void;
	t: (key: string) => string;
}) => {
	const handleClick = useCallback((e: React.MouseEvent) => {
		onOpenModal(country, e);
	}, [country, onOpenModal]);

	const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onOpenModal(country, e as any);
		}
	}, [country, onOpenModal]);

	return (
		<Button 
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			size="small"
			variant="secondary"
			aria-label={t('button_view_details_aria') ? t('button_view_details_aria').replace('{country}', country.name) : `View detailed compliance information for ${country.name}`}
		>
			{t('button_details') || 'Details'}
		</Button>
	);
});

DetailsButton.displayName = 'DetailsButton';

// Default column configurations - Details first, Country second, Continent third
const getDefaultColumnConfigs = (t: any): ColumnConfig[] => [
	{ id: 'details', label: t('button_details') || 'Details', visible: true, order: 0 },
	{ id: 'name', label: t('table_country') || 'Country', visible: true, order: 1 },
	{ id: 'continent', label: t('table_continent') || 'Continent', visible: true, order: 2 },
	{ id: 'b2g', label: 'B2G', visible: true, order: 3 },
	{ id: 'b2b', label: 'B2B', visible: true, order: 4 },
	{ id: 'b2c', label: 'B2C', visible: true, order: 5 },
	{ id: 'periodic', label: t('table_periodic') || 'Periodic E-reporting', visible: true, order: 6 }
];

// Load column config from localStorage
const loadColumnConfig = (t: any): ColumnConfig[] => {
	try {
		const saved = localStorage.getItem('einvoicing-column-config');
		if (saved) {
			const parsed = JSON.parse(saved) as ColumnConfig[];
			// Update labels with current translations but keep order/visibility
			return parsed.map(col => ({
				...col,
				label: getDefaultColumnConfigs(t).find(def => def.id === col.id)?.label || col.label
			}));
		}
	} catch (error) {
		console.warn('Failed to load column config:', error);
	}
	return getDefaultColumnConfigs(t);
};

// Save column config to localStorage
const saveColumnConfig = (columns: ColumnConfig[]) => {
	try {
		localStorage.setItem('einvoicing-column-config', JSON.stringify(columns));
	} catch (error) {
		console.warn('Failed to save column config:', error);
	}
};

export function CountryTable() {
	const { filtered, setSelected } = useStore();
	const { t, displayRegionName } = useI18n();
	const [expanded, setExpanded] = useState<Record<string, boolean>>({});
	const [showColumnManager, setShowColumnManager] = useState(false);
	const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>(() => loadColumnConfig(t));
	const [sorting, setSorting] = useState<SortingState>([
		{ id: 'continent', desc: false },
		{ id: 'name', desc: false }
	]);

	// Optimized modal handler with proper event handling
	const handleOpenModal = useCallback((country: Country, e: React.MouseEvent | KeyboardEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setSelected(country);
		history.replaceState(null, '', `#country=${encodeURIComponent(country.id)}`);
	}, [setSelected]);

	// Optimized expand toggle
	const toggleExpanded = useCallback((id: string) => {
		setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
	}, []);

	// Update column config when translations change
	useEffect(() => {
		setColumnConfigs(prev => 
			prev.map(col => ({
				...col,
				label: getDefaultColumnConfigs(t).find(def => def.id === col.id)?.label || col.label
			}))
		);
	}, [t]);

	// Handle column configuration changes
	const handleColumnsChange = useCallback((newColumns: ColumnConfig[]) => {
		setColumnConfigs(newColumns);
		saveColumnConfig(newColumns);
	}, []);

	// Create all column definitions
	const allColumnDefinitions = useMemo<Record<string, ColumnDef<Country, any>>>(() => ({
		details: columnHelper.display({ 
			id: 'details',
			header: t('button_details') || 'Details',
			size: 80,
			cell: ({ row }) => {
				const country = row.original;
				return (
					<DetailsButton
						country={country}
						onOpenModal={handleOpenModal}
						t={t}
					/>
				);
			}
		}),
		name: columnHelper.accessor('name', { 
			id: 'name',
			header: t('table_country') || 'Country', 
			cell: ({ row, getValue }) => {
				const country = row.original;
				const isExpanded = expanded[country.id];
				const localizedName = displayRegionName(country.isoCode2, getValue<string>());
				
				return (
					<div className="country-name-cell">
						<div className="country-name-content">
							<ExpandButton
								isExpanded={isExpanded}
								onToggle={() => toggleExpanded(country.id)}
								countryName={country.name}
							/>
							<span 
								className="country-name"
								title={localizedName}
							>
								{localizedName}
							</span>
						</div>
					</div>
				);
			}
		}),
		continent: columnHelper.accessor('continent', { 
			id: 'continent',
			header: t('table_continent') || 'Continent', 
			cell: info => (
				<span className="continent-cell" title={info.getValue()}>
					{info.getValue()}
				</span>
			)
		}),
		b2g: columnHelper.display({ 
			id: 'b2g', 
			header: 'B2G', 
			cell: ({ row }) => (
				<StatusCell
					country={row.original}
					type="b2g"
					onOpenModal={handleOpenModal}
				/>
			)
		}),
		b2b: columnHelper.display({ 
			id: 'b2b', 
			header: 'B2B', 
			cell: ({ row }) => (
				<StatusCell
					country={row.original}
					type="b2b"
					onOpenModal={handleOpenModal}
				/>
			)
		}),
		b2c: columnHelper.display({ 
			id: 'b2c', 
			header: 'B2C', 
			cell: ({ row }) => (
				<StatusCell
					country={row.original}
					type="b2c"
					onOpenModal={handleOpenModal}
				/>
			)
		}),
		periodic: columnHelper.display({ 
			id: 'periodic', 
			header: t('table_periodic') || 'Periodic E-reporting', 
			cell: ({ row }) => {
				const status = row.original.eInvoicing.periodic?.status || 'N/A';
				return (
					<span 
						className="periodic-status"
						title={`Periodic e-reporting status: ${status}`}
					>
						{status}
					</span>
				);
			}
		})
	}), [expanded, handleOpenModal, toggleExpanded, t, displayRegionName]);

	// Create visible columns in the correct order
	const columns = useMemo(() => {
		return columnConfigs
			.filter(config => config.visible)
			.sort((a, b) => a.order - b.order)
			.map(config => allColumnDefinitions[config.id])
			.filter(Boolean);
	}, [columnConfigs, allColumnDefinitions]);

	// Memoized table instance with sorting
	const table = useReactTable({
		data: filtered,
		columns,
		state: {
			sorting,
		},
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	// Optimized row click handler
	const handleRowClick = useCallback((e: React.MouseEvent, countryId: string) => {
		const target = e.target as HTMLElement;
		
		// Don't expand if clicking on buttons or interactive elements
		if (target.closest('button') || target.closest('a') || target.closest('[data-open-modal="true"]')) {
			return;
		}
		
		toggleExpanded(countryId);
	}, [toggleExpanded]);

	// Show loading state
	if (filtered.length === 0) {
		return (
			<div className="card">
				<div className="table-loading">
					<div className="skeleton-table">
						{Array.from({ length: 5 }).map((_, i) => (
							<div key={i} className="skeleton-row">
								<div className="skeleton" style={{ height: 48 }} />
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="card">
			<div className="table-container" role="region" aria-label="E-invoicing compliance data">
				<table role="table" aria-label="Countries and their e-invoicing compliance status">
					<colgroup>
						{columns.map((column) => (
							<col key={column.id} className={`col-${column.id}`} />
						))}
					</colgroup>
					<thead>
						{table.getHeaderGroups().map(hg => (
							<tr key={hg.id} role="row">
								{hg.headers.map(h => (
									<th 
										key={h.id} 
										onClick={h.column.getToggleSortingHandler()} 
										className="sortable-header"
										role="columnheader"
										aria-sort={
											h.column.getIsSorted() === 'asc' ? 'ascending' :
											h.column.getIsSorted() === 'desc' ? 'descending' :
											'none'
										}
										tabIndex={0}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.preventDefault();
												h.column.getToggleSortingHandler()?.(e as any);
											}
										}}
									>
										{flexRender(h.column.columnDef.header, h.getContext())}
										{h.column.getIsSorted() && (
											<span aria-hidden="true">
												{h.column.getIsSorted() === 'asc' ? ' ↑' : ' ↓'}
											</span>
										)}
									</th>
								))}
							</tr>
						))}
					</thead>
					<tbody>
						{table.getRowModel().rows.map(r => {
							const country = r.original;
							const isExpanded = expanded[country.id];
							
							return (
								<React.Fragment key={r.id}>
									<tr 
										className="data-row"
										onClick={(e) => handleRowClick(e, country.id)}
										role="row"
										aria-expanded={isExpanded}
									>
										{r.getVisibleCells().map((c) => (
											<td key={c.id} role="gridcell">
												{flexRender(c.column.columnDef.cell, c.getContext())}
											</td>
										))}
									</tr>

									{isExpanded && (
										<tr 
											className="expand-row" 
											role="row"
											aria-label={`Implementation dates for ${country.name}`}
										>
											<td></td>
											<td></td>
											<td>
												<div className="badge gray" title="B2G implementation date">
													B2G: {formatImpl(country.eInvoicing.b2g.implementationDate)}
												</div>
											</td>
											<td>
												<div className="badge gray" title="B2B implementation date">
													B2B: {formatImpl(country.eInvoicing.b2b.implementationDate)}
												</div>
											</td>
											<td>
												<div className="badge gray" title="B2C implementation date">
													B2C: {formatImpl(country.eInvoicing.b2c.implementationDate)}
												</div>
											</td>
											<td></td>
										</tr>
									)}
								</React.Fragment>
							);
						})}
					</tbody>
				</table>
			</div>
			{showColumnManager && (
				<ColumnManager
					columns={columnConfigs}
					onColumnsChange={handleColumnsChange}
					onClose={() => setShowColumnManager(false)}
				/>
			)}
		</div>
	);
}

function formatImpl(dateIso?: string): string {
	if (!dateIso) return 'None';
	try { 
		return format(new Date(dateIso), 'dd/MM/yyyy'); 
	} catch { 
		return 'Invalid Date'; 
	}
}