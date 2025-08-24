import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportButtons } from './ExportButtons';
import { useStore } from '../../store/useStore';
// Mock the store
vi.mock('../../store/useStore');
const mockUseStore = vi.mocked(useStore);
// Mock ExcelJS
vi.mock('exceljs', () => ({
    default: {
        Workbook: vi.fn().mockImplementation(() => ({
            addWorksheet: vi.fn().mockReturnValue({
                columns: [],
                addRow: vi.fn(),
            }),
            xlsx: {
                writeBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(100)),
            },
        })),
    },
}));
// Mock security utilities
vi.mock('../../utils/security', () => ({
    rateLimiter: {
        isAllowed: vi.fn().mockReturnValue(true),
    },
    RATE_LIMITS: {
        export: {
            maxRequests: 5,
            windowMs: 60000,
        },
    },
    sanitizeFilename: vi.fn((filename) => filename),
}));
// Mock ProgressOverlay
vi.mock('../common/ProgressOverlay', () => ({
    ProgressOverlay: ({ visible, message, progress }) => visible ? _jsxs("div", { "data-testid": "progress-overlay", children: [message, " - ", progress, "%"] }) : null,
}));
// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;
// Mock URL and document methods
Object.defineProperty(global, 'URL', {
    value: {
        createObjectURL: vi.fn().mockReturnValue('mock-url'),
        revokeObjectURL: vi.fn(),
    },
});
const mockCountry = {
    id: 'US',
    name: 'United States',
    isoCode2: 'US',
    isoCode3: 'USA',
    continent: 'Americas',
    region: 'Northern America',
    eInvoicing: {
        b2g: {
            status: 'mandated',
            implementationDate: '2020-01-01',
            formats: [{
                    name: 'UBL 2.1',
                    specUrl: 'https://example.com/spec',
                    specVersion: '2.1',
                    specPublishedDate: '2020-01-01',
                }],
            legislation: {
                officialLink: 'https://example.com/law',
                specificationLink: 'https://example.com/spec',
            },
        },
        b2b: {
            status: 'permitted',
            implementationDate: null,
            formats: [],
            legislation: null,
        },
        b2c: {
            status: 'none',
            implementationDate: null,
            formats: [],
            legislation: null,
        },
        lastUpdated: '2024-01-01',
    },
};
describe('ExportButtons', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseStore.mockReturnValue({
            filtered: [mockCountry],
            countries: [mockCountry],
            setFilters: vi.fn(),
            filters: { search: '', status: '', continent: '', lastChangeAfter: '' },
        });
        // Mock DOM methods
        const mockElement = {
            click: vi.fn(),
            href: '',
            download: '',
        };
        vi.spyOn(document, 'createElement').mockReturnValue(mockElement);
        vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockElement);
        vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockElement);
    });
    describe('Excel Export', () => {
        it('should render export excel button', () => {
            render(_jsx(ExportButtons, {}));
            const exportButton = screen.getByRole('button', { name: /export excel/i });
            expect(exportButton).toBeInTheDocument();
        });
        it('should create Excel file when export button is clicked', async () => {
            render(_jsx(ExportButtons, {}));
            const exportButton = screen.getByRole('button', { name: /export excel/i });
            fireEvent.click(exportButton);
            // Wait for async operations
            await waitFor(() => {
                expect(document.createElement).toHaveBeenCalledWith('a');
            });
            expect(URL.createObjectURL).toHaveBeenCalled();
            expect(URL.revokeObjectURL).toHaveBeenCalled();
        });
        it('should show rate limit alert when exceeded', async () => {
            const { rateLimiter } = await import('../../utils/security');
            vi.mocked(rateLimiter.isAllowed).mockReturnValue(false);
            const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });
            render(_jsx(ExportButtons, {}));
            const exportButton = screen.getByRole('button', { name: /export excel/i });
            fireEvent.click(exportButton);
            expect(alertSpy).toHaveBeenCalledWith('Export rate limit reached. Please wait before trying again.');
        });
        it('should include format specifications in separate sheet', async () => {
            const ExcelJS = await import('exceljs');
            const mockWorkbook = {
                addWorksheet: vi.fn().mockReturnValue({
                    columns: [],
                    addRow: vi.fn(),
                }),
                xlsx: {
                    writeBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(100)),
                },
            };
            vi.mocked(ExcelJS.default.Workbook).mockImplementation(() => mockWorkbook);
            render(_jsx(ExportButtons, {}));
            const exportButton = screen.getByRole('button', { name: /export excel/i });
            fireEvent.click(exportButton);
            await waitFor(() => {
                expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Countries');
                expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Format Specs');
            });
        });
    });
    describe('Refresh Details', () => {
        it('should render refresh details button', () => {
            render(_jsx(ExportButtons, {}));
            const refreshButton = screen.getByRole('button', { name: /refresh details/i });
            expect(refreshButton).toBeInTheDocument();
        });
        it('should show progress overlay during refresh', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ progress: 50, status: 'running' }),
            });
            render(_jsx(ExportButtons, {}));
            const refreshButton = screen.getByRole('button', { name: /refresh details/i });
            fireEvent.click(refreshButton);
            await waitFor(() => {
                expect(screen.getByTestId('progress-overlay')).toBeInTheDocument();
            });
        });
        it('should handle API errors gracefully', async () => {
            mockFetch.mockRejectedValue(new Error('API not available'));
            const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });
            render(_jsx(ExportButtons, {}));
            const refreshButton = screen.getByRole('button', { name: /refresh details/i });
            fireEvent.click(refreshButton);
            await waitFor(() => {
                expect(alertSpy).toHaveBeenCalledWith('Please start the local API once: npm run api');
            });
        });
        it('should make CORS requests for all legislation URLs', async () => {
            mockFetch
                .mockResolvedValueOnce({ ok: true }) // refresh-web endpoint
                .mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ progress: 100, status: 'done' })
            }); // progress endpoint
            render(_jsx(ExportButtons, {}));
            const refreshButton = screen.getByRole('button', { name: /refresh details/i });
            fireEvent.click(refreshButton);
            // Wait for CORS refresh to be called
            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith('http://localhost:4321/refresh-web', { method: 'POST' });
            });
            // Should make CORS requests for legislation URLs
            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith('https://example.com/law', { mode: 'no-cors' });
                expect(mockFetch).toHaveBeenCalledWith('https://example.com/spec', { mode: 'no-cors' });
            });
        });
        it('should poll progress endpoint during node operation', async () => {
            let progressCalls = 0;
            mockFetch.mockImplementation((url) => {
                if (url === 'http://localhost:4321/refresh-web') {
                    return Promise.resolve({ ok: true });
                }
                if (url === 'http://localhost:4321/progress') {
                    progressCalls++;
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({
                            progress: progressCalls * 20,
                            status: progressCalls >= 5 ? 'done' : 'running'
                        }),
                    });
                }
                return Promise.resolve({ ok: true });
            });
            render(_jsx(ExportButtons, {}));
            const refreshButton = screen.getByRole('button', { name: /refresh details/i });
            fireEvent.click(refreshButton);
            // Wait for progress polling to start
            await waitFor(() => {
                expect(screen.getByTestId('progress-overlay')).toBeInTheDocument();
            }, { timeout: 3000 });
        });
    });
    describe('Component State Management', () => {
        it('should manage multiple progress states correctly', async () => {
            render(_jsx(ExportButtons, {}));
            // Initially no overlay should be visible
            expect(screen.queryByTestId('progress-overlay')).not.toBeInTheDocument();
            // Start refresh to trigger node progress
            mockFetch.mockResolvedValue({ ok: true });
            const refreshButton = screen.getByRole('button', { name: /refresh details/i });
            fireEvent.click(refreshButton);
            // Should show progress overlay
            await waitFor(() => {
                expect(screen.getByTestId('progress-overlay')).toBeInTheDocument();
            });
        });
        it('should handle empty countries list gracefully', () => {
            mockUseStore.mockReturnValue({
                filtered: [],
                countries: [],
                setFilters: vi.fn(),
                filters: { search: '', status: '', continent: '', lastChangeAfter: '' },
            });
            render(_jsx(ExportButtons, {}));
            const exportButton = screen.getByRole('button', { name: /export excel/i });
            const refreshButton = screen.getByRole('button', { name: /refresh details/i });
            expect(exportButton).toBeInTheDocument();
            expect(refreshButton).toBeInTheDocument();
        });
    });
});
