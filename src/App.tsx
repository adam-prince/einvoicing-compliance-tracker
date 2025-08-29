import { useEffect, useCallback, useState } from 'react';
import { CarbonProvider, GlobalStyle, Select, Option, Button } from 'carbon-react';
import type { Country, EInvoicingCompliance } from './types/index';
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
import { apiService } from './services/api';

interface ComplianceData {
	isoCode3: string;
	name: string;
	eInvoicing: EInvoicingCompliance;
}

interface BasicCountry {
	name: string;
	isoCode2: string;
	isoCode3: string;
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
	
	// Language/Accessibility modal state
	const [showLanguageModal, setShowLanguageModal] = useState(false);
	const openLanguageModal = useCallback(() => setShowLanguageModal(true), []);
	const closeLanguageModal = useCallback(() => setShowLanguageModal(false), []);

	// Use the API to load countries data
	const { data: countriesData, isLoading: apiLoading, error: apiError, refetch } = useCountries();

	// DIRECT DATA LOADING - Load immediately on mount, no waiting
	useEffect(() => {
		console.log('🚀 DIRECT DATA LOAD TRIGGERED - Loading local data immediately');
		
		const loadDataDirectly = async () => {
			try {
				console.log('📁 Directly importing data files...');
				
				// Import data synchronously to avoid async issues
				const countriesResponse = await fetch('/src/data/countries.json');
				const complianceResponse = await fetch('/src/data/compliance-data.json');
				
				if (!countriesResponse.ok || !complianceResponse.ok) {
					throw new Error('Failed to fetch data files');
				}
				
				const countriesRaw = await countriesResponse.json();
				const complianceRaw = await complianceResponse.json();
				
				console.log('📊 DIRECT LOAD - Raw data:', {
					countries: countriesRaw?.length || 0,
					compliance: complianceRaw?.length || 0
				});

				if (Array.isArray(countriesRaw) && countriesRaw.length > 0) {
					const countries: Country[] = countriesRaw.map(country => {
						const complianceMatch = complianceRaw.find((c: any) => c.id === country.isoCode3);
						
						return {
							id: country.isoCode3 || country.name,
							name: country.name || 'Unknown',
							isoCode2: country.isoCode2 || '',
							isoCode3: country.isoCode3 || '',
							eInvoicing: complianceMatch ? complianceMatch.eInvoicing : {
								b2g: { status: 'none', formats: [], legislation: { name: '' } },
								b2b: { status: 'none', formats: [], legislation: { name: '' } },
								b2c: { status: 'none', formats: [], legislation: { name: '' } },
								lastUpdated: new Date().toISOString(),
							}
						};
					});

					console.log('🎯 DIRECT LOAD - Processed countries:', countries.length);
					console.log('🏪 DIRECT LOAD - Calling setCountries...');
					setCountries(countries);
					setLoading(false);
					setError('');
					console.log('✅ DIRECT DATA LOAD COMPLETE');
				}
			} catch (error) {
				console.error('❌ DIRECT DATA LOAD FAILED:', error);
				// Fall back to the original import method
				loadLocalDataFallback();
			}
		};

		// Load immediately
		loadDataDirectly();
	}, []);

	// Fallback to local data if API fails
	const loadLocalDataFallback = useCallback(async () => {
		console.log('🔄 STARTING loadLocalDataFallback...');
		setLoading(true);
		setError('');

		try {
			console.log('📦 Importing local data modules...');
			// Import local data as fallback
			const [countriesModule, complianceModule] = await Promise.all([
				import('@data/countries.json'),
				import('@data/compliance-data.json')
			]);
			
			const basics = countriesModule.default as any[];
			const compliance = complianceModule.default as any[];
			
			console.log('📊 RAW DATA LOADED:', {
				basics: {
					type: typeof basics,
					isArray: Array.isArray(basics),
					length: basics?.length || 0,
					firstItem: basics?.[0] || null
				},
				compliance: {
					type: typeof compliance,
					isArray: Array.isArray(compliance),
					length: compliance?.length || 0,
					firstItem: compliance?.[0] || null
				}
			});
			
			// Basic data merging for fallback
			if (basics && Array.isArray(basics) && basics.length > 0) {
				console.log('🔗 MERGING data for', basics.length, 'countries...');
				
				// Convert basic countries to full country format and merge with compliance data
				const countries: Country[] = basics.map(country => {
					// Find matching compliance data for this country
					const complianceMatch = compliance.find((c: any) => c.id === country.isoCode3);
					
					return {
						id: country.isoCode3 || country.name,
						name: country.name || 'Unknown',
						isoCode2: country.isoCode2 || '',
						isoCode3: country.isoCode3 || '',
						eInvoicing: complianceMatch ? complianceMatch.eInvoicing : {
							b2g: { status: 'none', formats: [], legislation: { name: '' } },
							b2b: { status: 'none', formats: [], legislation: { name: '' } },
							b2c: { status: 'none', formats: [], legislation: { name: '' } },
							lastUpdated: new Date().toISOString(),
						}
					};
				});

				// Calculate and log statistics
				const stats = {
					totalCountries: countries.length,
					mandatedB2G: countries.filter(c => c.eInvoicing.b2g.status === 'mandated').length,
					mandatedB2B: countries.filter(c => c.eInvoicing.b2b.status === 'mandated').length,
					mandatedB2C: countries.filter(c => c.eInvoicing.b2c.status === 'mandated').length,
					permitted: countries.filter(c => 
						c.eInvoicing.b2g.status === 'permitted' || 
						c.eInvoicing.b2b.status === 'permitted' || 
						c.eInvoicing.b2c.status === 'permitted'
					).length,
					planned: countries.filter(c => 
						c.eInvoicing.b2g.status === 'planned' || 
						c.eInvoicing.b2b.status === 'planned' || 
						c.eInvoicing.b2c.status === 'planned'
					).length,
					withCompliance: countries.filter(c => 
						c.eInvoicing.b2g.status !== 'none' || 
						c.eInvoicing.b2b.status !== 'none' || 
						c.eInvoicing.b2c.status !== 'none'
					).length
				};

				console.log('📈 FINAL STATISTICS:', stats);
				console.log('🌍 SAMPLE COUNTRIES:', countries.slice(0, 5).map(c => ({ 
					id: c.id, 
					name: c.name, 
					b2g: c.eInvoicing.b2g.status,
					b2b: c.eInvoicing.b2b.status,
					b2c: c.eInvoicing.b2c.status
				})));
				
				console.log('🎯 CALLING setCountries with', countries.length, 'countries...');
				setCountries(countries);
				setError(''); // Clear error since we have data now
				
				console.log('✅ LOCAL DATA SUCCESSFULLY SET!');
			} else {
				console.error('❌ No basic countries data available:', { basics, isArray: Array.isArray(basics), length: basics?.length });
				throw new Error('No local data available');
			}
		} catch (e: any) {
			console.error('❌ FAILED to load fallback data:', e);
			setError(e.message || 'Failed to load country data. Please check your connection.');
		} finally {
			setLoading(false);
			console.log('🏁 loadLocalDataFallback COMPLETED');
		}
	}, [setCountries, setLoading, setError]);

	// Update store when API data changes, with automatic fallback
	useEffect(() => {
		console.log('📡 API DATA EFFECT TRIGGERED:', {
			hasCountriesData: !!countriesData,
			countriesDataLength: countriesData?.length || 0,
			apiLoading,
			hasApiError: !!apiError,
			apiErrorMessage: typeof apiError === 'string' ? apiError : (apiError?.message || 'none')
		});

		if (countriesData) {
			console.log('✅ USING API DATA:', countriesData.length, 'countries');
			console.log('🎯 CALLING setCountries from API data...');
			setCountries(countriesData);
			setLoading(false);
			setError('');
		} else if (apiError) {
			console.log('❌ API FAILED, loading local data fallback...', apiError);
			// Automatically trigger fallback when API fails
			loadLocalDataFallback();
		} else {
			console.log('⏳ API still loading, setting loading state:', apiLoading);
			setLoading(apiLoading);
		}
	}, [countriesData, apiLoading, apiError, setCountries, setLoading, setError, loadLocalDataFallback]);

	// Emergency fallback: Load local data immediately on mount
	useEffect(() => {
		console.log('🚨 EMERGENCY FALLBACK EFFECT TRIGGERED');
		
		const emergencyLoad = async () => {
			console.log('🚨 Starting emergency local data load...');
			await loadLocalDataFallback();
		};

		// Load local data immediately, don't wait for API
		emergencyLoad();
	}, [loadLocalDataFallback]);

	// Initialize cleanup handlers and load fallback data immediately
	useEffect(() => {
		initializeCleanupHandlers();
		
		// Load local data immediately as a backstop, in case API is slow or unavailable
		const loadFallbackImmediately = async () => {
			console.log('📊 Attempting to load local data fallback...');
			console.log('📊 Current state:', { 
				hasCountriesData: !!countriesData, 
				countriesCount: countriesData?.length || 0,
				isApiLoading: apiLoading,
				apiError: !!apiError 
			});
			
			// Always load local data if we don't have any countries
			if (!countriesData || countriesData.length === 0) {
				console.log('📊 Loading local data as immediate fallback...');
				await loadLocalDataFallback();
			}
		};
		
		// Reduced delay to load data faster
		const timer = setTimeout(loadFallbackImmediately, 1000);
		
		return () => clearTimeout(timer);
	}, [countriesData, apiLoading, apiError, loadLocalDataFallback]);

	// Test API connection on startup (only once)
	useEffect(() => {
		let isExecuted = false;
		
		const testApiConnection = async () => {
			if (isExecuted) {
				console.log('🚫 API test already executed, skipping...');
				return;
			}
			isExecuted = true;
			
			console.log('🧪 Testing API connection on startup...');
			console.log('📍 Environment debug:', {
				VITE_API_URL: import.meta.env.VITE_API_URL,
				NODE_ENV: import.meta.env.NODE_ENV,
				MODE: import.meta.env.MODE
			});
			
			// Test through API service only (don't test direct connection)
			try {
				console.log('🔍 API service test...');
				const health = await apiService.healthCheck();
				console.log('✅ API service result:', health);
				
				if (health.success) {
					console.log('✨ API is available and working!');
				} else {
					console.warn('⚠️ API health check returned success: false');
				}
			} catch (error) {
				console.error('❌ API service test failed:', error);
			}
		};
		
		// Only run once with a small delay
		const timeoutId = setTimeout(testApiConnection, 1000);
		
		return () => {
			clearTimeout(timeoutId);
		};
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
									onClick={openLanguageModal}
									size="small"
									variant="secondary"
									aria-label={t('open_language_settings') || 'Open language and accessibility settings'}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '6px',
										backgroundColor: '#059669',
										color: 'white',
										border: '1px solid #059669'
									}}
								>
									<span aria-hidden="true">🌐</span>
									{t('language') || 'Language'}
								</Button>
								
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
					{showLanguageModal && (
						<LanguageAccessibilityModal
							onClose={closeLanguageModal}
						/>
					)}
					
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