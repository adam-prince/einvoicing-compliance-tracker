import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './styles.css';
import { I18nProvider } from './i18n';
import { useStore } from './store/useStore';

function Root() {
	console.log('Root component rendering...');
	try {
		const { language } = useStore();
		return (
			<I18nProvider language={language}>
				<ErrorBoundary>
					<App />
				</ErrorBoundary>
			</I18nProvider>
		);
	} catch (error) {
		console.error('Error in Root component:', error);
		return <div>Error loading application: {String(error)}</div>;
	}
}

console.log('main.tsx executing...');
document.title = 'E‑Invoicing Compliance Tracker';

const rootElement = document.getElementById('root');
console.log('Root element found:', rootElement);

if (rootElement) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(<Root />);
	console.log('React app rendered successfully');
} else {
	console.error('Root element not found!');
	document.body.innerHTML = '<h1 style="color: red;">Error: Root element not found</h1>';
}