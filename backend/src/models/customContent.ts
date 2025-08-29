export interface CustomFormat {
  id: string;
  countryCode: string; // ISO 3166-1 alpha-3
  countryName: string;
  name: string;
  version?: string;
  url: string;
  description?: string;
  authority: string;
  type: 'specification' | 'standard' | 'schema';
  createdAt: string; // ISO date string
  createdBy?: string; // For future user system
  approved: boolean; // For admin approval workflow
  approvedBy?: string;
  approvedAt?: string;
}

export interface CustomLegislation {
  id: string;
  countryCode: string; // ISO 3166-1 alpha-3
  countryName: string;
  name: string;
  url: string;
  language?: string;
  jurisdiction: string;
  type: 'directive' | 'regulation' | 'law' | 'decree' | 'guideline';
  documentId?: string;
  createdAt: string; // ISO date string
  createdBy?: string; // For future user system
  approved: boolean; // For admin approval workflow
  approvedBy?: string;
  approvedAt?: string;
}

export interface User {
  id: string;
  email: string;
  role: 'readonly' | 'admin';
  name: string;
  createdAt: string;
  lastLoginAt?: string;
  active: boolean;
}

export interface CreateCustomFormatRequest {
  countryCode: string;
  name: string;
  version?: string;
  url: string;
  description?: string;
  authority: string;
  type: 'specification' | 'standard' | 'schema';
}

export interface CreateCustomLegislationRequest {
  countryCode: string;
  name: string;
  url: string;
  language?: string;
  jurisdiction: string;
  type: 'directive' | 'regulation' | 'law' | 'decree' | 'guideline';
  documentId?: string;
}

export interface UpdateCustomFormatRequest extends Partial<CreateCustomFormatRequest> {
  approved?: boolean;
}

export interface UpdateCustomLegislationRequest extends Partial<CreateCustomLegislationRequest> {
  approved?: boolean;
}