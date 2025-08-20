import { ClearCacheButton } from './ClearCacheButton';

export function FloatingClear() {
	const style: React.CSSProperties = {
		position: 'fixed',
		bottom: 16,
		right: 16,
		zIndex: 10000,
	};
	return (
		<div style={style}>
			<ClearCacheButton />
		</div>
	);
}



