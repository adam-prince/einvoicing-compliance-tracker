import { jsx as _jsx } from "react/jsx-runtime";
import { ClearCacheButton } from './ClearCacheButton';
export function FloatingClear() {
    const style = {
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 10000,
    };
    return (_jsx("div", { style: style, children: _jsx(ClearCacheButton, {}) }));
}
