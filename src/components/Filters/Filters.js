import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsx("div", { className: "card", children: _jsxs("div", { className: "row wrap", style: { gap: 16, alignItems: 'flex-end' }, children: [_jsx("div", { style: { minWidth: '250px', flex: '1 1 250px' }, children: _jsx(Textbox, { label: t('filters_search_countries'), placeholder: t('filters_search_placeholder'), value: search, onChange: (e) => {
                            const sanitizedValue = sanitizeSearchQuery(e.target.value);
                            setSearch(sanitizedValue);
                        }, size: "medium" }) }), _jsx("div", { style: { minWidth: '180px', flex: '0 1 180px' }, children: _jsx(Textbox, { type: "date", label: t('filters_updated_after'), value: filters.lastChangeAfter || '', onChange: (e) => setFilters({ lastChangeAfter: e.target.value }), size: "medium" }) }), _jsx("div", { style: { minWidth: '160px', flex: '0 1 160px' }, children: _jsxs(Select, { label: t('filters_continent'), value: filters.continent || 'all', onChange: (e) => setFilters({ continent: e.target.value === 'all' ? '' : e.target.value }), size: "medium", children: [_jsx(Option, { value: "all", text: t('filters_all_continents') }), _jsx(Option, { value: "Europe", text: t('filters_continent_europe') }), _jsx(Option, { value: "Asia", text: t('filters_continent_asia') }), _jsx(Option, { value: "Africa", text: t('filters_continent_africa') }), _jsx(Option, { value: "Americas", text: t('filters_continent_americas') }), _jsx(Option, { value: "Oceania", text: t('filters_continent_oceania') })] }) }), _jsx("div", { style: { minWidth: '140px', flex: '0 1 140px' }, children: _jsxs(Select, { label: t('filters_status'), value: filters.status || 'all', onChange: (e) => setFilters({ status: e.target.value === 'all' ? '' : e.target.value }), size: "medium", children: [_jsx(Option, { value: "all", text: t('filters_all_statuses') }), _jsx(Option, { value: "mandated", text: t('status_mandated') }), _jsx(Option, { value: "permitted", text: t('status_permitted') }), _jsx(Option, { value: "planned", text: t('status_planned') }), _jsx(Option, { value: "none", text: t('status_none') })] }) })] }) }));
});
