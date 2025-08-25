import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useI18n } from '../../i18n';
export function TabNavigation({ activeTab, onTabChange }) {
    const { t } = useI18n();
    const handleKeyDown = (e, tab) => {
        const order = ['overview', 'timeline', 'news'];
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onTabChange(tab);
        }
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'Home' || e.key === 'End') {
            e.preventDefault();
            const idx = order.indexOf(activeTab);
            let next = idx;
            if (e.key === 'ArrowRight')
                next = (idx + 1) % order.length;
            if (e.key === 'ArrowLeft')
                next = (idx - 1 + order.length) % order.length;
            if (e.key === 'Home')
                next = 0;
            if (e.key === 'End')
                next = order.length - 1;
            onTabChange(order[next]);
            const nextId = `tab-${order[next]}`;
            document.getElementById(nextId)?.focus();
        }
    };
    return (_jsx("div", { className: "tab-navigation tabs-sticky", role: "tablist", "aria-label": "Country details tabs", children: _jsxs("div", { className: "tab-container", children: [_jsx("div", { className: `tab-button ${activeTab === 'overview' ? 'active' : ''}`, onClick: () => onTabChange('overview'), role: "tab", id: "tab-overview", "aria-selected": activeTab === 'overview', "aria-controls": "panel-overview", tabIndex: activeTab === 'overview' ? 0 : -1, onKeyDown: (e) => handleKeyDown(e, 'overview'), children: t('tabs_overview') }), _jsx("div", { className: `tab-button ${activeTab === 'timeline' ? 'active' : ''}`, onClick: () => onTabChange('timeline'), role: "tab", id: "tab-timeline", "aria-selected": activeTab === 'timeline', "aria-controls": "panel-timeline", tabIndex: activeTab === 'timeline' ? 0 : -1, onKeyDown: (e) => handleKeyDown(e, 'timeline'), children: t('timeline_title') }), _jsx("div", { className: `tab-button ${activeTab === 'news' ? 'active' : ''}`, onClick: () => onTabChange('news'), role: "tab", id: "tab-news", "aria-selected": activeTab === 'news', "aria-controls": "panel-news", tabIndex: activeTab === 'news' ? 0 : -1, onKeyDown: (e) => handleKeyDown(e, 'news'), children: t('news_title') })] }) }));
}
