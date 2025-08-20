export function ClearCacheButton() {
	async function handleClick() {
		try {
			if ('caches' in window) {
				const names = await caches.keys();
				await Promise.all(names.map((n) => caches.delete(n)));
			}
			if ('serviceWorker' in navigator) {
				const regs = await navigator.serviceWorker.getRegistrations();
				await Promise.all(regs.map((r) => r.unregister()));
			}
			localStorage.clear();
			sessionStorage.clear();
		} catch (err) {
			console.error('Cache clear error', err);
		}
		const url = new URL(window.location.href);
		url.searchParams.set('v', Date.now().toString());
		window.location.replace(url.toString());
	}

	return (
		<button onClick={handleClick} title="Reset cached data and reload">Reset</button>
	);
}



