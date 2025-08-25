import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from 'carbon-react';
import { DraggableModal } from './DraggableModal';
import { customLinkService } from '../../services/customLinkService';
export function CustomLinkModal({ isOpen, onClose, countryCode, originalUrl, linkType, title: originalTitle, onSuccess }) {
    const [customUrl, setCustomUrl] = useState('');
    const [title, setTitle] = useState(originalTitle);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const handleSubmit = async () => {
        if (!customUrl.trim()) {
            setError('Please provide a custom URL');
            return;
        }
        if (!title.trim()) {
            setError('Please provide a title');
            return;
        }
        // Basic URL validation
        try {
            new URL(customUrl);
        }
        catch {
            setError('Please provide a valid URL');
            return;
        }
        setIsSubmitting(true);
        setError('');
        try {
            const request = {
                countryCode,
                linkType,
                originalUrl,
                customUrl: customUrl.trim(),
                title: title.trim(),
                notes: notes.trim() || undefined,
            };
            const result = await customLinkService.createOrUpdateLink(request);
            if (result) {
                onSuccess(customUrl);
                handleClose();
            }
            else {
                setError('Failed to save custom link. Please try again.');
            }
        }
        catch (err) {
            setError('An error occurred while saving the custom link.');
            console.error('Custom link save error:', err);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const handleClose = () => {
        setCustomUrl('');
        setTitle(originalTitle);
        setNotes('');
        setError('');
        onClose();
    };
    const linkTypeOptions = [
        { id: 'legislation', text: 'Legislation' },
        { id: 'specification', text: 'Specification' },
        { id: 'news', text: 'News' },
        { id: 'standard', text: 'Standard' },
    ];
    return (_jsxs(DraggableModal, { isOpen: isOpen, onClose: handleClose, title: "Provide Better Link", subtitle: `${countryCode} - Link Override`, size: "medium", children: [_jsxs("div", { style: { marginBottom: '16px' }, children: [_jsx("p", { style: { margin: '0 0 16px 0', color: 'var(--text)', fontSize: '14px' }, children: "The current link may be incorrect or outdated. You can provide a better link that will be stored and used instead." }), _jsxs("div", { style: { background: 'var(--panel-2)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }, children: [_jsx("div", { style: { fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }, children: "Original URL:" }), _jsx("div", { style: { fontSize: '13px', color: 'var(--text)', wordBreak: 'break-all' }, children: originalUrl })] })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '16px' }, children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "link-type", style: { display: 'block', marginBottom: '4px', fontWeight: '500' }, children: "Link Type" }), _jsx("select", { id: "link-type", value: linkType, disabled: true, style: {
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid var(--border)',
                                    borderRadius: '4px',
                                    background: 'var(--panel-2)',
                                    color: 'var(--muted)'
                                }, children: linkTypeOptions.map(opt => (_jsx("option", { value: opt.id, children: opt.text }, opt.id))) }), _jsx("small", { style: { color: 'var(--muted)', fontSize: '12px' }, children: "The type of content this link points to" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "title", style: { display: 'block', marginBottom: '4px', fontWeight: '500' }, children: "Title *" }), _jsx("input", { id: "title", type: "text", value: title, onChange: (e) => setTitle(e.target.value), placeholder: "Enter a descriptive title for this link", required: true, style: {
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid var(--border)',
                                    borderRadius: '4px',
                                    background: 'var(--panel)',
                                    color: 'var(--text)'
                                } }), _jsx("small", { style: { color: 'var(--muted)', fontSize: '12px' }, children: "A clear title describing what this link contains" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "custom-url", style: { display: 'block', marginBottom: '4px', fontWeight: '500' }, children: "Better URL *" }), _jsx("input", { id: "custom-url", type: "url", value: customUrl, onChange: (e) => setCustomUrl(e.target.value), placeholder: "https://example.com/better-link", required: true, style: {
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid var(--border)',
                                    borderRadius: '4px',
                                    background: 'var(--panel)',
                                    color: 'var(--text)'
                                } }), _jsx("small", { style: { color: 'var(--muted)', fontSize: '12px' }, children: "The improved URL that should be used instead" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "notes", style: { display: 'block', marginBottom: '4px', fontWeight: '500' }, children: "Notes (Optional)" }), _jsx("textarea", { id: "notes", value: notes, onChange: (e) => setNotes(e.target.value), placeholder: "Additional notes about this link override...", rows: 3, style: {
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid var(--border)',
                                    borderRadius: '4px',
                                    background: 'var(--panel)',
                                    color: 'var(--text)',
                                    fontFamily: 'inherit',
                                    resize: 'vertical'
                                } }), _jsx("small", { style: { color: 'var(--muted)', fontSize: '12px' }, children: "Optional notes explaining why this link is better" })] }), error && (_jsx("div", { style: {
                            color: 'var(--red)',
                            fontSize: '14px',
                            background: 'rgba(220, 38, 38, 0.1)',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            border: '1px solid rgba(220, 38, 38, 0.2)'
                        }, children: error })), _jsxs("div", { style: {
                            fontSize: '12px',
                            color: 'var(--muted)',
                            background: 'var(--panel-2)',
                            padding: '8px 12px',
                            borderRadius: '4px'
                        }, children: [_jsx("strong", { children: "Note:" }), " Your custom link will be stored securely and used instead of the original URL. It will persist across data refreshes unless a newer official link is found."] }), _jsxs("div", { style: {
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '12px',
                            marginTop: '24px',
                            paddingTop: '16px',
                            borderTop: '1px solid var(--border)'
                        }, children: [_jsx(Button, { variant: "secondary", size: "medium", onClick: handleClose, disabled: isSubmitting, children: "Cancel" }), _jsx(Button, { variant: "primary", size: "medium", onClick: handleSubmit, disabled: isSubmitting, children: isSubmitting ? 'Saving...' : 'Save Custom Link' })] })] })] }));
}
