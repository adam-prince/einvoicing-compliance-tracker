import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Button } from 'carbon-react';
import { customLinkService } from '../../services/customLinkService';
import { CustomLinkModal } from './CustomLinkModal';
export function EnhancedLink({ url: originalUrl, title, countryCode, linkType, lastUpdated, children, className, style, target = '_blank', rel = 'noopener noreferrer' }) {
    const [actualUrl, setActualUrl] = useState(originalUrl);
    const [hasCustomLink, setHasCustomLink] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        checkForCustomLink();
    }, [originalUrl, countryCode, linkType, lastUpdated]);
    const checkForCustomLink = async () => {
        setIsLoading(true);
        try {
            const bestUrl = await customLinkService.getBestUrl(countryCode, originalUrl, linkType, lastUpdated);
            const resolution = await customLinkService.resolveUrl(countryCode, originalUrl, linkType, lastUpdated);
            setActualUrl(bestUrl);
            setHasCustomLink(resolution.hasCustomLink);
        }
        catch (error) {
            console.error('Failed to check for custom link:', error);
            setActualUrl(originalUrl);
            setHasCustomLink(false);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleCustomLinkSuccess = (customUrl) => {
        setActualUrl(customUrl);
        setHasCustomLink(true);
    };
    const linkContent = children || title;
    return (_jsxs("div", { style: { display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }, children: [_jsxs("a", { href: actualUrl, title: hasCustomLink ? `Custom link: ${title}` : title, className: className, style: {
                    ...style,
                    position: 'relative',
                    textDecoration: hasCustomLink ? 'underline' : 'none',
                    color: hasCustomLink ? 'var(--primary)' : 'inherit',
                }, target: target, rel: rel, children: [linkContent, hasCustomLink && (_jsx("span", { style: {
                            marginLeft: '4px',
                            color: 'var(--green)',
                            verticalAlign: 'middle',
                            fontSize: '14px'
                        }, title: "Using custom link", children: "\u2713" }))] }), _jsx(Button, { variant: "tertiary", size: "small", onClick: () => setShowModal(true), style: {
                    minHeight: '20px',
                    padding: '2px 6px',
                    color: hasCustomLink ? 'var(--primary)' : 'var(--muted)',
                    fontSize: '12px'
                }, disabled: isLoading, title: hasCustomLink ? "Edit custom link" : "Provide better link", children: "\u270F\uFE0F" }), _jsx(CustomLinkModal, { isOpen: showModal, onClose: () => setShowModal(false), countryCode: countryCode, originalUrl: originalUrl, linkType: linkType, title: title, onSuccess: handleCustomLinkSuccess })] }));
}
