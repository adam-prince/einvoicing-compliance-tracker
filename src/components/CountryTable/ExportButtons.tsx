import React, { useEffect, useState } from 'react';
import { Button } from 'carbon-react';
import { useStore } from '../../store/useStore';
import { ProgressOverlay } from '../common/ProgressOverlay';
import { rateLimiter, RATE_LIMITS, sanitizeFilename } from '../../utils/security';
import { apiService } from '../../services/api';

export const ExportButtons = React.memo(function ExportButtons() {
	const { filtered, countries } = useStore();

	const [isCorsRefreshing, setIsCorsRefreshing] = useState(false);
	const [corsProgress, setCorsProgress] = useState(0);
	const [nodeProgress, setNodeProgress] = useState<number>(0);
	const [nodeVisible, setNodeVisible] = useState(false);
	const [overlayMessage, setOverlayMessage] = useState('');

	useEffect(() => {
		let timer: any;
		if (nodeVisible) {
			const poll = async () => {
				try {
					const res = await fetch('http://localhost:4321/progress');
					const json = await res.json();
					if (typeof json.progress === 'number') setNodeProgress(json.progress);
					if (json.status === 'done' || json.status === 'error') {
						clearInterval(timer);
						setTimeout(() => setNodeVisible(false), 400);
					}
				} catch {}
			};
			timer = setInterval(poll, 1000);
			poll();
		}
		return () => timer && clearInterval(timer);
	}, [nodeVisible]);

	async function toExcel() {
		// Rate limiting check for export operations
		const userId = 'current-user'; // In a real app, this would be the actual user ID
		if (!rateLimiter.isAllowed(userId + '_export', RATE_LIMITS.export.maxRequests, RATE_LIMITS.export.windowMs)) {
			alert('Export rate limit reached. Please wait before trying again.');
			return;
		}

		try {
			setOverlayMessage('Preparing Excel export...');
			setNodeVisible(true);
			setNodeProgress(10);

			// Try API export first
			try {
				const blob = await apiService.exportToExcel({
					filters: { countries: (filtered || countries).map(c => c.isoCode3) },
					format: 'detailed'
				});
				
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = sanitizeFilename('compliance-data.xlsx');
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
				
				setNodeProgress(100);
				setTimeout(() => setNodeVisible(false), 1000);
				return;
			} catch (apiError) {
				console.warn('API export failed, falling back to local generation:', apiError);
				setOverlayMessage('API unavailable, generating locally...');
				setNodeProgress(30);
			}

			// Fallback to local Excel generation
			const ExcelJS = await import('exceljs');
			const workbook = new ExcelJS.Workbook();
			const sheet = workbook.addWorksheet('Countries');
			setNodeProgress(50);
			
			sheet.columns = [
				{ header: 'id', key: 'id' },
			{ header: 'name', key: 'name' },
			{ header: 'isoCode2', key: 'isoCode2' },
			{ header: 'isoCode3', key: 'isoCode3' },
			{ header: 'b2g_status', key: 'b2g_status' },
			{ header: 'b2g_implementationDate', key: 'b2g_implementationDate' },
			{ header: 'b2g_lastChangeDate', key: 'b2g_lastChangeDate' },
			{ header: 'b2b_status', key: 'b2b_status' },
			{ header: 'b2b_implementationDate', key: 'b2b_implementationDate' },
			{ header: 'b2b_lastChangeDate', key: 'b2b_lastChangeDate' },
			{ header: 'b2b_legislationFinalisedDate', key: 'b2b_legislationFinalisedDate' },
			{ header: 'b2b_lastDraftDate', key: 'b2b_lastDraftDate' },
			{ header: 'b2b_phases', key: 'b2b_phases' },
			{ header: 'b2c_status', key: 'b2c_status' },
			{ header: 'b2c_implementationDate', key: 'b2c_implementationDate' },
			{ header: 'b2c_lastChangeDate', key: 'b2c_lastChangeDate' },
			{ header: 'lastUpdated', key: 'lastUpdated' },
		];
		for (const c of filtered) {
			const b2bPhases = (c.eInvoicing.b2b as any)?.phases || [];
			const phasesStr = Array.isArray(b2bPhases)
				? b2bPhases.map((p: any) => `${p.name} - ${p.startDate}${p.criteria ? ' - ' + p.criteria : ''}`).join(' | ')
				: '';
			sheet.addRow({
				id: c.id,
				name: c.name,
				isoCode2: c.isoCode2,
				isoCode3: c.isoCode3,
				b2g_status: c.eInvoicing.b2g.status,
				b2g_implementationDate: c.eInvoicing.b2g.implementationDate ?? '',
				b2g_lastChangeDate: (c.eInvoicing.b2g as any).lastChangeDate ?? '',
				b2b_status: c.eInvoicing.b2b.status,
				b2b_implementationDate: c.eInvoicing.b2b.implementationDate ?? '',
				b2b_lastChangeDate: (c.eInvoicing.b2b as any).lastChangeDate ?? '',
				b2b_legislationFinalisedDate: (c.eInvoicing.b2b as any).legislationFinalisedDate ?? '',
				b2b_lastDraftDate: (c.eInvoicing.b2b as any).lastDraftDate ?? '',
				b2b_phases: phasesStr,
				b2c_status: c.eInvoicing.b2c.status,
				b2c_implementationDate: c.eInvoicing.b2c.implementationDate ?? '',
				b2c_lastChangeDate: (c.eInvoicing.b2c as any).lastChangeDate ?? '',
				lastUpdated: c.eInvoicing.lastUpdated,
			});
		}
		// Add a second sheet for format specifications with versions/dates
		const fsheet = workbook.addWorksheet('Format Specs');
		fsheet.columns = [
			{ header: 'country', key: 'country' },
			{ header: 'channel', key: 'channel' },
			{ header: 'format', key: 'format' },
			{ header: 'specUrl', key: 'specUrl' },
			{ header: 'specVersion', key: 'specVersion' },
			{ header: 'specPublishedDate', key: 'specPublishedDate' },
		];
		for (const c of filtered) {
			[['b2g', c.eInvoicing.b2g], ['b2b', c.eInvoicing.b2b], ['b2c', c.eInvoicing.b2c]].forEach(([ch, st]: any) => {
				for (const f of st.formats) {
					fsheet.addRow({
						country: c.name,
						channel: ch,
						format: f.name,
						specUrl: f.specUrl || '',
						specVersion: f.specVersion || '',
						specPublishedDate: f.specPublishedDate || '',
					});
				}
			});
		}
		const blob = await workbook.xlsx.writeBuffer();
		const url = URL.createObjectURL(new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
		const a = document.createElement('a');
		a.href = url;
		// Sanitize filename to prevent path traversal attacks
		const timestamp = new Date().toISOString().slice(0, 10);
		a.download = sanitizeFilename(`einvoicing-compliance-${timestamp}.xlsx`);
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Failed to export to Excel:', error);
			alert('Failed to export to Excel. Please try again.');
		} finally {
			setNodeVisible(false);
		}
	}

	async function toCSV() {
		// Rate limiting check for export operations
		const userId = 'current-user';
		if (!rateLimiter.isAllowed(userId + '_export', RATE_LIMITS.export.maxRequests, RATE_LIMITS.export.windowMs)) {
			alert('Export rate limit reached. Please wait before trying again.');
			return;
		}

		try {
			setOverlayMessage('Preparing CSV export...');
			setNodeVisible(true);
			setNodeProgress(10);

			// Try API export first
			try {
				const blob = await apiService.exportToCSV({
					filters: { countries: (filtered || countries).map(c => c.isoCode3) },
					format: 'detailed'
				});
				
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = sanitizeFilename('compliance-data.csv');
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
				
				setNodeProgress(100);
				setTimeout(() => setNodeVisible(false), 1000);
				return;
			} catch (apiError) {
				console.warn('API CSV export failed, falling back to local generation:', apiError);
				setOverlayMessage('API unavailable, generating locally...');
				setNodeProgress(30);
			}

			// Fallback to local CSV generation
			const exportData = filtered && filtered.length > 0 ? filtered : countries;
			const headers = ['ID', 'Name', 'ISO2', 'ISO3', 'B2G Status', 'B2B Status', 'B2C Status', 'Last Updated'];
			
			const csvContent = [
				headers.join(','),
				...exportData.map(country => [
					country.id || '',
					`"${country.name || ''}"`,
					country.isoCode2 || '',
					country.isoCode3 || '',
					country.eInvoicing?.b2g?.status || '',
					country.eInvoicing?.b2b?.status || '',
					country.eInvoicing?.b2c?.status || '',
					country.eInvoicing?.lastUpdated || ''
				].join(','))
			].join('\n');

			const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = sanitizeFilename('compliance-data.csv');
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			
			setNodeProgress(100);
			setTimeout(() => setNodeVisible(false), 1000);
		} catch (err: any) {
			console.error('CSV export failed:', err);
			alert('CSV export failed: ' + (err.message || 'Unknown error'));
		} finally {
			setNodeVisible(false);
		}
	}

	async function toJSON() {
		// Rate limiting check for export operations
		const userId = 'current-user';
		if (!rateLimiter.isAllowed(userId + '_export', RATE_LIMITS.export.maxRequests, RATE_LIMITS.export.windowMs)) {
			alert('Export rate limit reached. Please wait before trying again.');
			return;
		}

		try {
			setOverlayMessage('Preparing JSON export...');
			setNodeVisible(true);
			setNodeProgress(10);

			// Try API export first
			try {
				const response = await apiService.exportToJSON({
					filters: { countries: (filtered || countries).map(c => c.isoCode3) },
					format: 'detailed'
				});
				
				const jsonContent = JSON.stringify(response.data, null, 2);
				const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = sanitizeFilename('compliance-data.json');
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
				
				setNodeProgress(100);
				setTimeout(() => setNodeVisible(false), 1000);
				return;
			} catch (apiError) {
				console.warn('API JSON export failed, falling back to local generation:', apiError);
				setOverlayMessage('API unavailable, generating locally...');
				setNodeProgress(30);
			}

			// Fallback to local JSON generation
			const exportData = filtered && filtered.length > 0 ? filtered : countries;
			const jsonContent = JSON.stringify({
				exportDate: new Date().toISOString(),
				totalCount: exportData.length,
				countries: exportData
			}, null, 2);

			const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = sanitizeFilename('compliance-data.json');
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			
			setNodeProgress(100);
			setTimeout(() => setNodeVisible(false), 1000);
		} catch (err: any) {
			console.error('JSON export failed:', err);
			alert('JSON export failed: ' + (err.message || 'Unknown error'));
		} finally {
			setNodeVisible(false);
		}
	}

	async function runCorsRefresh() {
		setIsCorsRefreshing(true);
		setCorsProgress(0);
		try {
			const total = countries.length || 1;
			let done = 0;
			for (const c of countries) {
				const urls = new Set<string>();
				const legs = [c.eInvoicing.b2g.legislation, c.eInvoicing.b2b.legislation, c.eInvoicing.b2c.legislation];
				for (const leg of legs) {
					if (!leg) continue;
					if (leg.officialLink) urls.add(leg.officialLink);
					if (leg.specificationLink) urls.add(leg.specificationLink);
					if (Array.isArray((leg as any).specifications)) {
						for (const s of (leg as any).specifications) if (s?.url) urls.add(s.url);
					}
				}
				for (const url of urls) {
					try { await fetch(url, { mode: 'no-cors' }); } catch {}
				}
				done++;
				setCorsProgress(Math.round((done / total) * 100));
				await new Promise(r => setTimeout(r, 10));
			}
		} finally {
			setIsCorsRefreshing(false);
		}
	}

	return (
		<div className="row" style={{ gap: 8 }}>
			<Button onClick={toExcel} size="small" variant="secondary">
				Export Excel
			</Button>
			<Button onClick={toCSV} size="small" variant="secondary">
				Export CSV
			</Button>
			<Button onClick={toJSON} size="small" variant="secondary">
				Export JSON
			</Button>
			<Button 
				onClick={async () => {
					try {
						setOverlayMessage('Refreshing data via API...');
						setNodeVisible(true);
						setNodeProgress(50);
						
						// Use API health check first
						const health = await apiService.healthCheck();
						if (health.success) {
							// API is available, refresh the page to reload data
							setOverlayMessage('API available. Reloading...');
							setNodeProgress(100);
							setTimeout(() => location.reload(), 600);
						} else {
							// Fallback to local refresh method
							setOverlayMessage('API unavailable. Using local refresh...');
							await runCorsRefresh();
							setOverlayMessage('Updates complete. Reloading...');
							setTimeout(() => location.reload(), 600);
						}
					} catch (error) {
						console.error('Refresh failed:', error);
						alert('Refresh failed. Please check your connection.');
						setNodeVisible(false);
					}
				}}
				size="small"
				variant="primary"
			>
				Refresh Data
			</Button>
			<ProgressOverlay visible={nodeVisible || isCorsRefreshing} message={overlayMessage} progress={nodeVisible ? nodeProgress : corsProgress} />
		</div>
	);
});