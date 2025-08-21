import { jsx as _jsx } from "react/jsx-runtime";
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
    return (_jsx(I18nProvider, { language: language, children: _jsx(ErrorBoundary, { children: _jsx(App, {}) }) }));
}
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(Root, {}) }));
