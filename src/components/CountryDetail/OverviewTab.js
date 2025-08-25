import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getFormatSpecifications, getLegislationDocuments } from '../../data/formatSpecifications';
import { useI18n } from '../../i18n';
import { EnhancedLink } from '../common/EnhancedLink';
export function OverviewTab({ country, linkStatuses, onSmartLink }) {
    const { t, formatDate } = useI18n();
    // Enhanced format rendering with corrected country-specific data
    const renderFormats = (formats) => {
        if (!formats || formats.length === 0) {
            return _jsx("span", { style: { color: 'var(--muted)', fontStyle: 'italic' }, children: t('formats_none') || 'No specific formats specified' });
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
            // Filter out incorrect formats based on country
            if (country.isoCode3 === 'ESP' && formatName.toLowerCase().includes('factur-x')) {
                // Skip Factur-X for Spain - it's incorrect
                return;
            }
            // Get specifications for this format
            const specifications = getFormatSpecifications(formatName);
            if (specifications.length > 0) {
                // Create buttons for each specification version
                specifications.forEach((spec, specIndex) => {
                    const buttonKey = `${index}-${specIndex}`;
                    const status = linkStatuses[spec.url] || 'unknown';
                    const isDead = status === 'not-found';
                    formatButtons.push(_jsxs("div", { className: `format-spec-button ${isDead ? 'button-amber' : ''}`, children: [_jsx("span", { className: `status-dot ${isDead ? 'dot-dead' : (status === 'ok' ? 'dot-ok' : 'dot-unknown')}`, "aria-hidden": "true" }), _jsxs("span", { className: "sr-only", children: ["Link status: ", isDead ? 'unavailable' : (status === 'ok' ? 'validated' : 'unknown')] }), _jsx("span", { className: "format-name", children: spec.name }), spec.version && _jsxs("span", { className: "format-version", children: ["v", spec.version] }), _jsx("span", { className: "format-authority", children: spec.authority }), _jsx(EnhancedLink, { url: spec.url, title: `${spec.name} ${spec.version ? 'v' + spec.version : ''} specification`, countryCode: country.isoCode3, linkType: "standard", className: "enhanced-link-in-button", style: { color: 'inherit', textDecoration: 'none' }, children: _jsx("span", { className: "external-link-icon", children: "\u2197" }) })] }, buttonKey));
                });
            }
            else {
                // No specifications found, create a non-clickable tag
                formatButtons.push(_jsxs("span", { className: "format-tag-no-spec", title: "No official specification available", children: [formatName, _jsx("span", { className: "no-spec-indicator", children: "?" })] }, index));
            }
        });
        return _jsx("div", { className: "format-buttons-container", children: formatButtons });
    };
    // Enhanced legislation rendering with better search
    const renderLegislation = (legislation) => {
        if (!legislation || !legislation.name) {
            return _jsx("span", { style: { color: 'var(--muted)', fontStyle: 'italic' }, children: "No legislation specified" });
        }
        const legislationName = legislation.name;
        const documents = getLegislationDocuments(legislationName);
        if (documents.length > 0) {
            return (_jsx("div", { className: "legislation-buttons-container", children: documents.map((doc, index) => {
                    const status = linkStatuses[doc.url] || 'unknown';
                    const isDead = status === 'not-found';
                    return (_jsxs("div", { className: `legislation-button ${isDead ? 'button-amber' : ''}`, title: `${isDead ? 'Unavailable link' : (status === 'ok' ? 'Validated link' : 'Status unknown')} — ${doc.name}`, children: [_jsx("span", { className: `status-dot ${isDead ? 'dot-dead' : (status === 'ok' ? 'dot-ok' : 'dot-unknown')}`, "aria-hidden": "true" }), _jsxs("span", { className: "sr-only", children: ["Link status: ", isDead ? 'unavailable' : (status === 'ok' ? 'validated' : 'unknown')] }), _jsx("span", { className: "legislation-name", children: doc.name }), doc.language && doc.language !== 'Multi-language' && (_jsx("span", { className: "legislation-language", children: doc.language })), doc.language === 'Multi-language' && (_jsx("span", { className: "legislation-language", children: "All Languages" })), _jsx("span", { className: "legislation-type", children: doc.type }), _jsx(EnhancedLink, { url: doc.url, title: doc.name, countryCode: country.isoCode3, linkType: "legislation", className: "enhanced-link-in-button", style: { color: 'inherit', textDecoration: 'none' }, children: _jsx("span", { className: "external-link-icon", children: "\u2197" }) })] }, index));
                }) }));
        }
        else {
            // No mapped documents found; fall back to specific links on the legislation object
            const candidateLinks = [];
            if (legislation.officialLink)
                candidateLinks.push({ url: legislation.officialLink, label: 'Official' });
            if (legislation.specificationLink)
                candidateLinks.push({ url: legislation.specificationLink, label: 'Specification' });
            if (legislation.url)
                candidateLinks.push({ url: legislation.url, label: 'Link' });
            if (legislation.link)
                candidateLinks.push({ url: legislation.link, label: 'Link' });
            if (candidateLinks.length > 0) {
                return (_jsx("div", { className: "legislation-buttons-container", children: candidateLinks.map((l, idx) => {
                        const status = linkStatuses[l.url] || 'unknown';
                        const isDead = status === 'not-found';
                        return (_jsxs("div", { className: `legislation-button ${isDead ? 'button-amber' : ''}`, title: `${isDead ? 'Unavailable link' : (status === 'ok' ? 'Validated link' : 'Status unknown')} — ${legislationName} (${l.label})`, children: [_jsx("span", { className: `status-dot ${isDead ? 'dot-dead' : (status === 'ok' ? 'dot-ok' : 'dot-unknown')}`, "aria-hidden": "true" }), _jsxs("span", { className: "sr-only", children: ["Link status: ", isDead ? 'unavailable' : (status === 'ok' ? 'validated' : 'unknown')] }), _jsx("span", { className: "legislation-name", children: legislationName }), _jsx("span", { className: "legislation-type", children: l.label }), _jsx(EnhancedLink, { url: l.url, title: `${legislationName} (${l.label})`, countryCode: country.isoCode3, linkType: "legislation", className: "enhanced-link-in-button", style: { color: 'inherit', textDecoration: 'none' }, children: _jsx("span", { className: "external-link-icon", children: "\u2197" }) })] }, idx));
                    }) }));
            }
            // As a last resort, offer a search link
            return (_jsxs("button", { onClick: () => onSmartLink(`https://www.google.com/search?q=${encodeURIComponent(legislationName + ' ' + country.name + ' e-invoicing')}`, legislationName, 'Search Results', country.isoCode3), className: "legislation-button", title: "Search for this legislation", children: [_jsx("span", { className: "legislation-name", children: legislationName }), _jsx("span", { className: "legislation-type", children: "Search" }), _jsx("span", { className: "external-link-icon", children: "\u2197" })] }));
        }
    };
    return (_jsxs("div", { id: "panel-overview", role: "tabpanel", "aria-labelledby": "tab-overview", children: [_jsx("h3", { children: t('tabs_overview') }), _jsxs("div", { style: { display: 'grid', gap: 16, marginBottom: 24 }, children: [_jsxs("div", { className: "card", children: [_jsx("h4", { style: { margin: '0 0 12px 0', color: 'var(--primary)' }, children: t('b2g_title') || 'Business-to-Government (B2G)' }), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsx("strong", { children: t('overview_status') }), _jsx("span", { style: { marginLeft: 8 }, children: _jsx("span", { className: `badge ${country.eInvoicing.b2g.status === 'mandated' ? 'green' :
                                                country.eInvoicing.b2g.status === 'planned' ? 'yellow' :
                                                    country.eInvoicing.b2g.status === 'permitted' ? 'yellow' : 'gray'}`, children: country.eInvoicing.b2g.status.charAt(0).toUpperCase() + country.eInvoicing.b2g.status.slice(1) }) })] }), country.eInvoicing.b2g.implementationDate && (_jsxs("div", { style: { marginBottom: 12 }, children: [_jsx("strong", { children: t('overview_impl_date') }), " ", formatDate(country.eInvoicing.b2g.implementationDate)] })), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsx("strong", { children: t('overview_supported_formats') }), _jsx("div", { style: { marginTop: 8 }, children: renderFormats(country.eInvoicing.b2g.formats) })] }), _jsxs("div", { children: [_jsx("strong", { children: t('overview_legislation') }), _jsx("div", { style: { marginTop: 8 }, children: renderLegislation(country.eInvoicing.b2g.legislation) })] })] }), _jsxs("div", { className: "card", children: [_jsx("h4", { style: { margin: '0 0 12px 0', color: 'var(--primary)' }, children: t('b2b_title') || 'Business-to-Business (B2B)' }), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsxs("strong", { children: [t('overview_status'), ":"] }), _jsx("span", { style: { marginLeft: 8 }, children: _jsx("span", { className: `badge ${country.eInvoicing.b2b.status === 'mandated' ? 'green' :
                                                country.eInvoicing.b2b.status === 'planned' ? 'yellow' :
                                                    country.eInvoicing.b2b.status === 'permitted' ? 'yellow' : 'gray'}`, children: country.eInvoicing.b2b.status.charAt(0).toUpperCase() + country.eInvoicing.b2b.status.slice(1) }) })] }), country.eInvoicing.b2b.implementationDate && (_jsxs("div", { style: { marginBottom: 12 }, children: [_jsxs("strong", { children: [t('overview_implementation_date'), ":"] }), " ", formatDate(country.eInvoicing.b2b.implementationDate)] })), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsxs("strong", { children: [t('overview_supported_formats'), ":"] }), _jsx("div", { style: { marginTop: 8 }, children: renderFormats(country.eInvoicing.b2b.formats) })] }), _jsxs("div", { children: [_jsxs("strong", { children: [t('overview_legislation'), ":"] }), _jsx("div", { style: { marginTop: 8 }, children: renderLegislation(country.eInvoicing.b2b.legislation) })] })] }), _jsxs("div", { className: "card", children: [_jsx("h4", { style: { margin: '0 0 12px 0', color: 'var(--primary)' }, children: t('b2c_title') || 'Business-to-Consumer (B2C)' }), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsxs("strong", { children: [t('overview_status'), ":"] }), _jsx("span", { style: { marginLeft: 8 }, children: _jsx("span", { className: `badge ${country.eInvoicing.b2c.status === 'mandated' ? 'green' :
                                                country.eInvoicing.b2c.status === 'planned' ? 'yellow' :
                                                    country.eInvoicing.b2c.status === 'permitted' ? 'yellow' : 'gray'}`, children: country.eInvoicing.b2c.status.charAt(0).toUpperCase() + country.eInvoicing.b2c.status.slice(1) }) })] }), country.eInvoicing.b2c.implementationDate && (_jsxs("div", { style: { marginBottom: 12 }, children: [_jsxs("strong", { children: [t('overview_implementation_date'), ":"] }), " ", formatDate(country.eInvoicing.b2c.implementationDate)] })), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsxs("strong", { children: [t('overview_supported_formats'), ":"] }), _jsx("div", { style: { marginTop: 8 }, children: renderFormats(country.eInvoicing.b2c.formats) })] }), _jsxs("div", { children: [_jsxs("strong", { children: [t('overview_legislation'), ":"] }), _jsx("div", { style: { marginTop: 8 }, children: renderLegislation(country.eInvoicing.b2c.legislation) })] })] })] }), _jsxs("div", { style: {
                    fontSize: 12,
                    color: 'var(--muted)',
                    padding: 12,
                    background: 'var(--panel-2)',
                    borderRadius: 8
                }, children: [_jsx("strong", { children: t('overview_last_updated') }), " ", formatDate(country.eInvoicing.lastUpdated)] })] }));
}
