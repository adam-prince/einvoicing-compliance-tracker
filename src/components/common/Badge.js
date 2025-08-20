import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
const statusConfig = {
    mandated: {
        className: 'green',
        label: 'Mandated',
        ariaLabel: 'E-invoicing is mandated'
    },
    planned: {
        className: 'yellow',
        label: 'Planned',
        ariaLabel: 'E-invoicing is planned'
    },
    permitted: {
        className: 'yellow',
        label: 'Permitted',
        ariaLabel: 'E-invoicing is permitted'
    },
    voluntary: {
        className: 'yellow',
        label: 'Voluntary',
        ariaLabel: 'E-invoicing is voluntary'
    },
    none: {
        className: 'gray',
        label: 'None',
        ariaLabel: 'No e-invoicing requirements'
    },
    unknown: {
        className: 'gray',
        label: 'Unknown',
        ariaLabel: 'E-invoicing status unknown'
    }
};
export const Badge = React.memo(({ status, className = '', size = 'medium' }) => {
    const config = statusConfig[status] || statusConfig.unknown;
    const sizeClass = size !== 'medium' ? `badge-${size}` : '';
    return (_jsx("span", { className: `badge ${config.className} ${sizeClass} ${className}`.trim(), role: "status", "aria-label": config.ariaLabel, title: config.ariaLabel, children: config.label }));
});
Badge.displayName = 'Badge';
export default Badge;
