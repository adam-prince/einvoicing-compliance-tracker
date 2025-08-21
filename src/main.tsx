import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './styles.css';
import { I18nProvider } from './i18n';
import { useStore } from './store/useStore';

function Root() {
	// We use a tiny wrapper to read language from store once
	// Note: store is safe here — we only need the value to pass to provider
	const { language } = useStore();
	return (
		<I18nProvider language={language}>
			<ErrorBoundary>
				<App />
			</ErrorBoundary>
		</I18nProvider>
	);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<Root />
	</React.StrictMode>
);


