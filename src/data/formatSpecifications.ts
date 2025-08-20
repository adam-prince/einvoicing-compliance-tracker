// src/data/formatSpecifications.ts

export interface FormatSpecification {
	name: string;
	version?: string;
	url: string;
	description?: string;
	authority: string;
	type: 'specification' | 'standard' | 'schema';
}

export interface LegislationDocument {
	name: string;
	url: string;
	language?: string;
	jurisdiction: string;
	type: 'directive' | 'regulation' | 'law' | 'decree' | 'guideline';
	documentId?: string;
}

// Official format specifications database - CORRECTED WITH ACCURATE COUNTRY DATA
export const formatSpecifications: Record<string, FormatSpecification[]> = {
	// Universal formats
	'UBL': [
		{
			name: 'UBL 2.1',
			version: '2.1',
			url: 'https://docs.oasis-open.org/ubl/UBL-2.1.html',
			description: 'Universal Business Language 2.1',
			authority: 'OASIS',
			type: 'standard'
		},
		{
			name: 'UBL 2.2',
			version: '2.2', 
			url: 'https://docs.oasis-open.org/ubl/UBL-2.2.html',
			description: 'Universal Business Language 2.2',
			authority: 'OASIS',
			type: 'standard'
		},
		{
			name: 'UBL 2.3',
			version: '2.3',
			url: 'https://docs.oasis-open.org/ubl/UBL-2.3.html',
			description: 'Universal Business Language 2.3',
			authority: 'OASIS',
			type: 'standard'
		}
	],
	'CII': [
		{
			name: 'CII D16B',
			version: 'D16B',
			url: 'https://unece.org/trade/uncefact/xml-schemas',
			description: 'UN/CEFACT Cross Industry Invoice D16B',
			authority: 'UN/CEFACT',
			type: 'standard'
		},
		{
			name: 'CII D19B',
			version: 'D19B', 
			url: 'https://unece.org/trade/uncefact/xml-schemas',
			description: 'UN/CEFACT Cross Industry Invoice D19B',
			authority: 'UN/CEFACT',
			type: 'standard'
		}
	],
	'EN16931': [
		{
			name: 'EN 16931-1:2017',
			version: '2017',
			url: 'https://standards.cen.eu/dyn/www/f?p=204:110:0::::FSP_PROJECT:60096',
			description: 'European Standard for Electronic Invoicing',
			authority: 'CEN',
			type: 'standard'
		}
	],
	'PEPPOL': [
		{
			name: 'PEPPOL BIS Billing 3.0',
			version: '3.0',
			url: 'https://docs.peppol.eu/poacc/billing/3.0/',
			description: 'PEPPOL Business Interoperability Specification',
			authority: 'OpenPEPPOL',
			type: 'specification'
		}
	],
	'EDIFACT': [
		{
			name: 'EDIFACT INVOIC D96A',
			version: 'D96A',
			url: 'https://www.unece.org/trade/untdid/d96a/trmd/invoic_c.htm',
			description: 'UN/EDIFACT Invoice Message',
			authority: 'UN/CEFACT',
			type: 'standard'
		}
	],
	
	// FRANCE - Corrected formats
	'Chorus Pro': [
		{
			name: 'Chorus Pro Format',
			url: 'https://portail.chorus-pro.gouv.fr/aife_csm/?id=aife_documentation',
			description: 'French B2G e-invoicing platform format',
			authority: 'French Government',
			type: 'specification'
		}
	],
	'Factur-X': [
		{
			name: 'Factur-X 1.0.06',
			version: '1.0.06',
			url: 'https://fnfe-mpe.org/factur-x/',
			description: 'Franco-German e-invoicing standard (France only for now)',
			authority: 'FNFE-MPE',
			type: 'standard'
		}
	],
	
	// GERMANY
	'ZUGFeRD': [
		{
			name: 'ZUGFeRD 2.1.1',
			version: '2.1.1',
			url: 'https://www.ferd-net.de/standards/zugferd-2.1.1/index.html',
			description: 'German e-invoicing standard',
			authority: 'FeRD',
			type: 'standard'
		}
	],
	'XRechnung': [
		{
			name: 'XRechnung 2.3.1',
			version: '2.3.1',
			url: 'https://xeinkauf.de/xrechnung/',
			description: 'German public sector e-invoice standard',
			authority: 'KoSIT',
			type: 'specification'
		}
	],
	
	// ITALY
	'FatturaPA': [
		{
			name: 'FatturaPA v1.2.1',
			version: '1.2.1',
			url: 'https://www.fatturapa.gov.it/export/documenti/fatturapa/v1.2.1/',
			description: 'Italian electronic invoice format',
			authority: 'Italian Revenue Agency',
			type: 'specification'
		}
	],
	
	// SPAIN - CORRECTED: No Factur-X here
	'Facturae': [
		{
			name: 'Facturae 3.2.2',
			version: '3.2.2',
			url: 'https://www.hacienda.gob.es/es-ES/Areas%20Tematicas/Tributos/Impuestos/IVA/Factura%20electronica/Paginas/Facturae.aspx',
			description: 'Spanish electronic invoice format for public sector',
			authority: 'Spanish Tax Authority (AEAT)',
			type: 'specification'
		}
	],
	'TicketBAI': [
		{
			name: 'TicketBAI Specification',
			url: 'https://www.euskadi.eus/ticketbai/web01-a2haking/es/',
			description: 'Basque Country real-time invoicing system',
			authority: 'Basque Government',
			type: 'specification'
		}
	],
	'VERIFACTU': [
		{
			name: 'VERIFACTU System',
			url: 'https://www.agenciatributaria.es/AEAT/Contenidos_Comunes/La_Agencia_Tributaria/Segmentos_Usuarios/Empresas_y_profesionales/Obligaciones_tributarias/Obligaciones_facturacion/VeriFactu/VeriFactu.shtml',
			description: 'Spanish certified invoicing software system',
			authority: 'Spanish Tax Authority (AEAT)',
			type: 'specification'
		}
	],
	
	// POLAND
	'KSeF': [
		{
			name: 'KSeF Documentation',
			url: 'https://www.podatki.gov.pl/ksef/',
			description: 'Polish National e-Invoicing System',
			authority: 'Polish Ministry of Finance',
			type: 'specification'
		}
	],
	
	// NETHERLANDS
	'NLCIUS': [
		{
			name: 'NLCIUS 1.0.3',
			version: '1.0.3',
			url: 'https://stpe.nl/bestanden/NLCIUS-UBL/',
			description: 'Dutch Core Invoice Usage Specification',
			authority: 'STPE Netherlands',
			type: 'specification'
		}
	],
	
	// BELGIUM
	'BCIUS': [
		{
			name: 'Belgian CIUS',
			url: 'https://economie.fgov.be/en/themes/enterprises/public-procurement/electronic-invoicing',
			description: 'Belgian Core Invoice Usage Specification',
			authority: 'Belgian Federal Government',
			type: 'specification'
		}
	],
	
	// NORDIC COUNTRIES
	'EHF': [
		{
			name: 'EHF Invoice 3.0',
			version: '3.0',
			url: 'https://anskaffelser.no/elektronisk-handel/ehf-formater',
			description: 'Norwegian Electronic Commerce Format',
			authority: 'Norwegian Government',
			type: 'specification'
		}
	],
	'SFTI': [
		{
			name: 'SFTI Invoice',
			url: 'https://www.anskaffning.se/elektronisk-handel/sfti/',
			description: 'Swedish standard for electronic trade',
			authority: 'Swedish Government',
			type: 'specification'
		}
	],
	
	// UK
	'OASIS UBL UK': [
		{
			name: 'UK CIUS UBL',
			url: 'https://www.gov.uk/guidance/check-if-you-need-to-use-electronic-invoicing-for-public-sector-contracts',
			description: 'UK Core Invoice Usage Specification',
			authority: 'UK Government',
			type: 'specification'
		}
	]
};

// Updated legislation documents database with recent sources
export const legislationDocuments: Record<string, LegislationDocument[]> = {
	// EU Legislation
	'EU Directive 2014/55/EU': [
		{
			name: 'Directive 2014/55/EU on electronic invoicing',
			url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32014L0055',
			language: 'Multi-language',
			jurisdiction: 'European Union',
			type: 'directive',
			documentId: '32014L0055'
		}
	],
	'EU VAT in the Digital Age': [
		{
			name: 'VAT in the Digital Age Initiative',
			url: 'https://ec.europa.eu/taxation_customs/green-paper-vat-digital-age_en',
			jurisdiction: 'European Union',
			type: 'directive'
		}
	],

	// GERMANY
	'E-Rechnungsverordnung': [
		{
			name: 'E-Rechnungsverordnung (German)',
			url: 'https://www.gesetze-im-internet.de/erv/',
			language: 'German',
			jurisdiction: 'Germany',
			type: 'regulation'
		},
		{
			name: 'Electronic Invoice Regulation (English Summary)',
			url: 'https://www.bundesfinanzministerium.de/Content/EN/FAQ/e-invoicing.html',
			language: 'English',
			jurisdiction: 'Germany',
			type: 'guideline'
		}
	],
	'Umsatzsteuergesetz': [
		{
			name: 'Umsatzsteuergesetz §14 (German)',
			url: 'https://www.gesetze-im-internet.de/ustg_1980/__14.html',
			language: 'German',
			jurisdiction: 'Germany',
			type: 'law'
		}
	],

	// FRANCE
	'Ordonnance 2014-697': [
		{
			name: 'Ordonnance n° 2014-697 (French)',
			url: 'https://www.legifrance.gouv.fr/loda/id/JORFTEXT000029103233/',
			language: 'French',
			jurisdiction: 'France',
			type: 'decree'
		}
	],
	'Chorus Pro Legislation': [
		{
			name: 'Chorus Pro Legal Framework',
			url: 'https://portail.chorus-pro.gouv.fr/aife_csm/?id=aife_documentation_legale',
			language: 'French',
			jurisdiction: 'France',
			type: 'guideline'
		}
	],

	// ITALY
	'Decreto Legislativo 127/2016': [
		{
			name: 'Decreto Legislativo 127/2016 (Italian)',
			url: 'https://www.gazzettaufficiale.it/eli/id/2016/09/21/16G00139/sg',
			language: 'Italian',
			jurisdiction: 'Italy',
			type: 'decree'
		}
	],
	'Legge di Bilancio 2018': [
		{
			name: 'Legge di Bilancio 2018 - Art. 1 c. 909-920 (Italian)',
			url: 'https://www.gazzettaufficiale.it/eli/id/2017/12/29/17G00222/sg',
			language: 'Italian',
			jurisdiction: 'Italy',
			type: 'law'
		}
	],

	// SPAIN - Updated with current legislation
	'Ley 18/2022 Crea y Crece': [
		{
			name: 'Ley 18/2022 de creación y crecimiento de empresas (Spanish)',
			url: 'https://www.boe.es/eli/es/l/2022/09/28/18',
			language: 'Spanish',
			jurisdiction: 'Spain',
			type: 'law'
		}
	],
	'Real Decreto 1007/2023': [
		{
			name: 'Real Decreto 1007/2023 - VERIFACTU (Spanish)',
			url: 'https://www.boe.es/eli/es/rd/2023/12/05/1007',
			language: 'Spanish',
			jurisdiction: 'Spain',
			type: 'decree'
		}
	],
	'Anti-Fraud Law 11/2021': [
		{
			name: 'Ley 11/2021 de medidas de prevención y lucha contra el fraude fiscal (Spanish)',
			url: 'https://www.boe.es/eli/es/l/2021/07/09/11',
			language: 'Spanish',
			jurisdiction: 'Spain',
			type: 'law'
		}
	],

	// POLAND
	'VAT Act Amendment KSeF': [
		{
			name: 'Ustawa o VAT - KSeF provisions (Polish)',
			url: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20040540535',
			language: 'Polish',
			jurisdiction: 'Poland',
			type: 'law'
		}
	],

	// BELGIUM
	'Royal Decree B2G': [
		{
			name: 'Arrêté royal relatif à la facturation électronique (French)',
			url: 'https://www.ejustice.just.fgov.be/eli/arrete/2019/05/16/2019040611/justel',
			language: 'French',
			jurisdiction: 'Belgium',
			type: 'decree'
		},
		{
			name: 'Koninklijk besluit betreffende elektronische facturering (Dutch)',
			url: 'https://www.ejustice.just.fgov.be/eli/arrete/2019/05/16/2019040611/justel',
			language: 'Dutch',
			jurisdiction: 'Belgium',
			type: 'decree'
		},
		{
			name: 'Königlicher Erlass über elektronische Rechnungsstellung (German)',
			url: 'https://www.ejustice.just.fgov.be/eli/arrete/2019/05/16/2019040611/justel',
			language: 'German',
			jurisdiction: 'Belgium',
			type: 'decree'
		}
	],

	// NETHERLANDS
	'Wet elektronische facturering': [
		{
			name: 'Wet elektronische facturering overheidsopdrachten (Dutch)',
			url: 'https://wetten.overheid.nl/BWBR0039518/2018-04-19',
			language: 'Dutch',
			jurisdiction: 'Netherlands',
			type: 'law'
		}
	],

	// UNITED KINGDOM
	'Public Contracts Regulations 2015': [
		{
			name: 'The Public Contracts Regulations 2015',
			url: 'https://www.legislation.gov.uk/uksi/2015/102/contents/made',
			language: 'English',
			jurisdiction: 'United Kingdom',
			type: 'regulation'
		}
	]
};

// Country-specific format mappings - CORRECTED DATA
export const countryFormatMappings: Record<string, string[]> = {
	'DEU': ['UBL', 'CII', 'ZUGFeRD', 'XRechnung', 'EN16931'], // Germany
	'FRA': ['UBL', 'CII', 'Factur-X', 'Chorus Pro', 'EN16931'], // France - Factur-X is France-specific
	'ITA': ['FatturaPA', 'UBL', 'CII'], // Italy - primarily FatturaPA
	'ESP': ['Facturae', 'UBL', 'CII', 'EN16931', 'TicketBAI', 'VERIFACTU'], // Spain - NO Factur-X
	'POL': ['KSeF', 'UBL', 'CII', 'EN16931'], // Poland
	'BEL': ['UBL', 'CII', 'BCIUS', 'EN16931'], // Belgium
	'NLD': ['UBL', 'CII', 'NLCIUS', 'PEPPOL'], // Netherlands
	'NOR': ['UBL', 'EHF', 'PEPPOL'], // Norway
	'SWE': ['UBL', 'SFTI', 'PEPPOL'], // Sweden
	'GBR': ['UBL', 'OASIS UBL UK', 'PEPPOL'] // United Kingdom
};

// Helper functions with enhanced country mapping
export function getFormatSpecifications(formatName: string): FormatSpecification[] {
	// Normalize format name for lookup
	const normalizedName = formatName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
	
	// Try exact match first
	if (formatSpecifications[formatName]) {
		return formatSpecifications[formatName];
	}
	
	// Try partial matches
	for (const [key, specs] of Object.entries(formatSpecifications)) {
		if (key.toLowerCase().includes(normalizedName) || 
			normalizedName.includes(key.toLowerCase())) {
			return specs;
		}
	}
	
	return [];
}

export function getLegislationDocuments(legislationName: string): LegislationDocument[] {
	// Try exact match first
	if (legislationDocuments[legislationName]) {
		return legislationDocuments[legislationName];
	}
	
	// Try partial matches
	for (const [key, docs] of Object.entries(legislationDocuments)) {
		if (key.toLowerCase().includes(legislationName.toLowerCase()) || 
			legislationName.toLowerCase().includes(key.toLowerCase())) {
			return docs;
		}
	}
	
	return [];
}

// Get formats by country code
export function getCountryFormats(countryCode: string): string[] {
	return countryFormatMappings[countryCode] || ['UBL', 'CII', 'EN16931']; // Default to common EU formats
}

// Data source tracking for refresh functionality
export interface DataSource {
	name: string;
	url: string;
	lastChecked: string;
	authority: string;
}

export const dataSources: DataSource[] = [
	{
		name: 'European Commission - DigitalMT',
		url: 'https://ec.europa.eu/digital-building-blocks/sites/display/DIGITAL/',
		lastChecked: new Date().toISOString(),
		authority: 'European Commission'
	},
	{
		name: 'GENA Global Exchange Network',
		url: 'https://www.gena.net/',
		lastChecked: new Date().toISOString(),
		authority: 'GENA Association'
	},
	{
		name: 'OpenPEPPOL Authority',
		url: 'https://peppol.eu/',
		lastChecked: new Date().toISOString(),
		authority: 'OpenPEPPOL AISBL'
	},
	{
		name: 'UN/CEFACT Standards',
		url: 'https://unece.org/trade/uncefact',
		lastChecked: new Date().toISOString(),
		authority: 'United Nations'
	},
	{
		name: 'Spanish Tax Authority (AEAT)',
		url: 'https://www.agenciatributaria.es/',
		lastChecked: new Date().toISOString(),
		authority: 'Spanish Government'
	},
	{
		name: 'German FeRD Association',
		url: 'https://www.ferd-net.de/',
		lastChecked: new Date().toISOString(),
		authority: 'German Government'
	},
	{
		name: 'Italian Revenue Agency',
		url: 'https://www.agenziaentrate.gov.it/',
		lastChecked: new Date().toISOString(),
		authority: 'Italian Government'
	},
	{
		name: 'French Chorus Pro',
		url: 'https://portail.chorus-pro.gouv.fr/',
		lastChecked: new Date().toISOString(),
		authority: 'French Government'
	}
];