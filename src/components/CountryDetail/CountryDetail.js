import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { ComplianceDataService } from '../../services/complianceDataService';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { getFormatSpecifications, getLegislationDocuments } from '../../data/formatSpecifications';
export function CountryDetail({ country, onClose }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [timelineData, setTimelineData] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshError, setRefreshError] = useState('');
    const [progress, setProgress] = useState({ percentage: 0, message: '', stage: '' });
    const complianceService = ComplianceDataService.getInstance();
    // Load timeline data on mount
    useEffect(() => {
        const loadTimeline = () => {
            let data = complianceService.getComplianceTimeline(country.isoCode3);
            // If no specific data available, generate sample timeline
            if (!data) {
                data = complianceService.generateSampleTimeline(country.name, country.isoCode3);
            }
            setTimelineData(data);
        };
        loadTimeline();
    }, [country.isoCode3, country.name]);
    // Refresh timeline data with progress updates
    const handleRefreshTimeline = async () => {
        setIsRefreshing(true);
        setRefreshError('');
        setProgress({ percentage: 0, message: 'Starting refresh...', stage: 'init' });
        try {
            const refreshedData = await complianceService.refreshComplianceData(country.isoCode3, (progressUpdate) => {
                setProgress(progressUpdate);
            });
            if (refreshedData.length > 0) {
                setTimelineData(refreshedData[0]);
            }
            else {
                // Generate updated sample data
                const sampleData = complianceService.generateSampleTimeline(country.name, country.isoCode3);
                setTimelineData(sampleData);
            }
        }
        catch (error) {
            setRefreshError('Failed to refresh compliance data. Please try again.');
            console.error('Refresh error:', error);
        }
        finally {
            setIsRefreshing(false);
            // Clear progress after a short delay to show completion
            setTimeout(() => {
                setProgress({ percentage: 0, message: '', stage: '' });
            }, 1000);
        }
    };
    // Group timeline events by category
    const groupedTimeline = React.useMemo(() => {
        if (!timelineData)
            return {};
        const groups = {
            'B2G': [],
            'B2B': [],
            'B2C': [],
            'reporting': []
        };
        timelineData.timeline.forEach((event) => {
            groups[event.category].push(event);
        });
        // Sort events by date within each group
        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        });
        return groups;
    }, [timelineData]);
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        }
        catch {
            return dateString;
        }
    };
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
        return (_jsxs("div", { className: "timeline-section", children: [_jsx("h4", { children: title === 'reporting' ? 'Periodic E-Reporting' : `Business-to-${title.slice(2)} (${title})` }), events.map((event, index) => (_jsxs("div", { className: "timeline-item", children: [_jsx("div", { className: "timeline-date", children: formatDate(event.date) }), _jsxs("div", { className: "timeline-content", children: [_jsxs("div", { className: "timeline-description", children: [event.description, _jsx("span", { className: getStatusBadgeClass(event.status), children: event.status.charAt(0).toUpperCase() + event.status.slice(1) })] }), event.threshold && (_jsxs("div", { className: "timeline-threshold", children: ["Threshold: ", event.threshold] }))] })] }, index)))] }, title));
    };
    // Enhanced format rendering with clickable specification buttons
    const renderFormats = (formats) => {
        if (!formats || formats.length === 0) {
            return _jsx("span", { style: { color: 'var(--muted)', fontStyle: 'italic' }, children: "No specific formats specified" });
        }
        const formatButtons = [];
        formats.forEach((format, index) => {
            let formatName = '';
            if (typeof format === 'string') {
                formatName = format;
            }
            else if (typeof format === 'object' && format !== null) {
                formatName = format.name || format.format || 'Unknown Format';
            }
            else {
                formatName = 'Unknown Format';
            }
            // Get specifications for this format
            const specifications = getFormatSpecifications(formatName);
            if (specifications.length > 0) {
                // Create buttons for each specification version
                specifications.forEach((spec, specIndex) => {
                    const buttonKey = `${index}-${specIndex}`;
                    formatButtons.push(_jsxs("button", { onClick: () => window.open(spec.url, '_blank', 'noopener,noreferrer'), className: "format-spec-button", title: `${spec.description || spec.name} - Click to view official specification`, children: [_jsx("span", { className: "format-name", children: spec.name }), spec.version && _jsxs("span", { className: "format-version", children: ["v", spec.version] }), _jsx("span", { className: "format-authority", children: spec.authority }), _jsx("span", { className: "external-link-icon", children: "\u2197" })] }, buttonKey));
                });
            }
            else {
                // No specifications found, create a non-clickable tag
                formatButtons.push(_jsxs("span", { className: "format-tag-no-spec", title: "No official specification available", children: [formatName, _jsx("span", { className: "no-spec-indicator", children: "?" })] }, index));
            }
        });
        return (_jsx("div", { className: "format-buttons-container", children: formatButtons }));
    };
    // Enhanced legislation rendering with clickable document buttons
    const renderLegislation = (legislation) => {
        if (!legislation || !legislation.name) {
            return _jsx("span", { style: { color: 'var(--muted)', fontStyle: 'italic' }, children: "No legislation specified" });
        }
        const legislationName = legislation.name;
        const documents = getLegislationDocuments(legislationName);
        if (documents.length > 0) {
            return (_jsx("div", { className: "legislation-buttons-container", children: documents.map((doc, index) => (_jsxs("button", { onClick: () => window.open(doc.url, '_blank', 'noopener,noreferrer'), className: "legislation-button", title: `${doc.name} - Click to view official document`, children: [_jsx("span", { className: "legislation-name", children: doc.name }), doc.language && doc.language !== 'Multi-language' && (_jsx("span", { className: "legislation-language", children: doc.language })), doc.language === 'Multi-language' && (_jsx("span", { className: "legislation-language", children: "All Languages" })), _jsx("span", { className: "legislation-type", children: doc.type }), _jsx("span", { className: "external-link-icon", children: "\u2197" })] }, index))) }));
        }
        else {
            // No documents found, show the original legislation name
            if (legislation.url || legislation.link) {
                return (_jsxs("button", { onClick: () => window.open(legislation.url || legislation.link, '_blank', 'noopener,noreferrer'), className: "legislation-button", title: "Click to view legislation", children: [_jsx("span", { className: "legislation-name", children: legislationName }), _jsx("span", { className: "external-link-icon", children: "\u2197" })] }));
            }
            else {
                return (_jsxs("span", { className: "legislation-tag-no-link", title: "No official document link available", children: [legislationName, _jsx("span", { className: "no-link-indicator", children: "?" })] }));
            }
        }
    };
    return (_jsx("div", { className: "modal-backdrop", onClick: onClose, children: _jsxs("div", { className: "modal", onClick: (e) => e.stopPropagation(), children: [_jsxs("header", { className: "modal-header-sticky", children: [_jsxs("div", { children: [_jsx("h2", { style: { margin: 0 }, children: country.name }), _jsxs("p", { style: { margin: '4px 0 0 0', color: 'var(--muted)', fontSize: 14 }, children: [country.continent, " \u2022 ", country.isoCode3] })] }), _jsx("button", { onClick: onClose, className: "modal-close-button", "aria-label": `Close details for ${country.name}`, children: "\u2715" })] }), _jsxs("div", { className: "tabs tabs-sticky", children: [_jsx("div", { className: `tab ${activeTab === 'overview' ? 'active' : ''}`, onClick: () => setActiveTab('overview'), role: "tab", tabIndex: 0, onKeyDown: (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setActiveTab('overview');
                                }
                            }, children: "Overview" }), _jsx("div", { className: `tab ${activeTab === 'timeline' ? 'active' : ''}`, onClick: () => setActiveTab('timeline'), role: "tab", tabIndex: 0, onKeyDown: (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setActiveTab('timeline');
                                }
                            }, children: "Implementation Timeline" })] }), isRefreshing && (_jsxs("div", { className: "progress-container", children: [_jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-fill", style: { width: `${progress.percentage}%` } }) }), _jsxs("div", { className: "progress-text", children: [_jsxs("span", { className: "progress-percentage", children: [progress.percentage, "%"] }), _jsx("span", { className: "progress-message", children: progress.message })] })] })), _jsxs("div", { className: "modal-content", children: [activeTab === 'overview' && (_jsxs("div", { children: [_jsx("h3", { children: "Current E-Invoicing Status" }), _jsxs("div", { style: { display: 'grid', gap: 16, marginBottom: 24 }, children: [_jsxs("div", { className: "card", children: [_jsx("h4", { style: { margin: '0 0 12px 0', color: 'var(--primary)' }, children: "Business-to-Government (B2G)" }), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsx("strong", { children: "Status:" }), _jsx("span", { style: { marginLeft: 8 }, children: _jsx("span", { className: `badge ${country.eInvoicing.b2g.status === 'mandated' ? 'green' :
                                                                    country.eInvoicing.b2g.status === 'planned' ? 'yellow' :
                                                                        country.eInvoicing.b2g.status === 'permitted' ? 'yellow' : 'gray'}`, children: country.eInvoicing.b2g.status.charAt(0).toUpperCase() + country.eInvoicing.b2g.status.slice(1) }) })] }), country.eInvoicing.b2g.implementationDate && (_jsxs("div", { style: { marginBottom: 12 }, children: [_jsx("strong", { children: "Implementation Date:" }), " ", formatDate(country.eInvoicing.b2g.implementationDate)] })), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsx("strong", { children: "Supported Formats:" }), _jsx("div", { style: { marginTop: 8 }, children: renderFormats(country.eInvoicing.b2g.formats) })] }), _jsxs("div", { children: [_jsx("strong", { children: "Legislation:" }), _jsx("div", { style: { marginTop: 8 }, children: renderLegislation(country.eInvoicing.b2g.legislation) })] })] }), _jsxs("div", { className: "card", children: [_jsx("h4", { style: { margin: '0 0 12px 0', color: 'var(--primary)' }, children: "Business-to-Business (B2B)" }), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsx("strong", { children: "Status:" }), _jsx("span", { style: { marginLeft: 8 }, children: _jsx("span", { className: `badge ${country.eInvoicing.b2b.status === 'mandated' ? 'green' :
                                                                    country.eInvoicing.b2b.status === 'planned' ? 'yellow' :
                                                                        country.eInvoicing.b2b.status === 'permitted' ? 'yellow' : 'gray'}`, children: country.eInvoicing.b2b.status.charAt(0).toUpperCase() + country.eInvoicing.b2b.status.slice(1) }) })] }), country.eInvoicing.b2b.implementationDate && (_jsxs("div", { style: { marginBottom: 12 }, children: [_jsx("strong", { children: "Implementation Date:" }), " ", formatDate(country.eInvoicing.b2b.implementationDate)] })), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsx("strong", { children: "Supported Formats:" }), _jsx("div", { style: { marginTop: 8 }, children: renderFormats(country.eInvoicing.b2b.formats) })] }), _jsxs("div", { children: [_jsx("strong", { children: "Legislation:" }), _jsx("div", { style: { marginTop: 8 }, children: renderLegislation(country.eInvoicing.b2b.legislation) })] })] }), _jsxs("div", { className: "card", children: [_jsx("h4", { style: { margin: '0 0 12px 0', color: 'var(--primary)' }, children: "Business-to-Consumer (B2C)" }), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsx("strong", { children: "Status:" }), _jsx("span", { style: { marginLeft: 8 }, children: _jsx("span", { className: `badge ${country.eInvoicing.b2c.status === 'mandated' ? 'green' :
                                                                    country.eInvoicing.b2c.status === 'planned' ? 'yellow' :
                                                                        country.eInvoicing.b2c.status === 'permitted' ? 'yellow' : 'gray'}`, children: country.eInvoicing.b2c.status.charAt(0).toUpperCase() + country.eInvoicing.b2c.status.slice(1) }) })] }), country.eInvoicing.b2c.implementationDate && (_jsxs("div", { style: { marginBottom: 12 }, children: [_jsx("strong", { children: "Implementation Date:" }), " ", formatDate(country.eInvoicing.b2c.implementationDate)] })), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsx("strong", { children: "Supported Formats:" }), _jsx("div", { style: { marginTop: 8 }, children: renderFormats(country.eInvoicing.b2c.formats) })] }), _jsxs("div", { children: [_jsx("strong", { children: "Legislation:" }), _jsx("div", { style: { marginTop: 8 }, children: renderLegislation(country.eInvoicing.b2c.legislation) })] })] })] }), _jsxs("div", { style: { fontSize: 12, color: 'var(--muted)', padding: 12, background: 'var(--panel-2)', borderRadius: 8 }, children: [_jsx("strong", { children: "Data Last Updated:" }), " ", formatDate(country.eInvoicing.lastUpdated)] })] })), activeTab === 'timeline' && (_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, children: [_jsx("h3", { style: { margin: 0 }, children: "Implementation Timeline" }), _jsx("button", { onClick: handleRefreshTimeline, disabled: isRefreshing, className: "refresh-button", "aria-label": "Refresh compliance data", children: isRefreshing ? 'Refreshing...' : 'Refresh Data' })] }), refreshError && (_jsx("div", { style: {
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
                                            }, children: [_jsx("strong", { children: "Data Sources:" }), " ", timelineData.sources.join(', '), _jsx("br", {}), _jsx("strong", { children: "Last Updated:" }), " ", formatDate(timelineData.lastUpdated)] })), renderTimelineSection('B2G', groupedTimeline.B2G), renderTimelineSection('B2B', groupedTimeline.B2B), renderTimelineSection('B2C', groupedTimeline.B2C), renderTimelineSection('reporting', groupedTimeline.reporting), Object.values(groupedTimeline).every(events => events.length === 0) && (_jsxs("div", { className: "no-timeline", children: [_jsx("p", { children: "No detailed timeline information available for this country." }), _jsx("p", { children: "Click \"Refresh Data\" to check for updates." })] }))] })) : (_jsx("div", { className: "no-timeline", children: _jsx("p", { children: "Loading timeline data..." }) }))] }))] })] }) }));
}
