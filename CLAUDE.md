# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start Vite development server on port 5173
- `npm run build` - TypeScript compilation and Vite production build
- `npm run preview` - Preview production build locally
- `npm run refresh` - Update compliance data specification metadata from existing sources
- `npm run refresh:web` - Enhanced web-based compliance data refresh (requires external APIs)

## Project Architecture

### Core Structure
This is a React + TypeScript SPA for tracking global e-invoicing compliance mandates. The app is built with:
- **Vite** for build tooling and dev server
- **Zustand** for state management 
- **React Table (TanStack)** for data grid functionality
- **ExcelJS** for Excel export capabilities

### Key Components

**App.tsx** (`src/App.tsx:31-300`) - Main application component that:
- Loads and merges country data with compliance data
- Manages modal states via URL hash routing
- Handles keyboard navigation (Escape key)
- Implements error boundaries and loading states

**Store** (`src/store/useStore.ts`) - Zustand store managing:
- Countries data and filtered views
- UI state (loading, errors, selected country)
- Filter state with sessionStorage persistence
- Language preferences with localStorage persistence

**Data Sources**:
- `src/data/countries.json` - Basic country information (ISO codes, continents)
- `src/data/compliance-data.json` - E-invoicing compliance status per country
- `src/data/formatSpecifications.ts` - Data source registry and format specifications

### Data Flow
1. App loads basic countries from JSON file
2. Merges with compliance data using ISO3 codes as keys
3. Applies filters through Zustand store
4. Components subscribe to filtered data via store hooks

### Component Architecture
- **CountryTable** - Main data grid with sortable columns
- **CountryDetail** - Modal detail view with compliance timeline
- **Filters** - Search and filter controls (continent, status, date range)
- **QuickStats** - Summary statistics dashboard
- **ExportButtons** - CSV/Excel export functionality

### TypeScript Types
Core types defined in `src/types/index.ts`:
- `Country` - Main country entity with compliance data
- `EInvoicingCompliance` - B2G/B2B/B2C compliance status structure
- `ComplianceStatus` - Status details including dates, formats, legislation
- `InvoiceFormat` - Format specifications (UBL, CII, Factur-X, etc.)

### Services
**ComplianceDataService** (`src/services/complianceDataService.ts`) - Singleton service for:
- Enhanced compliance timeline data for major EU countries
- Progress tracking for data refresh operations
- Data source timestamp management
- Sample timeline generation for countries without detailed data

### Internationalization
Multi-language support via `src/i18n/`:
- Supports EN (UK/US), FR, DE, ES
- Language selection persisted in localStorage
- Localized compliance status labels and UI text

### Path Aliases
Vite/TypeScript configured with path aliases:
- `@components/*` → `src/components/*`
- `@data/*` → `src/data/*`
- `@hooks/*` → `src/hooks/*` 
- `@types` → `src/types/index.ts`
- `@utils/*` → `src/utils/*`

### Scripts Directory
Node.js scripts for data maintenance:
- `scripts/refresh-specs.cjs` - Updates compliance data with specification metadata
- `scripts/update-from-web.cjs` - Web-based compliance data refresh
- `scripts/api.cjs` - API utilities for external data sources

## Development Notes

The app uses a hybrid data approach - static JSON files for core country/compliance data combined with an enhanced service layer providing detailed timelines for major EU countries (Germany, France, Italy, Spain, Poland, Belgium).

URL hash routing enables deep linking to country details (`#country=DEU`). The app preserves filter state across browser sessions using sessionStorage.

For new compliance data, add entries to `compliance-data.json` following the `EInvoicingCompliance` interface structure. Enhanced timeline data can be added to the `ComplianceDataService` database for countries requiring detailed phase-in schedules.