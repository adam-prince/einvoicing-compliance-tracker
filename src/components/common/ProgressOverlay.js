import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ProgressOverlay({ visible, message, progress = 0, onClose }) {
    if (!visible)
        return null;
    return (_jsx("div", { className: "modal-backdrop", role: "dialog", "aria-modal": "true", "aria-label": "Progress", children: _jsxs("div", { className: "modal", style: { maxWidth: 480 }, children: [_jsxs("header", { children: [_jsx("strong", { children: "Update in progress" }), onClose && _jsx("button", { onClick: onClose, children: "Close" })] }), _jsxs("div", { style: { padding: 16 }, children: [_jsx("p", { style: { marginTop: 0 }, children: message }), _jsx("div", { style: { height: 8, width: '100%', background: '#e5e7eb', borderRadius: 8, overflow: 'hidden' }, "aria-label": "progressbar", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": progress, children: _jsx("div", { style: { height: '100%', width: `${Math.max(0, Math.min(100, progress))}%`, background: '#00d639', transition: 'width 300ms ease' } }) })] })] }) }));
}
