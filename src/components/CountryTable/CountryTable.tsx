import React, { useMemo, useState, useCallback } from 'react';
import { createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import type { Country } from '@types';
import { Badge } from '../common/Badge';
import { useStore } from '../../store/useStore';
import { format } from 'date-fns';

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
	onOpenModal 
}: { 
	country: Country;
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

	return (
		<button 
			type="button" 
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			className="details-button"
			aria-label={`View detailed compliance information for ${country.name}`}
			tabIndex={0}
		>
			Details
		</button>
	);
});

DetailsButton.displayName = 'DetailsButton';

export function CountryTable() {
	const { filtered, setSelected } = useStore();
	const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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

	// Memoized columns to prevent recreation on every render
	const columns = useMemo(() => [
		columnHelper.accessor('name', { 
			header: 'Country', 
			cell: ({ row, getValue }) => {
				const country = row.original;
				const isExpanded = expanded[country.id];
				
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
								title={getValue<string>()}
							>
								{getValue<string>()}
							</span>
						</div>
						<DetailsButton
							country={country}
							onOpenModal={handleOpenModal}
						/>
					</div>
				);
			}
		}),
		columnHelper.accessor('continent', { 
			header: 'Continent', 
			cell: info => (
				<span className="continent-cell" title={info.getValue()}>
					{info.getValue()}
				</span>
			)
		}),
		columnHelper.display({ 
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
		columnHelper.display({ 
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
		columnHelper.display({ 
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
		columnHelper.display({ 
			id: 'periodic', 
			header: 'Periodic E-reporting', 
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
		}),
	], [expanded, handleOpenModal, toggleExpanded]);

	// Memoized table instance
	const table = useReactTable({
		data: filtered,
		columns,
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