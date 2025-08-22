import { useEffect, useCallback } from 'react';
import { CarbonProvider, GlobalStyle, Select, Option } from 'carbon-react/lib';
import type { Country, EInvoicingCompliance } from '@types';
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
	const { t } = useI18n();

	// Memoize data processing functions for better performance
	const mergeCountriesWithCompliance = useCallback((basics: BasicCountry[], compliance: ComplianceData[]): Country[] => {
		const complianceByIso3 = new Map<string, ComplianceData>(
			compliance.map(c => [c.isoCode3 || c.name, c])
		);

		const result: Country[] = basics
			.filter(b => 
				b.continent && 
				String(b.continent).trim().length > 0 && 
				String(b.name).trim().toLowerCase() !== String(b.continent).trim().toLowerCase()
			)
			.map(b => {
				const comp = complianceByIso3.get(b.isoCode3) || {} as any;
				const e: EInvoicingCompliance = comp.eInvoicing || {
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

	const normalizeCompliance = useCallback((c: EInvoicingCompliance): EInvoicingCompliance => {
		const safe = (x: any) => ({
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
			const basics = (await import('./data/countries.json')).default as BasicCountry[];
			
			if (!Array.isArray(basics) || basics.length === 0) {
				throw new Error('Invalid country data format');
			}

			const merged = mergeCountriesWithCompliance(basics, complianceData as ComplianceData[]);
			
			if (merged.length === 0) {
				throw new Error('No valid country data found');
			}

			setCountries(merged);
		} catch (e: any) {
			console.error('Failed to load data:', e);
			setError(e.message || 'Failed to load country data. Please try again.');
		} finally {
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
		loadData();
	}, [loadData]);

	// Selective refresh: block only for filtered countries; refresh others in background
	const refreshVisibleThenBackground = useCallback(async () => {
		const service = ComplianceDataService.getInstance();
		try {
			setLoading(true);
			// Foreground refresh for filtered (visible) countries
			const visibleIds = new Set<string>((useStore.getState().filtered || []).map((c: Country) => c.isoCode3));
			for (const id of visibleIds) {
				await service.refreshComplianceData(id);
			}
			// Merge by reloading data (from service cache)
			await loadData();
		} finally {
			setLoading(false);
			// Background refresh for remaining countries
			setTimeout(async () => {
				const all = service.getAllAvailableCountries();
				for (const id of all) {
					if (! (useStore.getState().filtered || []).find((c: Country) => c.isoCode3 === id)) {
						await service.refreshComplianceData(id);
					}
				}
				// After background completes, silently refresh list if user hasn't navigated away
				try { await loadData(); } catch {}
			}, 0);
		}
	}, [loadData, setLoading]);

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

	return (
		<CarbonProvider>
			<GlobalStyle />
			<div className="container">
				<div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
					<div>
						<h1 style={{ marginTop: 0 }}>{t('app_title')}</h1>
						<p style={{ color: '#9aa4b2', marginTop: -8 }}>
							{t('app_subtitle')}
						</p>
					</div>
					<div className="row" aria-label="Language selector" style={{ gap: 8 }}>
						<Select
							label={t('label_language')}
							value={language}
							onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLanguage(e.target.value)}
							aria-label="Select application language"
							size="small"
							labelInline
							labelWidth="80px"
						>
							<Option value="en-GB" text="English (UK)" />
							<Option value="en-US" text="English (US)" />
							<Option value="fr-FR" text="Français" />
							<Option value="de-DE" text="Deutsch" />
							<Option value="es-ES" text="Español" />
						</Select>
						{/* Main refresh button removed as requested; use existing 'Refresh details' controls */}
					</div>
				</div>

				{loading ? (
					<LoadingSpinner message={t('loading_compliance')} />
				) : (
					<>
						<main id="main" role="main" tabIndex={-1}>
							<QuickStats />
							<div className="spacer" />
							<Filters />
							<div className="spacer" />
							<div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
								<div style={{ color: '#9aa4b2' }} aria-live="polite">
									{t('filters_total_countries', { count: countries.length })}
								</div>
								<ExportButtons />
							</div>
							<CountryTable />
						</main>
					</>
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
}