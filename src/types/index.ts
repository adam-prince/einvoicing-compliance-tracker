export interface Country {
	id: string;
	name: string;
	isoCode2: string;
	isoCode3: string;
	eInvoicing: EInvoicingCompliance;
}

export interface EInvoicingCompliance {
	b2g: ComplianceStatus;
	b2b: ComplianceStatus;
	b2c: ComplianceStatus;
	periodic?: PeriodicReporting; // periodic VAT/e-reporting
	lastUpdated: string; // ISO string for serialization
}

export interface ComplianceStatus {
	status: 'mandated' | 'permitted' | 'permitted-conditional' | 'none' | 'planned';
	implementationDate?: string; // ISO string for serialization
	formats: InvoiceFormat[];
	legislation: LegislationInfo;
	lastChangeDate?: string;
	mandatedDate?: string;
	legislationFinalisedDate?: string;
	lastDraftDate?: string;
	phases?: TimelinePhase[];
	conditions?: string; // For describing conditions like "with receiver permission"
}

export interface InvoiceFormat {
	name: string;
	type: 'UBL' | 'CII' | 'Factur-X' | 'XML' | 'PDF' | 'Other';
	version?: string;
	isHybrid: boolean;
	description?: string;
	specUrl?: string;
	specVersion?: string;
	specPublishedDate?: string;
}

export interface LegislationInfo {
	name: string;
	officialLink?: string;
	specificationLink?: string;
	summary?: string;
	specifications?: SpecificationInfo[];
}

export type BasicCountry = Omit<Country, 'eInvoicing'>;

export interface SpecificationInfo {
	name: string;
	version?: string;
	publishedDate?: string; // ISO
	url: string;
}

export interface TimelinePhase {
	name: string;
	startDate: string; // ISO
	criteria?: string;
}

export interface PeriodicReporting {
	status: 'mandated' | 'permitted' | 'permitted-conditional' | 'none' | 'planned';
	frequency?: 'monthly' | 'quarterly' | 'bi-monthly' | 'semiannual' | 'annual' | 'other';
	implementationDate?: string; // first period start or first due date
	legislation?: LegislationInfo; // links to VAT return/DRR sources
}

// API Response Types
export interface ApiResponse<T> {
	success: boolean;
	data: T;
	meta?: {
		total?: number;
		page?: number;
		limit?: number;
		timestamp: string;
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
		requestId?: string;
	};
}

// Filter and Query Types
export interface FilterQuery {
	page?: number;
	limit?: number;
	search?: string;
	status?: string;
	type?: string;
	hasPeriodicReporting?: boolean;
	updatedSince?: string;
}


