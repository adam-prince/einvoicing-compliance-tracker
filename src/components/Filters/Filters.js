import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsxs("div", { className: "card row wrap", style: { gap: 12 }, children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "country-search", children: t('filters_search_countries') }), _jsx("input", { type: "text", placeholder: t('filters_search_placeholder'), value: search, onChange: (e) => setSearch(e.target.value), style: { minWidth: 220 }, id: "country-search", name: "country-search" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "last-change-date", children: t('filters_updated_after') }), _jsx("input", { type: "date", id: "last-change-date", name: "last-change-date", value: filters.lastChangeAfter || '', onChange: (e) => setFilters({ lastChangeAfter: e.target.value }) })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "continent-filter", children: t('filters_continent') }), _jsxs("select", { value: filters.continent || 'all', onChange: (e) => setFilters({ continent: e.target.value === 'all' ? '' : e.target.value }), id: "continent-filter", name: "continent-filter", children: [_jsx("option", { value: "all", children: t('filters_all_continents') }), _jsx("option", { value: "Europe", children: t('filters_continent_europe') }), _jsx("option", { value: "Asia", children: t('filters_continent_asia') }), _jsx("option", { value: "Africa", children: t('filters_continent_africa') }), _jsx("option", { value: "Americas", children: t('filters_continent_americas') }), _jsx("option", { value: "Oceania", children: t('filters_continent_oceania') })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "status-filter", children: t('filters_status') }), _jsxs("select", { value: filters.status || 'all', onChange: (e) => setFilters({ status: e.target.value === 'all' ? '' : e.target.value }), id: "status-filter", name: "status-filter", children: [_jsx("option", { value: "all", children: t('filters_all_statuses') }), _jsx("option", { value: "mandated", children: t('status_mandated') }), _jsx("option", { value: "permitted", children: t('status_permitted') }), _jsx("option", { value: "planned", children: t('status_planned') }), _jsx("option", { value: "none", children: t('status_none') })] })] })] }));
}
