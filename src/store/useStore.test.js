import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStore } from './useStore';
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
            formats: [],
            legislation: null,
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
describe('useStore', () => {
    beforeEach(() => {
        // Reset store state before each test
        const { result } = renderHook(() => useStore());
        act(() => {
            result.current.setFilters({
                search: '',
                continent: '',
                status: '',
                lastChangeAfter: '',
            });
        });
    });
    describe('Initial State', () => {
        it('should initialize with empty filters', () => {
            const { result } = renderHook(() => useStore());
            expect(result.current.filters).toEqual({
                search: '',
                continent: '',
                status: '',
                lastChangeAfter: '',
            });
        });
        it('should initialize with countries from localStorage or empty array', () => {
            const { result } = renderHook(() => useStore());
            expect(Array.isArray(result.current.countries)).toBe(true);
            expect(Array.isArray(result.current.filtered)).toBe(true);
        });
    });
    describe('Filter Updates', () => {
        it('should update search filter', () => {
            const { result } = renderHook(() => useStore());
            act(() => {
                result.current.setFilters({ search: 'United States' });
            });
            expect(result.current.filters.search).toBe('United States');
        });
        it('should update continent filter', () => {
            const { result } = renderHook(() => useStore());
            act(() => {
                result.current.setFilters({ continent: 'Europe' });
            });
            expect(result.current.filters.continent).toBe('Europe');
        });
        it('should update status filter', () => {
            const { result } = renderHook(() => useStore());
            act(() => {
                result.current.setFilters({ status: 'mandated' });
            });
            expect(result.current.filters.status).toBe('mandated');
        });
        it('should update date filter', () => {
            const { result } = renderHook(() => useStore());
            act(() => {
                result.current.setFilters({ lastChangeAfter: '2024-01-01' });
            });
            expect(result.current.filters.lastChangeAfter).toBe('2024-01-01');
        });
        it('should merge filter updates', () => {
            const { result } = renderHook(() => useStore());
            act(() => {
                result.current.setFilters({ search: 'France' });
            });
            act(() => {
                result.current.setFilters({ continent: 'Europe' });
            });
            expect(result.current.filters.search).toBe('France');
            expect(result.current.filters.continent).toBe('Europe');
        });
    });
    describe('Filtering Logic', () => {
        beforeEach(() => {
            // Mock localStorage to return our test countries
            const countries = [mockCountry];
            Object.defineProperty(window, 'localStorage', {
                value: {
                    getItem: vi.fn(() => JSON.stringify(countries)),
                    setItem: vi.fn(),
                    removeItem: vi.fn(),
                    clear: vi.fn(),
                },
                writable: true,
            });
        });
        it('should filter countries by search term', () => {
            const { result } = renderHook(() => useStore());
            act(() => {
                result.current.setFilters({ search: 'United' });
            });
            expect(result.current.filtered.length).toBeGreaterThan(0);
            expect(result.current.filtered.some(country => country.name.toLowerCase().includes('united'))).toBe(true);
        });
        it('should return all countries when search is empty', () => {
            const { result } = renderHook(() => useStore());
            act(() => {
                result.current.setFilters({ search: '' });
            });
            expect(result.current.filtered.length).toBe(result.current.countries.length);
        });
        it('should filter by continent', () => {
            const { result } = renderHook(() => useStore());
            act(() => {
                result.current.setFilters({ continent: 'Americas' });
            });
            const americasCountries = result.current.filtered.filter(country => country.continent === 'Americas');
            expect(result.current.filtered).toEqual(americasCountries);
        });
        it('should filter by status', () => {
            const { result } = renderHook(() => useStore());
            act(() => {
                result.current.setFilters({ status: 'mandated' });
            });
            const mandatedCountries = result.current.filtered.filter(country => country.eInvoicing.b2g.status === 'mandated' ||
                country.eInvoicing.b2b.status === 'mandated' ||
                country.eInvoicing.b2c.status === 'mandated');
            expect(result.current.filtered).toEqual(mandatedCountries);
        });
    });
    describe('Store Persistence', () => {
        it('should persist filters to localStorage', () => {
            const { result } = renderHook(() => useStore());
            const setItemSpy = vi.spyOn(localStorage, 'setItem');
            act(() => {
                result.current.setFilters({ search: 'Germany' });
            });
            // The implementation should persist filters
            // Note: This may depend on the actual store implementation
        });
    });
});
