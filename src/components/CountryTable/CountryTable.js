import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { Button } from 'carbon-react';
import { Badge } from '../common/Badge';
import { useStore } from '../../store/useStore';
import { format } from 'date-fns';
import { useI18n } from '../../i18n';
import { ColumnManager } from './ColumnManager';
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
const DetailsButton = React.memo(({ country, onOpenModal, t }) => {
    const handleClick = useCallback((e) => {
        onOpenModal(country, e);
    }, [country, onOpenModal]);
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenModal(country, e);
        }
    }, [country, onOpenModal]);
    return (_jsx(Button, { onClick: handleClick, onKeyDown: handleKeyDown, size: "small", variant: "secondary", "aria-label": t('button_view_details_aria') ? t('button_view_details_aria').replace('{country}', country.name) : `View detailed compliance information for ${country.name}`, children: t('button_details') || 'Details' }));
});
DetailsButton.displayName = 'DetailsButton';
// Default column configurations - Details first, Country second, Continent third
const getDefaultColumnConfigs = (t) => [
    { id: 'details', label: t('button_details') || 'Details', visible: true, order: 0 },
    { id: 'name', label: t('table_country') || 'Country', visible: true, order: 1 },
    { id: 'continent', label: t('table_continent') || 'Continent', visible: true, order: 2 },
    { id: 'b2g', label: 'B2G', visible: true, order: 3 },
    { id: 'b2b', label: 'B2B', visible: true, order: 4 },
    { id: 'b2c', label: 'B2C', visible: true, order: 5 },
    { id: 'periodic', label: t('table_periodic') || 'Periodic E-reporting', visible: true, order: 6 }
];
// Load column config from localStorage
const loadColumnConfig = (t) => {
    try {
        const saved = localStorage.getItem('einvoicing-column-config');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Update labels with current translations but keep order/visibility
            return parsed.map(col => ({
                ...col,
                label: getDefaultColumnConfigs(t).find(def => def.id === col.id)?.label || col.label
            }));
        }
    }
    catch (error) {
        console.warn('Failed to load column config:', error);
    }
    return getDefaultColumnConfigs(t);
};
// Save column config to localStorage
const saveColumnConfig = (columns) => {
    try {
        localStorage.setItem('einvoicing-column-config', JSON.stringify(columns));
    }
    catch (error) {
        console.warn('Failed to save column config:', error);
    }
};
export const CountryTable = React.memo(function CountryTable() {
    const { filtered, setSelected } = useStore();
    const { t, displayRegionName } = useI18n();
    const [expanded, setExpanded] = useState({});
    const [showColumnManager, setShowColumnManager] = useState(false);
    const [columnConfigs, setColumnConfigs] = useState(() => loadColumnConfig(t));
    const [sorting, setSorting] = useState([
        { id: 'continent', desc: false },
        { id: 'name', desc: false }
    ]);
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
    // Update column config when translations change
    useEffect(() => {
        setColumnConfigs(prev => prev.map(col => ({
            ...col,
            label: getDefaultColumnConfigs(t).find(def => def.id === col.id)?.label || col.label
        })));
    }, [t]);
    // Handle column configuration changes
    const handleColumnsChange = useCallback((newColumns) => {
        setColumnConfigs(newColumns);
        saveColumnConfig(newColumns);
    }, []);
    // Create all column definitions
    const allColumnDefinitions = useMemo(() => ({
        details: columnHelper.display({
            id: 'details',
            header: t('button_details') || 'Details',
            size: 80,
            cell: ({ row }) => {
                const country = row.original;
                return (_jsx(DetailsButton, { country: country, onOpenModal: handleOpenModal, t: t }));
            }
        }),
        name: columnHelper.accessor('name', {
            id: 'name',
            header: t('table_country') || 'Country',
            cell: ({ row, getValue }) => {
                const country = row.original;
                const isExpanded = expanded[country.id];
                const localizedName = displayRegionName(country.isoCode2, getValue());
                return (_jsx("div", { className: "country-name-cell", children: _jsxs("div", { className: "country-name-content", children: [_jsx(ExpandButton, { isExpanded: isExpanded, onToggle: () => toggleExpanded(country.id), countryName: country.name }), _jsx("span", { className: "country-name", title: localizedName, children: localizedName })] }) }));
            }
        }),
        continent: columnHelper.accessor('continent', {
            id: 'continent',
            header: t('table_continent') || 'Continent',
            cell: info => (_jsx("span", { className: "continent-cell", title: info.getValue(), children: info.getValue() }))
        }),
        b2g: columnHelper.display({
            id: 'b2g',
            header: 'B2G',
            cell: ({ row }) => (_jsx(StatusCell, { country: row.original, type: "b2g", onOpenModal: handleOpenModal }))
        }),
        b2b: columnHelper.display({
            id: 'b2b',
            header: 'B2B',
            cell: ({ row }) => (_jsx(StatusCell, { country: row.original, type: "b2b", onOpenModal: handleOpenModal }))
        }),
        b2c: columnHelper.display({
            id: 'b2c',
            header: 'B2C',
            cell: ({ row }) => (_jsx(StatusCell, { country: row.original, type: "b2c", onOpenModal: handleOpenModal }))
        }),
        periodic: columnHelper.display({
            id: 'periodic',
            header: t('table_periodic') || 'Periodic E-reporting',
            cell: ({ row }) => {
                const status = row.original.eInvoicing.periodic?.status || 'N/A';
                return (_jsx("span", { className: "periodic-status", title: `Periodic e-reporting status: ${status}`, children: status }));
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
    return (_jsxs("div", { className: "country-table-container", children: [_jsx("div", { className: "table-wrapper", role: "region", "aria-label": "E-invoicing compliance data", children: _jsx("div", { className: "table-container", children: _jsxs("table", { role: "table", "aria-label": "Countries and their e-invoicing compliance status", className: "compliance-table", children: [_jsx("colgroup", { children: columns.map((column) => (_jsx("col", { className: `col-${column.id}` }, column.id))) }), _jsx("thead", { children: table.getHeaderGroups().map(hg => (_jsx("tr", { role: "row", children: hg.headers.map(h => (_jsxs("th", { onClick: h.column.getToggleSortingHandler(), className: "sortable-header", role: "columnheader", "aria-sort": h.column.getIsSorted() === 'asc' ? 'ascending' :
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
                                }) })] }) }) }), showColumnManager && (_jsx(ColumnManager, { columns: columnConfigs, onColumnsChange: handleColumnsChange, onClose: () => setShowColumnManager(false) }))] }));
});
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
