import React, { useEffect } from 'react';

interface ToastProps {
	message: string;
	visible: boolean;
	onClose?: () => void;
	durationMs?: number;
}

export function Toast({ message, visible, onClose, durationMs = 3500 }: ToastProps) {
	useEffect(() => {
		if (!visible) return;
		const t = setTimeout(() => onClose && onClose(), durationMs);
		return () => clearTimeout(t);
	}, [visible, onClose, durationMs]);

	if (!visible) return null;
	return (
		<div 
			className="toast-container" 
			role="status" 
			aria-live="polite"
			aria-atomic="true"
			style={{
				position: 'fixed',
				top: '20px',
				right: '20px',
				zIndex: 1000,
				pointerEvents: 'auto'
			}}
		>
			<div 
				className="toast"
				style={{
					background: 'var(--success-bg, #10b981)',
					color: 'white',
					padding: '12px 16px',
					borderRadius: '8px',
					boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
					border: '1px solid var(--success-border, #059669)',
					maxWidth: '400px',
					wordWrap: 'break-word',
					fontSize: '14px',
					lineHeight: '1.4'
				}}
			>
				{message}
				{onClose && (
					<button
						onClick={onClose}
						aria-label="Close notification"
						style={{
							background: 'transparent',
							border: 'none',
							color: 'white',
							float: 'right',
							marginLeft: '12px',
							cursor: 'pointer',
							fontSize: '16px',
							lineHeight: '1',
							padding: '0',
							marginTop: '-2px'
						}}
					>
						×
					</button>
				)}
			</div>
		</div>
	);
}


