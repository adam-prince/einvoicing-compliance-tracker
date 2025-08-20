const THEME_STORAGE_KEY = 'app_theme_v1';
function setCssVar(name, value) {
    document.documentElement.style.setProperty(name, value);
}
function pick(obj, key) {
    return key.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : undefined), obj);
}
function toColor(v) {
    if (!v)
        return undefined;
    const s = String(v).trim();
    if (!s)
        return undefined;
    // Accept hex, rgb/rgba, hsl/hsla or named colors
    return s;
}
export function applyThemeFromJson(theme) {
    if (!theme || typeof theme !== 'object')
        return;
    // Heuristic mappings
    const candidates = {
        '--primary': ['colors.primary', 'palette.primary', 'brand.primary', 'semantic.primary'],
        '--bg': ['colors.background', 'palette.background', 'surface.background', 'semantic.background'],
        '--panel': ['colors.panel', 'palette.surface', 'surface.panel'],
        '--panel-2': ['colors.panel2', 'palette.surfaceAlt', 'surface.panelAlt'],
        '--text': ['colors.text', 'palette.onSurface', 'semantic.text.primary'],
        '--muted': ['colors.muted', 'semantic.text.secondary'],
        '--green': ['colors.success', 'semantic.success'],
        '--yellow': ['colors.warning', 'semantic.warning'],
        '--red': ['colors.error', 'semantic.error'],
        '--gray': ['colors.neutral', 'palette.neutral'],
    };
    for (const [cssVar, keys] of Object.entries(candidates)) {
        let applied = false;
        for (const k of keys) {
            const val = toColor(pick(theme, k));
            if (val) {
                setCssVar(cssVar, val);
                applied = true;
                break;
            }
        }
        if (!applied) {
            const fallback = findFirstColor(theme, cssVar);
            if (fallback)
                setCssVar(cssVar, fallback);
        }
    }
    // Typography
    const font = pick(theme, 'typography.fontFamily') || pick(theme, 'font.family');
    if (font) {
        document.body.style.fontFamily = String(font);
    }
}
export function loadSavedTheme() {
    try {
        const raw = localStorage.getItem(THEME_STORAGE_KEY);
        if (!raw)
            return;
        const json = JSON.parse(raw);
        applyThemeFromJson(json);
    }
    catch { /* ignore */ }
}
export function saveTheme(theme) {
    try {
        localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
    }
    catch { /* ignore */ }
}
function isColorString(s) {
    return /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(s)
        || /^rgba?\(/i.test(s)
        || /^hsla?\(/i.test(s)
        || /^[a-z]+$/i.test(s);
}
function findFirstColor(obj, hint) {
    try {
        const queue = [obj];
        while (queue.length) {
            const cur = queue.shift();
            if (cur && typeof cur === 'object') {
                for (const [k, v] of Object.entries(cur)) {
                    if (typeof v === 'string' && isColorString(v))
                        return v;
                    if (v && typeof v === 'object')
                        queue.push(v);
                }
            }
        }
    }
    catch { /* ignore */ }
    return undefined;
}
