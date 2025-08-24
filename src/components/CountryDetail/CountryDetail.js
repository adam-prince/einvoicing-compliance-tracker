import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useRef, useEffect } from 'react';
import { Modal } from 'carbon-react';
import { ProgressOverlay } from '../common/ProgressOverlay';
import { Toast } from '../common/Toast';
import { OverviewTab } from './OverviewTab';
import { TimelineTab } from './TimelineTab';
import { NewsTab } from './NewsTab';
import { TabNavigation } from './TabNavigation';
import { useCountryDetail } from '../../hooks/useCountryDetail';
import { AriaUtils, announcer } from '../../utils/accessibility';
export function CountryDetail({ country, onClose }) {
    const modalRef = useRef(null);
    const previouslyFocusedRef = useRef(null);
    const { activeTab, setActiveTab, timelineData, isRefreshing, refreshError, progress, newsItems, loadingNews, linkStatuses, toast, setToast, handleSmartLink, generateSourceUrl, loadNewsData, handleRefreshTimeline } = useCountryDetail(country);
    // Focus management & accessibility setup
    useEffect(() => {
        const container = modalRef.current;
        if (!container)
            return;
        // Set up modal ARIA attributes and focus management
        AriaUtils.setupModalAria(container);
        // Announce modal opening
        announcer.announce(`${country.name} country details dialog opened`, 'assertive');
        return () => {
            // Cleanup modal ARIA and focus management
            AriaUtils.cleanupModalAria(container);
            announcer.announce('Country details dialog closed', 'polite');
        };
    }, [country.name]);
    // Announce tab changes
    useEffect(() => {
        const tabNames = {
            overview: 'Overview',
            timeline: 'Timeline',
            news: 'News & Updates'
        };
        announcer.announce(`${tabNames[activeTab] || 'Unknown'} tab selected`, 'polite');
    }, [activeTab]);
    return (_jsx(Modal, { open: true, onCancel: onClose, title: "Country Details", subtitle: `${country.name} • ${country.continent} • ${country.isoCode3}`, size: "xlarge", "aria-describedby": "country-detail-description", children: _jsxs("div", { ref: modalRef, role: "dialog", "aria-labelledby": "modal-title", children: [_jsxs("div", { id: "country-detail-description", className: "sr-only", children: ["Detailed information about ", country.name, " e-invoicing compliance status including overview, timeline, and news updates."] }), _jsx(TabNavigation, { activeTab: activeTab, onTabChange: setActiveTab }), isRefreshing && (_jsx("div", { className: "progress-modal-container", children: _jsxs("div", { className: "progress-modal-content", children: [_jsx("h3", { style: { margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }, children: "Updating Progress" }), _jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-fill", style: { width: `${progress.percentage}%` } }) }), _jsxs("div", { className: "progress-text", children: [_jsxs("span", { className: "progress-percentage", children: [progress.percentage, "%"] }), _jsx("span", { className: "progress-message", children: progress.message })] })] }) })), _jsxs("div", { className: "modal-content", children: [activeTab === 'overview' && (_jsx(OverviewTab, { country: country, linkStatuses: linkStatuses, onSmartLink: handleSmartLink })), activeTab === 'timeline' && (_jsx(TimelineTab, { timelineData: timelineData, isRefreshing: isRefreshing, refreshError: refreshError, onRefresh: handleRefreshTimeline })), activeTab === 'news' && (_jsx(NewsTab, { newsItems: newsItems, loadingNews: loadingNews, onRefreshNews: loadNewsData, onSmartLink: handleSmartLink, countryCode: country.isoCode3, generateSourceUrl: generateSourceUrl }))] }), _jsx(ProgressOverlay, { visible: loadingNews, message: "Searching for news updates..." }), _jsx(Toast, { visible: toast.visible, message: toast.message, onClose: () => setToast({ visible: false, message: '' }) })] }) }));
}
