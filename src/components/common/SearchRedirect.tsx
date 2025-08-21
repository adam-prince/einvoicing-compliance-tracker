import React, { useEffect, useRef } from 'react';

interface SearchRedirectProps {
	query: string;
	onClose: () => void;
}

export function SearchRedirect({ query, onClose }: SearchRedirectProps) {
	const closeButtonRef = useRef<HTMLButtonElement | null>(null);

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

	return (
		<div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="search-redirect-title" aria-describedby="search-redirect-desc" onClick={onClose}>
			<div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
				<header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<h2 id="search-redirect-title" style={{ margin: 0 }}>Searching</h2>
					<button ref={closeButtonRef} onClick={onClose} className="modal-close-button" aria-label="Close search window">✕</button>
				</header>
				<div style={{ marginTop: 12 }}>
					<p id="search-redirect-desc" style={{ marginTop: 0 }}>
						We opened a new tab with a web search for: <strong>{query}</strong>
					</p>
					<p style={{ fontSize: 12, color: 'var(--muted)' }}>
						If nothing appeared, your browser may have blocked popups. You can use this
						{' '}<a href={`https://www.google.com/search?q=${encodeURIComponent(query)}`} target="_blank" rel="noopener noreferrer">direct search link</a>.
					</p>
				</div>
			</div>
		</div>
	);
}


