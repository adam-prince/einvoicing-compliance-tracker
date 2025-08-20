import { create } from 'zustand';
const initialFilters = {
    search: '',
    continent: '',
    status: '',
    lastChangeAfter: ''
};
// Helper function to filter countries based on current filters
const applyFilters = (countries, filters) => {
    return countries.filter(country => {
        // Search filter - searches in country name
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            const matchesName = country.name.toLowerCase().includes(searchTerm);
            const matchesCode = country.isoCode3?.toLowerCase().includes(searchTerm) ||
                country.isoCode2?.toLowerCase().includes(searchTerm);
            if (!matchesName && !matchesCode) {
                return false;
            }
        }
        // Continent filter
        if (filters.continent && filters.continent !== 'all') {
            if (country.continent !== filters.continent) {
                return false;
            }
        }
        // Status filter - checks if any of B2G, B2B, B2C matches the selected status
        if (filters.status && filters.status !== 'all') {
            const hasStatus = country.eInvoicing.b2g.status === filters.status ||
                country.eInvoicing.b2b.status === filters.status ||
                country.eInvoicing.b2c.status === filters.status;
            if (!hasStatus) {
                return false;
            }
        }
        // Last change after filter - filters by lastUpdated date
        if (filters.lastChangeAfter) {
            try {
                const filterDate = new Date(filters.lastChangeAfter);
                const lastUpdated = new Date(country.eInvoicing.lastUpdated);
                if (lastUpdated < filterDate) {
                    return false;
                }
            }
            catch (error) {
                // Invalid date format, ignore this filter
                console.warn('Invalid date format in lastChangeAfter filter:', filters.lastChangeAfter);
            }
        }
        return true;
    });
};
export const useStore = create((set, get) => ({
    // Initial state
    countries: [],
    filtered: [],
    selected: undefined,
    loading: false,
    error: '',
    filters: initialFilters,
    // Actions
    setCountries: (countries) => {
        const { filters } = get();
        const filtered = applyFilters(countries, filters);
        set({
            countries,
            filtered,
            error: ''
        });
    },
    setSelected: (selected) => {
        set({ selected });
    },
    setLoading: (loading) => {
        set({ loading });
    },
    setError: (error) => {
        set({ error, loading: false });
    },
    setFilters: (newFilters) => {
        const { countries, filters } = get();
        const updatedFilters = { ...filters, ...newFilters };
        const filtered = applyFilters(countries, updatedFilters);
        set({
            filters: updatedFilters,
            filtered
        });
    },
    clearFilters: () => {
        const { countries } = get();
        set({
            filters: initialFilters,
            filtered: countries
        });
    }
}));
