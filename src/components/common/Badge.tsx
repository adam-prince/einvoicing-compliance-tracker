import React from 'react';

interface BadgeProps {
	status: string;
	className?: string;
	size?: 'small' | 'medium' | 'large';
}

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
} as const;

export const Badge = React.memo(({ status, className = '', size = 'medium' }: BadgeProps) => {
	const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unknown;
	
	const sizeClass = size !== 'medium' ? `badge-${size}` : '';
	
	return (
		<span 
			className={`badge ${config.className} ${sizeClass} ${className}`.trim()}
			role="status"
			aria-label={config.ariaLabel}
			title={config.ariaLabel}
		>
			{config.label}
		</span>
	);
});

Badge.displayName = 'Badge';

export default Badge;