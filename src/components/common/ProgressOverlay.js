import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ProgressOverlay({ visible, message, progress = 0, onClose }) {
    if (!visible)
        return null;
    const progressPercent = Math.max(0, Math.min(100, progress));
    const progressId = 'progress-bar-' + Math.random().toString(36).substr(2, 9);
    const titleId = 'progress-title-' + Math.random().toString(36).substr(2, 9);
    return (_jsx("div", { className: "modal-backdrop", role: "dialog", "aria-modal": "true", "aria-labelledby": titleId, "aria-describedby": progressId, children: _jsxs("div", { className: "modal", style: { maxWidth: 480 }, children: [_jsxs("header", { style: {
                        padding: 16,
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }, children: [_jsx("strong", { id: titleId, children: "Update in progress" }), onClose && (_jsx("button", { onClick: onClose, "aria-label": "Close progress dialog", style: {
                                background: 'var(--button-bg, #f3f4f6)',
                                border: '1px solid var(--border, #d1d5db)',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }, children: "Close" }))] }), _jsxs("div", { style: { padding: 16 }, children: [_jsx("p", { style: { marginTop: 0, marginBottom: 16, minHeight: '1.5em' }, "aria-live": "polite", children: message || 'Processing...' }), _jsx("div", { role: "progressbar", id: progressId, "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": progressPercent, "aria-label": `Progress: ${Math.round(progressPercent)}% complete`, style: {
                                height: 12,
                                width: '100%',
                                background: '#e5e7eb',
                                borderRadius: 6,
                                overflow: 'hidden',
                                border: '1px solid var(--border, #d1d5db)'
                            }, children: _jsx("div", { style: {
                                    height: '100%',
                                    width: `${progressPercent}%`,
                                    background: 'var(--accent, #00d639)',
                                    transition: 'width 300ms ease',
                                    borderRadius: '5px'
                                } }) }), _jsxs("div", { style: {
                                marginTop: 8,
                                fontSize: '12px',
                                color: 'var(--muted, #6b7280)',
                                textAlign: 'center'
                            }, children: [Math.round(progressPercent), "% complete"] })] })] }) }));
}
