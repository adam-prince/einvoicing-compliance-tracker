import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
export function SearchRedirect({ query, onClose }) {
    const closeButtonRef = useRef(null);
    useEffect(() => {
        // Open search in a new tab/window using a mainstream engine
        // We cannot programmatically determine the user's default search engine
        // from the browser, so we default to Google here.
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        const newWin = window.open(searchUrl, '_blank', 'noopener,noreferrer');
        if (!newWin) {
            console.warn('Popup blocked when opening search. Showing link instead.');
        }
        // Focus close for keyboard users
        setTimeout(() => closeButtonRef.current?.focus(), 0);
    }, [query]);
    return (_jsx("div", { className: "modal-backdrop", role: "dialog", "aria-modal": "true", "aria-labelledby": "search-redirect-title", "aria-describedby": "search-redirect-desc", onClick: onClose, children: _jsxs("div", { className: "modal", style: { maxWidth: 520 }, onClick: (e) => e.stopPropagation(), children: [_jsxs("header", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("h2", { id: "search-redirect-title", style: { margin: 0 }, children: "Searching" }), _jsx("button", { ref: closeButtonRef, onClick: onClose, className: "modal-close-button", "aria-label": "Close search window", children: "\u2715" })] }), _jsxs("div", { style: { marginTop: 12 }, children: [_jsxs("p", { id: "search-redirect-desc", style: { marginTop: 0 }, children: ["We opened a new tab with a web search for: ", _jsx("strong", { children: query })] }), _jsxs("p", { style: { fontSize: 12, color: 'var(--muted)' }, children: ["If nothing appeared, your browser may have blocked popups. You can use this", ' ', _jsx("a", { href: `https://www.google.com/search?q=${encodeURIComponent(query)}`, target: "_blank", rel: "noopener noreferrer", children: "direct search link" }), "."] })] })] }) }));
}
