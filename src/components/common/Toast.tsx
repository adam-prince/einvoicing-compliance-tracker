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
		<div className="toast-container" role="status" aria-live="polite">
			<div className="toast">
				{message}
			</div>
		</div>
	);
}


