import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useCallback } from 'react';
import { useStore } from './store/useStore';
import complianceData from './data/compliance-data.json';
import { CountryTable } from './components/CountryTable/CountryTable';
import { CountryDetail } from './components/CountryDetail/CountryDetail';
import { Filters } from './components/Filters/Filters';
import { QuickStats } from './components/CountryTable/QuickStats';
import { ExportButtons } from './components/CountryTable/ExportButtons';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { ErrorMessage } from './components/common/ErrorBoundary';
import { loadSavedTheme } from './utils/theme';
import { ComplianceDataService } from './services/complianceDataService';
import { useI18n } from './i18n';
export function App() {
    const { setCountries, setLoading, setError, countries, selected, setSelected, loading, error, language, setLanguage, } = useStore();
    const { t } = useI18n();
    // Memoize data processing functions for better performance
    const mergeCountriesWithCompliance = useCallback((basics, compliance) => {
        const complianceByIso3 = new Map(compliance.map(c => [c.isoCode3 || c.name, c]));
        const result = basics
            .filter(b => b.continent &&
            String(b.continent).trim().length > 0 &&
            String(b.name).trim().toLowerCase() !== String(b.continent).trim().toLowerCase())
            .map(b => {
            const comp = complianceByIso3.get(b.isoCode3) || {};
            const e = comp.eInvoicing || {
                b2g: { status: 'none', formats: [], legislation: { name: '' } },
                b2b: { status: 'none', formats: [], legislation: { name: '' } },
                b2c: { status: 'none', formats: [], legislation: { name: '' } },
                lastUpdated: new Date().toISOString(),
            };
            return {
                id: b.isoCode3 || b.isoCode2 || b.name,
                name: b.name,
                isoCode2: b.isoCode2,
                isoCode3: b.isoCode3,
                continent: b.continent,
                region: b.region,
                eInvoicing: normalizeCompliance(e),
            };
        });
        // Add compliance-only countries
        for (const c of compliance) {
            if (!result.find(r => r.isoCode3 === c.isoCode3)) {
                result.push({
                    id: c.isoCode3,
                    name: c.name,
                    isoCode2: '',
                    isoCode3: c.isoCode3,
                    continent: c.continent || 'Unknown',
                    eInvoicing: normalizeCompliance(c.eInvoicing),
                });
            }
        }
        return result
            .filter(c => c.continent && c.name.toLowerCase() !== String(c.continent).toLowerCase())
            .sort((a, b) => a.name.localeCompare(b.name));
    }, []);
    const normalizeCompliance = useCallback((c) => {
        const safe = (x) => ({
            status: x?.status ?? 'none',
            implementationDate: x?.implementationDate,
            formats: x?.formats ?? [],
            legislation: x?.legislation ?? { name: '' }
        });
        return {
            b2g: safe(c?.b2g),
            b2b: safe(c?.b2b),
            b2c: safe(c?.b2c),
            lastUpdated: c?.lastUpdated ?? new Date().toISOString(),
        };
    }, []);
    // Enhanced data loading with better error handling
    const loadData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const basics = (await import('./data/countries.json')).default;
            if (!Array.isArray(basics) || basics.length === 0) {
                throw new Error('Invalid country data format');
            }
            const merged = mergeCountriesWithCompliance(basics, complianceData);
            if (merged.length === 0) {
                throw new Error('No valid country data found');
            }
            setCountries(merged);
        }
        catch (e) {
            console.error('Failed to load data:', e);
            setError(e.message || 'Failed to load country data. Please try again.');
        }
        finally {
            setLoading(false);
        }
    }, [setCountries, setLoading, setError, mergeCountriesWithCompliance]);
    // Initial data load
    useEffect(() => {
        loadData();
    }, [loadData]);
    // Theme management and skip link translation
    useEffect(() => {
        loadSavedTheme();
        // Update skip link text with current language
        const skipLink = document.getElementById('skip-link');
        if (skipLink) {
            skipLink.textContent = t('skip_to_main') || 'Skip to main content';
        }
    }, [t]);
    // Hash-based modal management with improved URL handling
    useEffect(() => {
        const openFromHash = () => {
            const match = /#country=([^&]+)/.exec(window.location.hash);
            if (!match) {
                setSelected(undefined);
                return;
            }
            const id = decodeURIComponent(match[1]);
            const country = countries.find((c) => c.id === id);
            if (country) {
                setSelected(country);
            }
            else {
                // Clear invalid hash
                history.replaceState(null, '', window.location.pathname + window.location.search);
                setSelected(undefined);
            }
        };
        window.addEventListener('hashchange', openFromHash);
        openFromHash();
        return () => window.removeEventListener('hashchange', openFromHash);
    }, [countries, setSelected]);
    // Keyboard event handling for accessibility
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && selected) {
                setSelected(undefined);
                if (window.location.hash.startsWith('#country=')) {
                    history.replaceState(null, '', window.location.pathname + window.location.search);
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [selected, setSelected]);
    // Memoize modal close handler
    const closeModal = useCallback(() => {
        setSelected(undefined);
        if (window.location.hash.startsWith('#country=')) {
            history.replaceState(null, '', window.location.pathname + window.location.search);
        }
    }, [setSelected]);
    // Retry function for error recovery
    const retryLoad = useCallback(() => {
        loadData();
    }, [loadData]);
    // Selective refresh: block only for filtered countries; refresh others in background
    const refreshVisibleThenBackground = useCallback(async () => {
        const service = ComplianceDataService.getInstance();
        try {
            setLoading(true);
            // Foreground refresh for filtered (visible) countries
            const visibleIds = new Set((useStore.getState().filtered || []).map((c) => c.isoCode3));
            for (const id of visibleIds) {
                await service.refreshComplianceData(id);
            }
            // Merge by reloading data (from service cache)
            await loadData();
        }
        finally {
            setLoading(false);
            // Background refresh for remaining countries
            setTimeout(async () => {
                const all = service.getAllAvailableCountries();
                for (const id of all) {
                    if (!(useStore.getState().filtered || []).find((c) => c.isoCode3 === id)) {
                        await service.refreshComplianceData(id);
                    }
                }
                // After background completes, silently refresh list if user hasn't navigated away
                try {
                    await loadData();
                }
                catch { }
            }, 0);
        }
    }, [loadData, setLoading]);
    // Show error state
    if (error && !loading) {
        return (_jsx("div", { className: "container", children: _jsx(ErrorMessage, { message: error, onRetry: retryLoad }) }));
    }
    return (_jsxs("div", { className: "container", children: [_jsxs("div", { className: "row", style: { justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs("div", { children: [_jsx("h1", { style: { marginTop: 0 }, children: t('app_title') }), _jsx("p", { style: { color: '#9aa4b2', marginTop: -8 }, children: t('app_subtitle') })] }), _jsxs("div", { className: "row", "aria-label": "Language selector", style: { gap: 8 }, children: [_jsx("label", { htmlFor: "language-select", style: { fontSize: 12, color: '#6b7280' }, children: t('label_language') }), _jsxs("select", { id: "language-select", value: language, onChange: (e) => setLanguage(e.target.value), "aria-label": "Select application language", children: [_jsx("option", { value: "en-GB", children: "English (UK)" }), _jsx("option", { value: "en-US", children: "English (US)" }), _jsx("option", { value: "fr-FR", children: "Fran\u00E7ais" }), _jsx("option", { value: "de-DE", children: "Deutsch" }), _jsx("option", { value: "es-ES", children: "Espa\u00F1ol" })] })] })] }), loading ? (_jsx(LoadingSpinner, { message: t('loading_compliance') })) : (_jsx(_Fragment, { children: _jsxs("main", { id: "main", role: "main", tabIndex: -1, children: [_jsx(QuickStats, {}), _jsx("div", { className: "spacer" }), _jsx(Filters, {}), _jsx("div", { className: "spacer" }), _jsxs("div", { className: "row", style: { justifyContent: 'space-between', marginBottom: 8 }, children: [_jsx("div", { style: { color: '#9aa4b2' }, "aria-live": "polite", children: t('filters_total_countries', { count: countries.length }) }), _jsx(ExportButtons, {})] }), _jsx(CountryTable, {})] }) })), selected && (_jsx(CountryDetail, { country: selected, onClose: closeModal }))] }));
}
