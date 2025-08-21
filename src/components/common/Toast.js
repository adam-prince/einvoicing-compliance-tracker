import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
export function Toast({ message, visible, onClose, durationMs = 3500 }) {
    useEffect(() => {
        if (!visible)
            return;
        const t = setTimeout(() => onClose && onClose(), durationMs);
        return () => clearTimeout(t);
    }, [visible, onClose, durationMs]);
    if (!visible)
        return null;
    return (_jsx("div", { className: "toast-container", role: "status", "aria-live": "polite", children: _jsx("div", { className: "toast", children: message }) }));
}
