export interface CustomLink {
  id: string;
  countryCode: string;
  linkType: 'legislation' | 'specification' | 'news' | 'standard';
  originalUrl: string;
  customUrl: string;
  title: string;
  dateProvided: string; // ISO date string
  lastUpdated: string; // ISO date string
  notes?: string;
  isActive: boolean;
}

export interface CustomLinkRequest {
  countryCode: string;
  linkType: 'legislation' | 'specification' | 'news' | 'standard';
  originalUrl: string;
  customUrl: string;
  title: string;
  notes?: string;
}