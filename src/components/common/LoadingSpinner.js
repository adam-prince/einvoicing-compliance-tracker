import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function LoadingSpinner({ message = 'Loading...', size = 'medium', className = '' }) {
    const sizeClasses = {
        small: 'spinner-small',
        medium: 'spinner-medium',
        large: 'spinner-large'
    };
    return (_jsxs("div", { className: `loading-container ${className}`, role: "status", "aria-live": "polite", "aria-label": message, children: [_jsx("div", { className: `spinner ${sizeClasses[size]}`, children: _jsx("div", { className: "spinner-circle" }) }), message && (_jsx("p", { className: "loading-message", "aria-hidden": "true", children: message }))] }));
}
export function TableLoadingSkeleton({ rows = 5 }) {
    return (_jsx("div", { className: "table-skeleton", "aria-label": "Loading table data", children: Array.from({ length: rows }).map((_, i) => (_jsxs("div", { className: "skeleton-row", children: [_jsx("div", { className: "skeleton skeleton-cell", style: { width: '30%' } }), _jsx("div", { className: "skeleton skeleton-cell", style: { width: '20%' } }), _jsx("div", { className: "skeleton skeleton-cell", style: { width: '15%' } }), _jsx("div", { className: "skeleton skeleton-cell", style: { width: '15%' } }), _jsx("div", { className: "skeleton skeleton-cell", style: { width: '15%' } }), _jsx("div", { className: "skeleton skeleton-cell", style: { width: '5%' } })] }, i))) }));
}
