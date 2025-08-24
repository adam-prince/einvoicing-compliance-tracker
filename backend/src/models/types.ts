export interface Country {
  id: string; // ISO 3166-1 alpha-3 code
  name: string;
  isoCode2: string; // ISO 3166-1 alpha-2 code
  isoCode3: string; // ISO 3166-1 alpha-3 code
  continent: string;
  region?: string;
  eInvoicing: EInvoicingCompliance;
}

export interface EInvoicingCompliance {
  b2g: ComplianceStatus;
  b2b: ComplianceStatus;
  b2c: ComplianceStatus;
  lastUpdated: string; // ISO date string
}

export interface ComplianceStatus {
  status: 'none' | 'planned' | 'permitted' | 'mandatory';
  implementationDate?: string; // ISO date string
  formats: EInvoiceFormat[];
  legislation: Legislation;
}

export interface EInvoiceFormat {
  name: string;
  version?: string;
  specification?: string;
  authority?: string;
}

export interface Legislation {
  name: string;
  url?: string;
  language?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: 'official' | 'gena' | 'government' | 'consulting' | 'vatcalc' | 'industry';
  sourceUrl?: string;
  publishedDate: string; // ISO date string
  relevantCountries: string[]; // ISO country codes
  relevance: 'high' | 'medium' | 'low';
  type: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    timestamp?: string;
    [key: string]: any;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    timestamp: string;
    requestId: string;
    [key: string]: any;
  };
}

export interface SearchResult {
  countries: CountrySearchResult[];
  compliance: ComplianceSearchResult[];
  news?: NewsSearchResult[];
}

export interface CountrySearchResult {
  id: string;
  name: string;
  matchScore: number;
  matchReason: string;
}

export interface ComplianceSearchResult {
  countryId: string;
  field: string;
  value: string;
  matchScore: number;
}

export interface NewsSearchResult {
  id: string;
  title: string;
  matchScore: number;
  matchReason: string;
}

export interface ExportRequest {
  filters?: {
    countries?: string[];
    continents?: string[];
    status?: string[];
    type?: string[];
    hasPeriodicReporting?: boolean;
  };
  format?: 'basic' | 'detailed' | 'summary';
  columns?: string[];
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface FilterQuery extends PaginationQuery {
  continent?: string;
  region?: string;
  search?: string;
  status?: string;
  type?: string;
  hasPeriodicReporting?: boolean;
  updatedSince?: string;
}

export interface NewsQuery extends PaginationQuery {
  countryId?: string;
  source?: string;
  relevance?: string;
  type?: string;
  since?: string;
}

export interface SearchQuery {
  q: string;
  type?: 'countries' | 'compliance' | 'news';
  fuzzy?: boolean;
}