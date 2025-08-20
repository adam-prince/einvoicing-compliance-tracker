import { create } from 'zustand';
import type { Country } from '@types';

interface FilterState {
	search: string;
	continent: string;
	status: string;
	lastChangeAfter: string;
}

interface AppState {
	// Data state
	countries: Country[];
	filtered: Country[];
	selected: Country | undefined;
	
	// UI state
	loading: boolean;
	error: string;
	filters: FilterState;
	
	// Actions
	setCountries: (countries: Country[]) => void;
	setSelected: (country: Country | undefined) => void;
	setLoading: (loading: boolean) => void;
	setError: (error: string) => void;
	setFilters: (filters: Partial<FilterState>) => void;
	clearFilters: () => void;
}

const defaultFilters: FilterState = {
	search: '',
	continent: '',
	status: '',
	lastChangeAfter: ''
};

// Load saved filters from sessionStorage (persist while app is open)
const loadSavedFilters = (): FilterState => {
	try {
		const saved = sessionStorage.getItem('einvoicing-filters');
		if (saved) {
			const parsed = JSON.parse(saved);
			// Ensure all required filter properties exist
			return {
				search: parsed.search || '',
				continent: parsed.continent || '',
				status: parsed.status || '',
				lastChangeAfter: parsed.lastChangeAfter || ''
			};
		}
	} catch (error) {
		console.warn('Failed to load saved filters:', error);
	}
	return defaultFilters;
};

// Save filters to sessionStorage
const saveFilters = (filters: FilterState) => {
	try {
		sessionStorage.setItem('einvoicing-filters', JSON.stringify(filters));
	} catch (error) {
		console.warn('Failed to save filters:', error);
	}
};

const initialFilters = loadSavedFilters();

// Helper function to filter countries based on current filters
const applyFilters = (countries: Country[], filters: FilterState): Country[] => {
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
			const hasStatus = 
				country.eInvoicing.b2g.status === filters.status ||
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
			} catch (error) {
				// Invalid date format, ignore this filter
				console.warn('Invalid date format in lastChangeAfter filter:', filters.lastChangeAfter);
			}
		}
		
		return true;
	});
};

export const useStore = create<AppState>((set, get) => ({
	// Initial state with saved filters
	countries: [],
	filtered: [],
	selected: undefined,
	loading: false,
	error: '',
	filters: initialFilters,
	
	// Actions
	setCountries: (countries: Country[]) => {
		const { filters } = get();
		const filtered = applyFilters(countries, filters);
		set({ 
			countries, 
			filtered,
			error: ''
		});
	},
	
	setSelected: (selected: Country | undefined) => {
		set({ selected });
	},
	
	setLoading: (loading: boolean) => {
		set({ loading });
	},
	
	setError: (error: string) => {
		set({ error, loading: false });
	},
	
	setFilters: (newFilters: Partial<FilterState>) => {
		const { countries, filters } = get();
		const updatedFilters = { ...filters, ...newFilters };
		const filtered = applyFilters(countries, updatedFilters);
		
		// Save the updated filters to localStorage
		saveFilters(updatedFilters);
		
		set({ 
			filters: updatedFilters, 
			filtered 
		});
	},
	
	clearFilters: () => {
		const { countries } = get();
		
		// Save cleared filters to localStorage
		saveFilters(defaultFilters);
		
		set({ 
			filters: defaultFilters, 
			filtered: countries 
		});
	}
}));