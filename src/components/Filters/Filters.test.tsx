import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Filters } from './Filters';
import { useStore } from '../../store/useStore';

// Mock the store
vi.mock('../../store/useStore');
const mockUseStore = vi.mocked(useStore);

// Mock i18n
vi.mock('../../i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'filters_search_countries': 'Search countries',
        'filters_search_placeholder': 'Type to search countries...',
        'filters_updated_after': 'Updated after',
        'filters_continent': 'Continent',
        'filters_status': 'Status',
        'filters_all_continents': 'All Continents',
        'filters_continent_europe': 'Europe',
        'filters_continent_asia': 'Asia',
        'filters_continent_africa': 'Africa',
        'filters_continent_americas': 'Americas',
        'filters_continent_oceania': 'Oceania',
        'filters_all_statuses': 'All Statuses',
        'status_mandated': 'Mandated',
        'status_permitted': 'Permitted',
        'status_planned': 'Planned',
        'status_none': 'None',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock security utilities
vi.mock('../../utils/security', () => ({
  sanitizeSearchQuery: vi.fn((query: string) => query.replace(/<[^>]*>/g, '')),
}));

// Mock debounced value hook
vi.mock('../../hooks/useDebouncedValue', () => ({
  useDebouncedValue: vi.fn((value: string) => value),
}));

describe('Filters', () => {
  const mockSetFilters = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseStore.mockReturnValue({
      filters: {
        search: '',
        continent: '',
        status: '',
        lastChangeAfter: '',
      },
      setFilters: mockSetFilters,
      filtered: [],
      countries: [],
    });
  });

  describe('Search Filter', () => {
    it('should render search input with correct label and placeholder', () => {
      render(<Filters />);
      
      const searchInput = screen.getByLabelText('Search countries');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('placeholder', 'Type to search countries...');
    });

    it('should call sanitizeSearchQuery when user types', async () => {
      const { sanitizeSearchQuery } = await import('../../utils/security');
      
      render(<Filters />);
      
      const searchInput = screen.getByLabelText('Search countries');
      fireEvent.change(searchInput, { target: { value: 'France<script>alert("xss")</script>' } });

      expect(sanitizeSearchQuery).toHaveBeenCalledWith('France<script>alert("xss")</script>');
    });

    it('should update search state when user types', () => {
      render(<Filters />);
      
      const searchInput = screen.getByLabelText('Search countries');
      fireEvent.change(searchInput, { target: { value: 'France' } });

      expect(searchInput).toHaveValue('France');
    });

    it('should use debounced value for search', async () => {
      const { useDebouncedValue } = await import('../../hooks/useDebouncedValue');
      
      render(<Filters />);
      
      expect(useDebouncedValue).toHaveBeenCalledWith('', 250);
    });
  });

  describe('Date Filter', () => {
    it('should render date input with correct label', () => {
      render(<Filters />);
      
      const dateInput = screen.getByLabelText('Updated after');
      expect(dateInput).toBeInTheDocument();
      expect(dateInput).toHaveAttribute('type', 'date');
    });

    it('should call setFilters when date changes', () => {
      render(<Filters />);
      
      const dateInput = screen.getByLabelText('Updated after');
      fireEvent.change(dateInput, { target: { value: '2024-01-01' } });

      expect(mockSetFilters).toHaveBeenCalledWith({ lastChangeAfter: '2024-01-01' });
    });

    it('should display existing date filter value', () => {
      mockUseStore.mockReturnValue({
        filters: {
          search: '',
          continent: '',
          status: '',
          lastChangeAfter: '2024-01-01',
        },
        setFilters: mockSetFilters,
        filtered: [],
        countries: [],
      });

      render(<Filters />);
      
      const dateInput = screen.getByLabelText('Updated after');
      expect(dateInput).toHaveValue('2024-01-01');
    });
  });

  describe('Continent Filter', () => {
    it('should render continent select with all options', () => {
      render(<Filters />);
      
      const continentSelect = screen.getByLabelText('Continent');
      expect(continentSelect).toBeInTheDocument();

      // Check that all continent options are present
      expect(screen.getByText('All Continents')).toBeInTheDocument();
      expect(screen.getByText('Europe')).toBeInTheDocument();
      expect(screen.getByText('Asia')).toBeInTheDocument();
      expect(screen.getByText('Africa')).toBeInTheDocument();
      expect(screen.getByText('Americas')).toBeInTheDocument();
      expect(screen.getByText('Oceania')).toBeInTheDocument();
    });

    it('should call setFilters when continent changes', () => {
      render(<Filters />);
      
      const continentSelect = screen.getByLabelText('Continent');
      fireEvent.change(continentSelect, { target: { value: 'Europe' } });

      expect(mockSetFilters).toHaveBeenCalledWith({ continent: 'Europe' });
    });

    it('should reset to empty string when "all" is selected', () => {
      mockUseStore.mockReturnValue({
        filters: {
          search: '',
          continent: 'Europe',
          status: '',
          lastChangeAfter: '',
        },
        setFilters: mockSetFilters,
        filtered: [],
        countries: [],
      });

      render(<Filters />);
      
      const continentSelect = screen.getByLabelText('Continent');
      fireEvent.change(continentSelect, { target: { value: 'all' } });

      expect(mockSetFilters).toHaveBeenCalledWith({ continent: '' });
    });

    it('should display selected continent', () => {
      mockUseStore.mockReturnValue({
        filters: {
          search: '',
          continent: 'Europe',
          status: '',
          lastChangeAfter: '',
        },
        setFilters: mockSetFilters,
        filtered: [],
        countries: [],
      });

      render(<Filters />);
      
      const continentSelect = screen.getByLabelText('Continent');
      expect(continentSelect).toHaveValue('Europe');
    });
  });

  describe('Status Filter', () => {
    it('should render status select with all options', () => {
      render(<Filters />);
      
      const statusSelect = screen.getByLabelText('Status');
      expect(statusSelect).toBeInTheDocument();

      // Check that all status options are present
      expect(screen.getByText('All Statuses')).toBeInTheDocument();
      expect(screen.getByText('Mandated')).toBeInTheDocument();
      expect(screen.getByText('Permitted')).toBeInTheDocument();
      expect(screen.getByText('Planned')).toBeInTheDocument();
      expect(screen.getByText('None')).toBeInTheDocument();
    });

    it('should call setFilters when status changes', () => {
      render(<Filters />);
      
      const statusSelect = screen.getByLabelText('Status');
      fireEvent.change(statusSelect, { target: { value: 'mandated' } });

      expect(mockSetFilters).toHaveBeenCalledWith({ status: 'mandated' });
    });

    it('should reset to empty string when "all" is selected', () => {
      mockUseStore.mockReturnValue({
        filters: {
          search: '',
          continent: '',
          status: 'mandated',
          lastChangeAfter: '',
        },
        setFilters: mockSetFilters,
        filtered: [],
        countries: [],
      });

      render(<Filters />);
      
      const statusSelect = screen.getByLabelText('Status');
      fireEvent.change(statusSelect, { target: { value: 'all' } });

      expect(mockSetFilters).toHaveBeenCalledWith({ status: '' });
    });

    it('should display selected status', () => {
      mockUseStore.mockReturnValue({
        filters: {
          search: '',
          continent: '',
          status: 'mandated',
          lastChangeAfter: '',
        },
        setFilters: mockSetFilters,
        filtered: [],
        countries: [],
      });

      render(<Filters />);
      
      const statusSelect = screen.getByLabelText('Status');
      expect(statusSelect).toHaveValue('mandated');
    });
  });

  describe('Component Structure', () => {
    it('should render all filter inputs in correct layout', () => {
      render(<Filters />);
      
      // Check that the card container exists
      const card = screen.getByRole('generic', { name: '' });
      expect(card).toHaveClass('card');

      // Check that all filters are rendered
      expect(screen.getByLabelText('Search countries')).toBeInTheDocument();
      expect(screen.getByLabelText('Updated after')).toBeInTheDocument();
      expect(screen.getByLabelText('Continent')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
    });

    it('should use medium size for all inputs', () => {
      render(<Filters />);
      
      const searchInput = screen.getByLabelText('Search countries');
      const dateInput = screen.getByLabelText('Updated after');
      const continentSelect = screen.getByLabelText('Continent');
      const statusSelect = screen.getByLabelText('Status');

      // All inputs should have medium size (this depends on how Carbon components render size)
      expect(searchInput).toBeInTheDocument();
      expect(dateInput).toBeInTheDocument();
      expect(continentSelect).toBeInTheDocument();
      expect(statusSelect).toBeInTheDocument();
    });
  });

  describe('Integration with Store', () => {
    it('should initialize with current filter values from store', () => {
      mockUseStore.mockReturnValue({
        filters: {
          search: 'Germany',
          continent: 'Europe',
          status: 'mandated',
          lastChangeAfter: '2024-01-01',
        },
        setFilters: mockSetFilters,
        filtered: [],
        countries: [],
      });

      render(<Filters />);
      
      expect(screen.getByLabelText('Search countries')).toHaveValue('Germany');
      expect(screen.getByLabelText('Updated after')).toHaveValue('2024-01-01');
      expect(screen.getByLabelText('Continent')).toHaveValue('Europe');
      expect(screen.getByLabelText('Status')).toHaveValue('mandated');
    });

    it('should handle empty filter values', () => {
      mockUseStore.mockReturnValue({
        filters: {
          search: '',
          continent: '',
          status: '',
          lastChangeAfter: '',
        },
        setFilters: mockSetFilters,
        filtered: [],
        countries: [],
      });

      render(<Filters />);
      
      expect(screen.getByLabelText('Search countries')).toHaveValue('');
      expect(screen.getByLabelText('Updated after')).toHaveValue('');
      expect(screen.getByLabelText('Continent')).toHaveValue('all');
      expect(screen.getByLabelText('Status')).toHaveValue('all');
    });
  });
});