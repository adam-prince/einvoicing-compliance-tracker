import React, { createContext, useContext, useMemo } from 'react';

import en from './locales/en';
import de from './locales/de';
import fr from './locales/fr';
import es from './locales/es';

type Messages = Record<string, string>;

const langToShort = (lang: string): 'en' | 'de' | 'fr' | 'es' => {
	const l = (lang || 'en').toLowerCase();
	if (l.startsWith('de')) return 'de';
	if (l.startsWith('fr')) return 'fr';
	if (l.startsWith('es')) return 'es';
	return 'en';
};

const bundles: Record<'en' | 'de' | 'fr' | 'es', Messages> = { en, de, fr, es } as const;

interface I18nContextValue {
	language: string;
	messages: Messages;
	formatDate: (iso: string, opts?: Intl.DateTimeFormatOptions) => string;
	t: (key: string, vars?: Record<string, string | number>) => string;
	displayRegionName: (isoCode2?: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface ProviderProps {
	language: string;
	children: React.ReactNode;
}

export function I18nProvider({ language, children }: ProviderProps) {
	const short = langToShort(language);
	const value = useMemo<I18nContextValue>(() => {
		const base: Messages = bundles[short] || en;
		const fallback: Messages = en;
		const t = (key: string, vars?: Record<string, string | number>) => {
			const baseVal = (base as any)[key];
			const fallbackVal = (fallback as any)[key];
			let template: string = (typeof baseVal === 'string' ? baseVal : undefined)
				?? (typeof fallbackVal === 'string' ? fallbackVal : undefined)
				?? key;
			if (vars) {
				for (const [k, v] of Object.entries(vars)) {
					template = template.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
				}
			}
			return template;
		};
		const formatDate = (iso: string, opts?: Intl.DateTimeFormatOptions) => {
			try {
				return new Date(iso).toLocaleDateString(language, opts ?? { day: '2-digit', month: 'short', year: 'numeric' });
			} catch {
				return iso;
			}
		};
		const displayRegionName = (isoCode2?: string, fallback?: string) => {
			try {
				if (!isoCode2) return fallback || '';
				// Intl.DisplayNames uses region code in ISO 3166-1 alpha-2
				const dn = new (Intl as any).DisplayNames(language, { type: 'region' });
				const name = dn.of(String(isoCode2).toUpperCase());
				return (typeof name === 'string' && name.trim().length > 0) ? name : (fallback || '');
			} catch {
				return fallback || '';
			}
		};
		return { language, messages: base, t, formatDate, displayRegionName };
	}, [language, short]);

	return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
	const ctx = useContext(I18nContext);
	if (!ctx) throw new Error('useI18n must be used within I18nProvider');
	return ctx;
}


