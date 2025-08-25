import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useCallback, useState } from 'react';
import { CarbonProvider, GlobalStyle, Button } from 'carbon-react';
import { useStore } from './store/useStore';
import { CountryTable } from './components/CountryTable/CountryTable';
import { CountryDetail } from './components/CountryDetail/CountryDetail';
import { Filters } from './components/Filters/Filters';
import { QuickStats } from './components/CountryTable/QuickStats';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { ErrorMessage } from './components/common/ErrorBoundary';
import { SecurityHeaders } from './components/common/SecurityHeaders';
import { SettingsModal } from './components/Settings/SettingsModal';
import { LanguageAccessibilityModal } from './components/Settings/LanguageAccessibilityModal';
import { loadSavedTheme } from './utils/theme';
import { useI18n } from './i18n';
import { useColumnManager } from './hooks/useColumnManager';
import { ColumnManager } from './components/CountryTable/ColumnManager';
import { gracefulShutdown, initializeCleanupHandlers } from './utils/cleanup';
import { useCountries } from './hooks/useApi';
export function App() {
    console.log('App component rendering...');
    try {
        const { setCountries, setLoading, setError, countries, selected, setSelected, loading, error, language, setLanguage, } = useStore();
        console.log('App useStore loaded, countries count:', countries.length);
        const { t } = useI18n();
        const { columnConfigs, showColumnManager, openColumnManager, closeColumnManager, handleColumnsChange } = useColumnManager();
        // Settings modal state
        const [showSettings, setShowSettings] = useState(false);
        const openSettings = useCallback(() => setShowSettings(true), []);
        const closeSettings = useCallback(() => setShowSettings(false), []);
        // Language/Accessibility modal state
        const [showLanguageModal, setShowLanguageModal] = useState(false);
        const openLanguageModal = useCallback(() => setShowLanguageModal(true), []);
        const closeLanguageModal = useCallback(() => setShowLanguageModal(false), []);
        // Use the API to load countries data
        const { data: countriesData, isLoading: apiLoading, error: apiError, refetch } = useCountries();
        // Fallback to local data if API fails
        const loadLocalDataFallback = useCallback(async () => {
            setLoading(true);
            setError('');
            try {
                // Import local data as fallback
                const [countriesModule, complianceModule] = await Promise.all([
                    import('./data/countries.json'),
                    import('./data/compliance-data.json')
                ]);
                const basics = countriesModule.default;
                const compliance = complianceModule.default;
                // Basic data merging for fallback
                if (basics && Array.isArray(basics) && basics.length > 0) {
                    // Convert basic countries to full country format and merge with compliance data
                    const countries = basics.map(country => {
                        // Find matching compliance data for this country
                        const complianceMatch = compliance.find((c) => c.id === country.isoCode3);
                        return {
                            id: country.isoCode3 || country.name,
                            name: country.name || 'Unknown',
                            isoCode2: country.isoCode2 || '',
                            isoCode3: country.isoCode3 || '',
                            continent: country.continent || 'Unknown',
                            region: country.region,
                            eInvoicing: complianceMatch ? complianceMatch.eInvoicing : {
                                b2g: { status: 'none', formats: [], legislation: { name: '' } },
                                b2b: { status: 'none', formats: [], legislation: { name: '' } },
                                b2c: { status: 'none', formats: [], legislation: { name: '' } },
                                lastUpdated: new Date().toISOString(),
                            }
                        };
                    });
                    setCountries(countries);
                    setError(''); // Clear error since we have data now
                }
                else {
                    throw new Error('No local data available');
                }
            }
            catch (e) {
                console.error('Failed to load fallback data:', e);
                setError(e.message || 'Failed to load country data. Please check your connection.');
            }
            finally {
                setLoading(false);
            }
        }, [setCountries, setLoading, setError]);
        // Update store when API data changes, with automatic fallback
        useEffect(() => {
            if (countriesData) {
                setCountries(countriesData);
                setLoading(false);
                setError('');
            }
            else if (apiError) {
                console.log('API failed, loading local data fallback...');
                // Automatically trigger fallback when API fails
                loadLocalDataFallback();
            }
            else {
                setLoading(apiLoading);
            }
        }, [countriesData, apiLoading, apiError, setCountries, setLoading, setError, loadLocalDataFallback]);
        // Initialize cleanup handlers
        useEffect(() => {
            initializeCleanupHandlers();
        }, []);
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
            // Always try local data fallback on retry since API is not available
            loadLocalDataFallback();
        }, [loadLocalDataFallback]);
        // Selective refresh: use API to refresh data
        const refreshVisibleThenBackground = useCallback(async () => {
            try {
                setLoading(true);
                // Refresh data via API
                await refetch();
            }
            catch (error) {
                console.error('Failed to refresh data:', error);
                // Fallback to local data if API fails
                await loadLocalDataFallback();
            }
            finally {
                setLoading(false);
            }
        }, [refetch, loadLocalDataFallback, setLoading]);
        // Show error state
        if (error && !loading) {
            return (_jsx("div", { className: "container", children: _jsx(ErrorMessage, { message: error, onRetry: retryLoad }) }));
        }
        try {
            return (_jsxs(CarbonProvider, { children: [_jsx(GlobalStyle, {}), _jsx(SecurityHeaders, {}), _jsxs("div", { className: "app-container", children: [_jsx("header", { className: "app-header", role: "banner", children: _jsxs("div", { className: "header-content", children: [_jsxs("div", { className: "header-title-section", children: [_jsx("h1", { className: "app-title", children: t('app_title') || 'E‑Invoicing Compliance Tracker' }), _jsx("p", { className: "app-subtitle", children: t('app_subtitle') || 'Track e-invoicing compliance requirements across countries' })] }), _jsxs("div", { className: "header-controls", role: "group", "aria-label": "Application controls", children: [_jsxs(Button, { onClick: openLanguageModal, size: "small", variant: "secondary", "aria-label": t('open_language_settings') || 'Open language and accessibility settings', style: {
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        backgroundColor: '#059669',
                                                        color: 'white',
                                                        border: '1px solid #059669'
                                                    }, children: [_jsx("span", { "aria-hidden": "true", children: "\uD83C\uDF10" }), t('language') || 'Language'] }), _jsxs(Button, { onClick: openSettings, size: "small", variant: "primary", "aria-label": t('open_settings') || 'Open application settings', style: {
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        backgroundColor: '#0f62fe',
                                                        color: 'white',
                                                        border: '1px solid #0f62fe'
                                                    }, children: [_jsx("span", { "aria-hidden": "true", children: "\u2699\uFE0F" }), t('settings') || 'Settings'] }), _jsxs(Button, { onClick: gracefulShutdown, size: "small", variant: "secondary", "aria-label": t('exit_application') || 'Exit application and clean up data', style: {
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        backgroundColor: '#dc2626',
                                                        color: 'white',
                                                        border: '1px solid #dc2626'
                                                    }, children: [_jsx("span", { "aria-hidden": "true", children: "\uD83D\uDEAA" }), t('exit') || 'Exit'] })] })] }) }), _jsx("div", { className: "app-content", children: loading ? (_jsxs("div", { className: "loading-container", role: "status", "aria-live": "polite", children: [_jsx(LoadingSpinner, {}), _jsx("span", { className: "sr-only", children: t('loading_data') || 'Loading compliance data...' })] })) : (_jsx("main", { id: "main", role: "main", tabIndex: -1, className: "main-content", children: _jsxs("div", { className: "content-sections", children: [_jsxs("section", { "aria-labelledby": "stats-heading", className: "stats-section", children: [_jsx("h2", { id: "stats-heading", className: "sr-only", children: t('statistics') || 'Compliance Statistics' }), _jsx(QuickStats, {})] }), _jsxs("section", { id: "filters", "aria-labelledby": "filters-heading", className: "filters-section", children: [_jsx("h2", { id: "filters-heading", className: "section-heading", children: t('filters') || 'Filters' }), _jsx(Filters, {})] }), _jsxs("section", { id: "table", "aria-labelledby": "table-heading", className: "table-section", children: [_jsx("h2", { id: "table-heading", className: "section-heading", children: t('countries_table') || 'Countries Compliance Data' }), _jsx(CountryTable, {})] })] }) })) }), showLanguageModal && (_jsx(LanguageAccessibilityModal, { onClose: closeLanguageModal })), showSettings && (_jsx(SettingsModal, { onClose: closeSettings })), showColumnManager && (_jsx(ColumnManager, { columns: columnConfigs, onClose: closeColumnManager, onColumnsChange: handleColumnsChange })), selected && (_jsx(CountryDetail, { country: selected, onClose: closeModal }))] })] }));
        }
        catch (renderError) {
            console.error('Error rendering App component:', renderError);
            return (_jsxs("div", { style: { padding: '2rem', fontFamily: 'Arial, sans-serif' }, children: [_jsx("h1", { style: { color: 'red' }, children: "Application Error" }), _jsx("p", { children: "There was an error rendering the application:" }), _jsx("pre", { style: { background: '#f5f5f5', padding: '1rem', borderRadius: '4px' }, children: String(renderError) })] }));
        }
    }
    catch (appError) {
        console.error('Error in App component:', appError);
        return (_jsxs("div", { style: { padding: '2rem', fontFamily: 'Arial, sans-serif' }, children: [_jsx("h1", { style: { color: 'red' }, children: "Application Initialization Error" }), _jsx("p", { children: "There was an error initializing the application:" }), _jsx("pre", { style: { background: '#f5f5f5', padding: '1rem', borderRadius: '4px' }, children: String(appError) })] }));
    }
}
