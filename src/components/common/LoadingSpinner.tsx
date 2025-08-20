import React from 'react';

interface LoadingSpinnerProps {
	message?: string;
	size?: 'small' | 'medium' | 'large';
	className?: string;
}

export function LoadingSpinner({ 
	message = 'Loading...', 
	size = 'medium',
	className = '' 
}: LoadingSpinnerProps) {
	const sizeClasses = {
		small: 'spinner-small',
		medium: 'spinner-medium',
		large: 'spinner-large'
	};

	return (
		<div 
			className={`loading-container ${className}`}
			role="status" 
			aria-live="polite"
			aria-label={message}
		>
			<div className={`spinner ${sizeClasses[size]}`}>
				<div className="spinner-circle"></div>
			</div>
			{message && (
				<p className="loading-message" aria-hidden="true">
					{message}
				</p>
			)}
		</div>
	);
}

export function TableLoadingSkeleton({ rows = 5 }: { rows?: number }) {
	return (
		<div className="table-skeleton" aria-label="Loading table data">
			{Array.from({ length: rows }).map((_, i) => (
				<div key={i} className="skeleton-row">
					<div className="skeleton skeleton-cell" style={{ width: '30%' }} />
					<div className="skeleton skeleton-cell" style={{ width: '20%' }} />
					<div className="skeleton skeleton-cell" style={{ width: '15%' }} />
					<div className="skeleton skeleton-cell" style={{ width: '15%' }} />
					<div className="skeleton skeleton-cell" style={{ width: '15%' }} />
					<div className="skeleton skeleton-cell" style={{ width: '5%' }} />
				</div>
			))}
		</div>
	);
}