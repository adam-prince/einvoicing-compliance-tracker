import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { Button } from 'carbon-react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useI18n } from '../../i18n';
export function TimelineTab({ timelineData, isRefreshing, refreshError, onRefresh }) {
    const { t, formatDate } = useI18n();
    // Group timeline events by category
    const groupedTimeline = useMemo(() => {
        if (!timelineData) {
            return {
                'B2G': [],
                'B2B': [],
                'B2C': [],
                'reporting': []
            };
        }
        const groups = {
            'B2G': [],
            'B2B': [],
            'B2C': [],
            'reporting': []
        };
        timelineData.timeline.forEach((event) => {
            const category = event.category;
            if (groups[category]) {
                groups[category].push(event);
            }
        });
        // Sort events by date within each group
        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        });
        return groups;
    }, [timelineData]);
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'mandated': return 'timeline-status mandated';
            case 'planned': return 'timeline-status planned';
            case 'permitted': return 'timeline-status permitted';
            default: return 'timeline-status';
        }
    };
    const renderTimelineSection = (title, events) => {
        if (events.length === 0)
            return null;
        return (_jsxs("div", { className: "timeline-section", children: [_jsx("h4", { children: title === 'reporting'
                        ? (t('timeline_periodic_reporting') || 'Periodic E-Reporting')
                        : (t(`timeline_${title}`) || `Business-to-${title.slice(2)} (${title})`) }), events.map((event, index) => (_jsxs("div", { className: "timeline-item", children: [_jsx("div", { className: "timeline-date", children: formatDate(event.date) }), _jsxs("div", { className: "timeline-content", children: [_jsxs("div", { className: "timeline-description", children: [event.description, _jsx("span", { className: getStatusBadgeClass(event.status), children: t(`status_${event.status}`) || event.status.charAt(0).toUpperCase() + event.status.slice(1) })] }), event.threshold && (_jsxs("div", { className: "timeline-threshold", children: [t('timeline_threshold') || 'Threshold', ": ", event.threshold] }))] })] }, index)))] }, title));
    };
    return (_jsxs("div", { id: "panel-timeline", role: "tabpanel", "aria-labelledby": "tab-timeline", children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, children: [_jsx("h3", { style: { margin: 0 }, children: t('timeline_title') }), _jsx(Button, { onClick: onRefresh, disabled: isRefreshing, size: "small", variant: "secondary", "aria-label": "Refresh compliance data", children: isRefreshing ? (t('button_refreshing') || 'Refreshing...') : (t('button_refresh_data') || 'Refresh Data') })] }), refreshError && (_jsx("div", { style: {
                    padding: 12,
                    background: '#fecaca',
                    border: '1px solid #ef4444',
                    borderRadius: 8,
                    marginBottom: 16,
                    color: '#7f1d1d'
                }, children: refreshError })), isRefreshing ? (_jsx(LoadingSpinner, { message: "Refreshing compliance data..." })) : timelineData ? (_jsxs("div", { className: "timeline", children: [timelineData.sources && (_jsxs("div", { style: {
                            marginBottom: 24,
                            padding: 12,
                            background: 'var(--panel-2)',
                            borderRadius: 8,
                            fontSize: 12
                        }, children: [_jsx("strong", { children: "Data Sources:" }), " ", timelineData.sources.join(', '), _jsx("br", {}), _jsx("strong", { children: "Last Updated:" }), " ", formatDate(timelineData.lastUpdated)] })), renderTimelineSection('B2G', groupedTimeline.B2G), renderTimelineSection('B2B', groupedTimeline.B2B), renderTimelineSection('B2C', groupedTimeline.B2C), renderTimelineSection('reporting', groupedTimeline.reporting), Object.values(groupedTimeline).every(events => events.length === 0) && (_jsxs("div", { className: "no-timeline", children: [_jsx("p", { children: "No detailed timeline information available for this country." }), _jsx("p", { children: "Click \"Refresh Data\" to check for updates." })] }))] })) : (_jsx("div", { className: "no-timeline", children: _jsx("p", { children: "Loading timeline data..." }) }))] }));
}
