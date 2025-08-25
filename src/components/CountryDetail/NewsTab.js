import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from 'carbon-react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EnhancedLink } from '../common/EnhancedLink';
import { useI18n } from '../../i18n';
export function NewsTab({ newsItems, loadingNews, onRefreshNews, onSmartLink, countryCode, generateSourceUrl }) {
    const { t, formatDate } = useI18n();
    const getSourceTypeColor = (sourceType) => {
        switch (sourceType) {
            case 'Official': return '#059669'; // Green
            case 'GENA': return '#dc2626'; // Red
            case 'Government': return '#2563eb'; // Blue
            case 'Consulting': return '#7c3aed'; // Purple
            case 'VATCalc': return '#ea580c'; // Orange
            default: return '#6b7280'; // Gray
        }
    };
    return (_jsxs("div", { id: "panel-news", role: "tabpanel", "aria-labelledby": "tab-news", children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, children: [_jsx("h3", { style: { margin: 0 }, children: t('news_title') }), _jsx(Button, { onClick: onRefreshNews, disabled: loadingNews, size: "small", variant: "secondary", "aria-label": "Refresh news data", children: loadingNews ? (t('button_refreshing') || 'Loading...') : (t('button_refresh_news') || 'Refresh News') })] }), loadingNews ? (_jsx(LoadingSpinner, { message: t('loading_news') })) : (_jsx("div", { className: "news-container", style: { maxHeight: '600px', overflowY: 'auto', paddingRight: '8px' }, children: newsItems.length > 0 ? (newsItems.map((item) => (_jsxs("div", { className: `news-item ${item.relevance}-relevance`, style: {
                        background: 'var(--panel-2)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        padding: 16,
                        marginBottom: 12,
                        position: 'relative',
                        transition: 'all 0.2s ease'
                    }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }, children: [_jsx("h4", { style: {
                                        margin: 0,
                                        color: 'var(--text)',
                                        fontSize: 14,
                                        lineHeight: 1.4,
                                        fontWeight: '600',
                                        paddingRight: '80px'
                                    }, children: item.title }), _jsx("span", { className: "badge news-source-badge", style: {
                                        background: getSourceTypeColor(item.sourceType),
                                        color: 'white',
                                        fontSize: 10,
                                        padding: '3px 8px',
                                        position: 'absolute',
                                        top: 16,
                                        right: 16,
                                        flexShrink: 0
                                    }, children: item.sourceType })] }), _jsx("p", { style: { color: 'var(--text)', fontSize: 13, lineHeight: 1.4, margin: '8px 0' }, children: item.summary }), _jsxs("div", { className: "news-meta", style: {
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: 11,
                                color: 'var(--muted)',
                                marginTop: 12
                            }, children: [_jsxs("div", { className: "news-source", children: [_jsx("strong", { children: t('news_source') }), " ", item.source] }), _jsx("div", { className: "news-date", children: formatDate(item.date) })] }), _jsx("div", { style: { marginTop: 8 }, children: _jsx(EnhancedLink, { url: item.url || generateSourceUrl(item.sourceType, item.source, countryCode, item.title), title: item.title, countryCode: countryCode, linkType: "news", lastUpdated: item.date, children: _jsx(Button, { size: "small", variant: "tertiary", "aria-label": `More info about: ${item.title}. Opens source ${item.source} in a new tab with smart link handling.`, style: { pointerEvents: 'none' }, children: t('news_more_info') }) }) })] }, item.id)))) : (_jsxs("div", { className: "no-news", style: { textAlign: 'center', padding: 48, color: 'var(--muted)' }, children: [_jsx("p", { style: { margin: '8px 0', fontSize: 14 }, children: t('no_news_available') }), _jsx("p", { style: { fontSize: 12, color: 'var(--muted)' }, children: t('check_back_later') })] })) }))] }));
}
