import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo } from 'react';
import en from './locales/en';
import de from './locales/de';
import fr from './locales/fr';
import es from './locales/es';
const langToShort = (lang) => {
    const l = (lang || 'en').toLowerCase();
    if (l.startsWith('de'))
        return 'de';
    if (l.startsWith('fr'))
        return 'fr';
    if (l.startsWith('es'))
        return 'es';
    return 'en';
};
const bundles = { en, de, fr, es };
const I18nContext = createContext(null);
export function I18nProvider({ language, children }) {
    const short = langToShort(language);
    const value = useMemo(() => {
        const base = bundles[short] || en;
        const fallback = en;
        const t = (key, vars) => {
            const baseVal = base[key];
            const fallbackVal = fallback[key];
            let template = (typeof baseVal === 'string' ? baseVal : undefined)
                ?? (typeof fallbackVal === 'string' ? fallbackVal : undefined)
                ?? key;
            if (vars) {
                for (const [k, v] of Object.entries(vars)) {
                    template = template.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
                }
            }
            return template;
        };
        const formatDate = (iso, opts) => {
            try {
                return new Date(iso).toLocaleDateString(language, opts ?? { day: '2-digit', month: 'short', year: 'numeric' });
            }
            catch {
                return iso;
            }
        };
        const displayRegionName = (isoCode2, fallback) => {
            try {
                if (!isoCode2)
                    return fallback || '';
                // Intl.DisplayNames uses region code in ISO 3166-1 alpha-2
                const dn = new Intl.DisplayNames(language, { type: 'region' });
                const name = dn.of(String(isoCode2).toUpperCase());
                return (typeof name === 'string' && name.trim().length > 0) ? name : (fallback || '');
            }
            catch {
                return fallback || '';
            }
        };
        return { language, messages: base, t, formatDate, displayRegionName };
    }, [language, short]);
    return _jsx(I18nContext.Provider, { value: value, children: children });
}
export function useI18n() {
    const ctx = useContext(I18nContext);
    if (!ctx)
        throw new Error('useI18n must be used within I18nProvider');
    return ctx;
}
