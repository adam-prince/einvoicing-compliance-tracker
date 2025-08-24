import { useEffect, useCallback, useState } from 'react';
import { CarbonProvider, GlobalStyle, Select, Option, Button } from 'carbon-react';
import type { Country, EInvoicingCompliance } from './types/index';
import { useStore } from './store/useStore';
import { CountryTable } from './components/CountryTable/CountryTable';
import { CountryDetail } from './components/CountryDetail/CountryDetail';
import { Filters } from './components/Filters/Filters';
import { QuickStats } from './components/CountryTable/QuickStats';
import { ExportButtons } from './components/CountryTable/ExportButtons';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { ErrorMessage } from './components/common/ErrorBoundary';
import { SecurityHeaders } from './components/common/SecurityHeaders';
import { SettingsModal } from './components/Settings/SettingsModal';
import { loadSavedTheme } from './utils/theme';
import { useI18n } from './i18n';
import { useColumnManager } from './hooks/useColumnManager';
import { ColumnManager } from './components/CountryTable/ColumnManager';
import { gracefulShutdown, initializeCleanupHandlers } from './utils/cleanup';
import { useCountries } from './hooks/useApi';
import { apiService } from './services/api';

interface ComplianceData {
	isoCode3: string;
	name: string;
	continent?: string;
	eInvoicing: EInvoicingCompliance;
}

interface BasicCountry {
	name: string;
	isoCode2: string;
	isoCode3: string;
	continent: string;
	region?: string;
}

export function App() {
	console.log('App component rendering...');
	try {
		const { 
			setCountries, 
			setLoading, 
			setError, 
			countries, 
			selected, 
			setSelected, 
			loading, 
			error,
			language,
			setLanguage,
		} = useStore();
		console.log('App useStore loaded, countries count:', countries.length);
	const { t } = useI18n();
	const { 
		columnConfigs, 
		showColumnManager, 
		openColumnManager, 
		closeColumnManager, 
		handleColumnsChange 
	} = useColumnManager();

	// Settings modal state
	const [showSettings, setShowSettings] = useState(false);
	const openSettings = useCallback(() => setShowSettings(true), []);
	const closeSettings = useCallback(() => setShowSettings(false), []);

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
			
			const basics = countriesModule.default as any[];
			const compliance = complianceModule.default as any[];
			
			// Basic data merging for fallback
			if (basics && Array.isArray(basics) && basics.length > 0) {
				// Convert basic countries to full country format
				const countries: Country[] = basics.map(country => ({
					id: country.isoCode3 || country.name,
					name: country.name || 'Unknown',
					isoCode2: country.isoCode2 || '',
					isoCode3: country.isoCode3 || '',
					continent: country.continent || 'Unknown',
					region: country.region,
					eInvoicing: {
						b2g: { status: 'none', formats: [], legislation: { name: '' } },
						b2b: { status: 'none', formats: [], legislation: { name: '' } },
						b2c: { status: 'none', formats: [], legislation: { name: '' } },
						lastUpdated: new Date().toISOString(),
					}
				}));
				
				setCountries(countries);
				setError(''); // Clear error since we have data now
			} else {
				throw new Error('No local data available');
			}
		} catch (e: any) {
			console.error('Failed to load fallback data:', e);
			setError(e.message || 'Failed to load country data. Please check your connection.');
		} finally {
			setLoading(false);
		}
	}, [setCountries, setLoading, setError]);

	// Update store when API data changes, with automatic fallback
	useEffect(() => {
		if (countriesData) {
			setCountries(countriesData);
			setLoading(false);
			setError('');
		} else if (apiError) {
			console.log('API failed, loading local data fallback...');
			// Automatically trigger fallback when API fails
			loadLocalDataFallback();
		} else {
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
			const country = countries.find((c: Country) => c.id === id);
			
			if (country) {
				setSelected(country);
			} else {
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
		const handleKeyDown = (e: KeyboardEvent) => {
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
		} catch (error) {
			console.error('Failed to refresh data:', error);
			// Fallback to local data if API fails
			await loadLocalDataFallback();
		} finally {
			setLoading(false);
		}
	}, [refetch, loadLocalDataFallback, setLoading]);

	// Show error state
	if (error && !loading) {
		return (
			<div className="container">
				<ErrorMessage 
					message={error} 
					onRetry={retryLoad}
				/>
			</div>
		);
	}

	try {
		return (
			<CarbonProvider>
				<GlobalStyle />
				<SecurityHeaders />
				<div className="app-container">
					{/* Main Application Header */}
					<header className="app-header" role="banner">
						<div className="header-content">
							<div className="header-title-section">
								<h1 className="app-title">
									{t('app_title') || 'E‑Invoicing Compliance Tracker'}
								</h1>
								<p className="app-subtitle">
									{t('app_subtitle') || 'Track e-invoicing compliance requirements across countries'}
								</p>
							</div>
							
							<div className="header-controls" role="group" aria-label="Application controls">
								<Button
									onClick={openSettings}
									size="small"
									variant="primary"
									aria-label={t('open_settings') || 'Open application settings'}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '6px',
										backgroundColor: '#0f62fe',
										color: 'white',
										border: '1px solid #0f62fe'
									}}
								>
									<span aria-hidden="true">⚙️</span>
									{t('settings') || 'Settings'}
								</Button>
								
								<Button
									onClick={gracefulShutdown}
									size="small"
									variant="secondary"
									aria-label={t('exit_application') || 'Exit application and clean up data'}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '6px',
										backgroundColor: '#dc2626',
										color: 'white',
										border: '1px solid #dc2626'
									}}
								>
									<span aria-hidden="true">🚪</span>
									{t('exit') || 'Exit'}
								</Button>
							</div>
						</div>
					</header>

					{/* Main Content Area */}
					<div className="app-content">
						{loading ? (
							<div className="loading-container" role="status" aria-live="polite">
								<LoadingSpinner />
								<span className="sr-only">{t('loading_data') || 'Loading compliance data...'}</span>
							</div>
						) : (
							<main id="main" role="main" tabIndex={-1} className="main-content">
								{/* Skip to main content target */}
								<div className="content-sections">
									{/* Quick Statistics Section */}
									<section aria-labelledby="stats-heading" className="stats-section">
										<h2 id="stats-heading" className="sr-only">
											{t('statistics') || 'Compliance Statistics'}
										</h2>
										<QuickStats />
									</section>
									
									{/* Filters Section */}
									<section id="filters" aria-labelledby="filters-heading" className="filters-section">
										<h2 id="filters-heading" className="section-heading">
											{t('filters') || 'Filters'}
										</h2>
										<Filters />
									</section>
									
									{/* Export Controls Section */}
									<section aria-labelledby="export-heading" className="export-section">
										<h2 id="export-heading" className="sr-only">
											{t('export_options') || 'Export Options'}
										</h2>
										<ExportButtons />
									</section>
									
									{/* Country Data Table Section */}
									<section id="table" aria-labelledby="table-heading" className="table-section">
										<h2 id="table-heading" className="section-heading">
											{t('countries_table') || 'Countries Compliance Data'}
										</h2>
										<CountryTable />
									</section>
								</div>
							</main>
						)}
					</div>

					{/* Modal Dialogs */}
					{showSettings && (
						<SettingsModal
							onClose={closeSettings}
						/>
					)}

					{showColumnManager && (
						<ColumnManager
							columns={columnConfigs}
							onClose={closeColumnManager}
							onColumnsChange={handleColumnsChange}
						/>
					)}

					{selected && (
						<CountryDetail
							country={selected}
							onClose={closeModal}
						/>
					)}
				</div>
			</CarbonProvider>
		);
		} catch (renderError) {
			console.error('Error rendering App component:', renderError);
			return (
				<div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
					<h1 style={{ color: 'red' }}>Application Error</h1>
					<p>There was an error rendering the application:</p>
					<pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
						{String(renderError)}
					</pre>
				</div>
			);
		}
	} catch (appError) {
		console.error('Error in App component:', appError);
		return (
			<div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
				<h1 style={{ color: 'red' }}>Application Initialization Error</h1>
				<p>There was an error initializing the application:</p>
				<pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
					{String(appError)}
				</pre>
			</div>
		);
	}
}