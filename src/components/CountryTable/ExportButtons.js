import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store/useStore';
import { ClearCacheButton } from '../common/ClearCacheButton';
import { applyThemeFromJson, saveTheme } from '../../utils/theme';
import ExcelJS from 'exceljs';
import { ProgressOverlay } from '../common/ProgressOverlay';
export function ExportButtons() {
    const { filtered, countries } = useStore();
    const fileInputRef = useRef(null);
    const [isCorsRefreshing, setIsCorsRefreshing] = useState(false);
    const [corsProgress, setCorsProgress] = useState(0);
    const [nodeProgress, setNodeProgress] = useState(0);
    const [nodeVisible, setNodeVisible] = useState(false);
    const [overlayMessage, setOverlayMessage] = useState('');
    useEffect(() => {
        let timer;
        if (nodeVisible) {
            const poll = async () => {
                try {
                    const res = await fetch('http://localhost:4321/progress');
                    const json = await res.json();
                    if (typeof json.progress === 'number')
                        setNodeProgress(json.progress);
                    if (json.status === 'done' || json.status === 'error') {
                        clearInterval(timer);
                        setTimeout(() => setNodeVisible(false), 400);
                    }
                }
                catch { }
            };
            timer = setInterval(poll, 1000);
            poll();
        }
        return () => timer && clearInterval(timer);
    }, [nodeVisible]);
    function download(filename, content, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    async function toExcel() {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Countries');
        sheet.columns = [
            { header: 'id', key: 'id' },
            { header: 'name', key: 'name' },
            { header: 'isoCode2', key: 'isoCode2' },
            { header: 'isoCode3', key: 'isoCode3' },
            { header: 'continent', key: 'continent' },
            { header: 'region', key: 'region' },
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
            const b2bPhases = c.eInvoicing.b2b?.phases || [];
            const phasesStr = Array.isArray(b2bPhases)
                ? b2bPhases.map((p) => `${p.name} - ${p.startDate}${p.criteria ? ' - ' + p.criteria : ''}`).join(' | ')
                : '';
            sheet.addRow({
                id: c.id,
                name: c.name,
                isoCode2: c.isoCode2,
                isoCode3: c.isoCode3,
                continent: c.continent,
                region: c.region ?? '',
                b2g_status: c.eInvoicing.b2g.status,
                b2g_implementationDate: c.eInvoicing.b2g.implementationDate ?? '',
                b2g_lastChangeDate: c.eInvoicing.b2g.lastChangeDate ?? '',
                b2b_status: c.eInvoicing.b2b.status,
                b2b_implementationDate: c.eInvoicing.b2b.implementationDate ?? '',
                b2b_lastChangeDate: c.eInvoicing.b2b.lastChangeDate ?? '',
                b2b_legislationFinalisedDate: c.eInvoicing.b2b.legislationFinalisedDate ?? '',
                b2b_lastDraftDate: c.eInvoicing.b2b.lastDraftDate ?? '',
                b2b_phases: phasesStr,
                b2c_status: c.eInvoicing.b2c.status,
                b2c_implementationDate: c.eInvoicing.b2c.implementationDate ?? '',
                b2c_lastChangeDate: c.eInvoicing.b2c.lastChangeDate ?? '',
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
            [['b2g', c.eInvoicing.b2g], ['b2b', c.eInvoicing.b2b], ['b2c', c.eInvoicing.b2c]].forEach(([ch, st]) => {
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
        a.download = 'countries.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    async function runCorsRefresh() {
        setIsCorsRefreshing(true);
        setCorsProgress(0);
        try {
            const total = countries.length || 1;
            let done = 0;
            for (const c of countries) {
                const urls = new Set();
                const legs = [c.eInvoicing.b2g.legislation, c.eInvoicing.b2b.legislation, c.eInvoicing.b2c.legislation];
                for (const leg of legs) {
                    if (!leg)
                        continue;
                    if (leg.officialLink)
                        urls.add(leg.officialLink);
                    if (leg.specificationLink)
                        urls.add(leg.specificationLink);
                    if (Array.isArray(leg.specifications)) {
                        for (const s of leg.specifications)
                            if (s?.url)
                                urls.add(s.url);
                    }
                }
                for (const url of urls) {
                    try {
                        await fetch(url, { mode: 'no-cors' });
                    }
                    catch { }
                }
                done++;
                setCorsProgress(Math.round((done / total) * 100));
                await new Promise(r => setTimeout(r, 10));
            }
        }
        finally {
            setIsCorsRefreshing(false);
        }
    }
    return (_jsxs("div", { className: "row", style: { gap: 8 }, children: [_jsx("button", { onClick: toExcel, children: "Export Excel" }), _jsx(ClearCacheButton, {}), _jsx("button", { onClick: async () => {
                    try {
                        setOverlayMessage('Searching for updates, please wait (server)...');
                        await fetch('http://localhost:4321/refresh-web', { method: 'POST' });
                        setNodeProgress(5);
                        setNodeVisible(true);
                        // Wait for overlay poller to close then run CORS
                        const waitForNode = async () => new Promise(resolve => {
                            const check = () => {
                                if (!nodeVisible)
                                    return resolve();
                                setTimeout(check, 500);
                            };
                            setTimeout(check, 500);
                        });
                        await waitForNode();
                        // Sync UN countries list via local API (non-blocking if API not available)
                        // UN country sync removed per request
                        setOverlayMessage('Searching for updates, please wait (browser)...');
                        await runCorsRefresh();
                        setOverlayMessage('Updates complete. Reloading...');
                        setTimeout(() => location.reload(), 600);
                    }
                    catch {
                        alert('Please start the local API once: npm run api');
                    }
                }, children: "Refresh details" }), _jsx("input", { type: "file", accept: "application/json,.json", ref: fileInputRef, style: { display: 'none' }, onChange: async (e) => {
                    const file = e.target.files?.[0];
                    if (!file)
                        return;
                    try {
                        const text = await file.text();
                        const json = JSON.parse(text);
                        applyThemeFromJson(json);
                        saveTheme(json);
                    }
                    catch (err) {
                        alert('Invalid theme JSON. Please select a valid design file.');
                        console.error(err);
                    }
                    finally {
                        // Allow picking the same file again by resetting the input value
                        e.target.value = '';
                    }
                } }), _jsx("button", { onClick: () => fileInputRef.current?.click(), children: "Apply Design" }), _jsx(ProgressOverlay, { visible: nodeVisible || isCorsRefreshing, message: overlayMessage, progress: nodeVisible ? nodeProgress : corsProgress })] }));
}
