import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useMemo, useState, useCallback } from 'react';
import { createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { Badge } from '../common/Badge';
import { useStore } from '../../store/useStore';
import { format } from 'date-fns';
const columnHelper = createColumnHelper();
// Memoized components for better performance
const StatusCell = React.memo(({ country, type, onOpenModal }) => {
    const handleClick = useCallback((e) => {
        onOpenModal(country, e);
    }, [country, onOpenModal]);
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenModal(country, e);
        }
    }, [country, onOpenModal]);
    const status = country.eInvoicing[type].status;
    return (_jsx("button", { type: "button", onClick: handleClick, onKeyDown: handleKeyDown, className: "status-cell-button", "aria-label": `${type.toUpperCase()} compliance status: ${status}. Click for details about ${country.name}`, tabIndex: 0, children: _jsx(Badge, { status: status }) }));
});
StatusCell.displayName = 'StatusCell';
const ExpandButton = React.memo(({ isExpanded, onToggle, countryName }) => {
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
        }
    }, [onToggle]);
    return (_jsx("button", { onClick: onToggle, onKeyDown: handleKeyDown, className: "expand-button", "aria-label": `${isExpanded ? 'Collapse' : 'Expand'} details for ${countryName}`, "aria-expanded": isExpanded, tabIndex: 0, children: isExpanded ? '▾' : '▸' }));
});
ExpandButton.displayName = 'ExpandButton';
const DetailsButton = React.memo(({ country, onOpenModal }) => {
    const handleClick = useCallback((e) => {
        onOpenModal(country, e);
    }, [country, onOpenModal]);
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenModal(country, e);
        }
    }, [country, onOpenModal]);
    return (_jsx("button", { type: "button", onClick: handleClick, onKeyDown: handleKeyDown, className: "details-button", "aria-label": `View detailed compliance information for ${country.name}`, tabIndex: 0, children: "Details" }));
});
DetailsButton.displayName = 'DetailsButton';
export function CountryTable() {
    const { filtered, setSelected } = useStore();
    const [expanded, setExpanded] = useState({});
    // Optimized modal handler with proper event handling
    const handleOpenModal = useCallback((country, e) => {
        e.preventDefault();
        e.stopPropagation();
        setSelected(country);
        history.replaceState(null, '', `#country=${encodeURIComponent(country.id)}`);
    }, [setSelected]);
    // Optimized expand toggle
    const toggleExpanded = useCallback((id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    }, []);
    // Memoized columns to prevent recreation on every render
    const columns = useMemo(() => [
        columnHelper.accessor('name', {
            header: 'Country',
            cell: ({ row, getValue }) => {
                const country = row.original;
                const isExpanded = expanded[country.id];
                return (_jsxs("div", { className: "country-name-cell", children: [_jsxs("div", { className: "country-name-content", children: [_jsx(ExpandButton, { isExpanded: isExpanded, onToggle: () => toggleExpanded(country.id), countryName: country.name }), _jsx("span", { className: "country-name", title: getValue(), children: getValue() })] }), _jsx(DetailsButton, { country: country, onOpenModal: handleOpenModal })] }));
            }
        }),
        columnHelper.accessor('continent', {
            header: 'Continent',
            cell: info => (_jsx("span", { className: "continent-cell", title: info.getValue(), children: info.getValue() }))
        }),
        columnHelper.display({
            id: 'b2g',
            header: 'B2G',
            cell: ({ row }) => (_jsx(StatusCell, { country: row.original, type: "b2g", onOpenModal: handleOpenModal }))
        }),
        columnHelper.display({
            id: 'b2b',
            header: 'B2B',
            cell: ({ row }) => (_jsx(StatusCell, { country: row.original, type: "b2b", onOpenModal: handleOpenModal }))
        }),
        columnHelper.display({
            id: 'b2c',
            header: 'B2C',
            cell: ({ row }) => (_jsx(StatusCell, { country: row.original, type: "b2c", onOpenModal: handleOpenModal }))
        }),
        columnHelper.display({
            id: 'periodic',
            header: 'Periodic E-reporting',
            cell: ({ row }) => {
                const status = row.original.eInvoicing.periodic?.status || 'N/A';
                return (_jsx("span", { className: "periodic-status", title: `Periodic e-reporting status: ${status}`, children: status }));
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
    const handleRowClick = useCallback((e, countryId) => {
        const target = e.target;
        // Don't expand if clicking on buttons or interactive elements
        if (target.closest('button') || target.closest('a') || target.closest('[data-open-modal="true"]')) {
            return;
        }
        toggleExpanded(countryId);
    }, [toggleExpanded]);
    // Show loading state
    if (filtered.length === 0) {
        return (_jsx("div", { className: "card", children: _jsx("div", { className: "table-loading", children: _jsx("div", { className: "skeleton-table", children: Array.from({ length: 5 }).map((_, i) => (_jsx("div", { className: "skeleton-row", children: _jsx("div", { className: "skeleton", style: { height: 48 } }) }, i))) }) }) }));
    }
    return (_jsx("div", { className: "card", children: _jsx("div", { className: "table-container", role: "region", "aria-label": "E-invoicing compliance data", children: _jsxs("table", { role: "table", "aria-label": "Countries and their e-invoicing compliance status", children: [_jsx("thead", { children: table.getHeaderGroups().map(hg => (_jsx("tr", { role: "row", children: hg.headers.map(h => (_jsxs("th", { onClick: h.column.getToggleSortingHandler(), className: "sortable-header", role: "columnheader", "aria-sort": h.column.getIsSorted() === 'asc' ? 'ascending' :
                                    h.column.getIsSorted() === 'desc' ? 'descending' :
                                        'none', tabIndex: 0, onKeyDown: (e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        h.column.getToggleSortingHandler()?.(e);
                                    }
                                }, children: [flexRender(h.column.columnDef.header, h.getContext()), h.column.getIsSorted() && (_jsx("span", { "aria-hidden": "true", children: h.column.getIsSorted() === 'asc' ? ' ↑' : ' ↓' }))] }, h.id))) }, hg.id))) }), _jsx("tbody", { children: table.getRowModel().rows.map(r => {
                            const country = r.original;
                            const isExpanded = expanded[country.id];
                            return (_jsxs(React.Fragment, { children: [_jsx("tr", { className: "data-row", onClick: (e) => handleRowClick(e, country.id), role: "row", "aria-expanded": isExpanded, children: r.getVisibleCells().map((c) => (_jsx("td", { role: "gridcell", children: flexRender(c.column.columnDef.cell, c.getContext()) }, c.id))) }), isExpanded && (_jsxs("tr", { className: "expand-row", role: "row", "aria-label": `Implementation dates for ${country.name}`, children: [_jsx("td", {}), _jsx("td", {}), _jsx("td", { children: _jsxs("div", { className: "badge gray", title: "B2G implementation date", children: ["B2G: ", formatImpl(country.eInvoicing.b2g.implementationDate)] }) }), _jsx("td", { children: _jsxs("div", { className: "badge gray", title: "B2B implementation date", children: ["B2B: ", formatImpl(country.eInvoicing.b2b.implementationDate)] }) }), _jsx("td", { children: _jsxs("div", { className: "badge gray", title: "B2C implementation date", children: ["B2C: ", formatImpl(country.eInvoicing.b2c.implementationDate)] }) }), _jsx("td", {})] }))] }, r.id));
                        }) })] }) }) }));
}
function formatImpl(dateIso) {
    if (!dateIso)
        return 'None';
    try {
        return format(new Date(dateIso), 'dd/MM/yyyy');
    }
    catch {
        return 'Invalid Date';
    }
}
