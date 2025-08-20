import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsxs("div", { className: "card row wrap", style: { gap: 12 }, children: [_jsx("input", { type: "text", placeholder: "Search countries...", value: search, onChange: (e) => setSearch(e.target.value), style: { minWidth: 220 }, id: "country-search", name: "country-search" }), _jsx("input", { type: "date", id: "last-change-date", name: "last-change-date", value: filters.lastChangeAfter || '', onChange: (e) => setFilters({ lastChangeAfter: e.target.value }) }), _jsxs("select", { value: filters.continent || 'all', onChange: (e) => setFilters({ continent: e.target.value === 'all' ? '' : e.target.value }), id: "continent-filter", name: "continent-filter", children: [_jsx("option", { value: "all", children: "All continents" }), _jsx("option", { value: "Europe", children: "Europe" }), _jsx("option", { value: "Asia", children: "Asia" }), _jsx("option", { value: "Africa", children: "Africa" }), _jsx("option", { value: "Americas", children: "Americas" }), _jsx("option", { value: "Oceania", children: "Oceania" })] }), _jsxs("select", { value: filters.status || 'all', onChange: (e) => setFilters({ status: e.target.value === 'all' ? '' : e.target.value }), id: "status-filter", name: "status-filter", children: [_jsx("option", { value: "all", children: "All statuses" }), _jsx("option", { value: "mandated", children: "Mandated" }), _jsx("option", { value: "permitted", children: "Permitted" }), _jsx("option", { value: "planned", children: "Planned" }), _jsx("option", { value: "none", children: "None" })] })] }));
}
