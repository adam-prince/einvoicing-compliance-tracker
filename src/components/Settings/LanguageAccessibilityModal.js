import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Button } from 'carbon-react';
import { useStore } from '../../store/useStore';
import { useI18n } from '../../i18n';
import { announcer } from '../../utils/accessibility';
import { DraggableModal } from '../common/DraggableModal';
export const LanguageAccessibilityModal = ({ onClose }) => {
    const { t } = useI18n();
    const { language, setLanguage } = useStore();
    const [highContrastMode, setHighContrastMode] = useState(false);
    // Load high contrast setting from localStorage
    useEffect(() => {
        const savedHighContrast = localStorage.getItem('high-contrast-mode') === 'true';
        setHighContrastMode(savedHighContrast);
        if (savedHighContrast) {
            document.body.classList.add('high-contrast');
        }
    }, []);
    // Handle high contrast mode toggle
    const handleHighContrastToggle = (enabled) => {
        setHighContrastMode(enabled);
        localStorage.setItem('high-contrast-mode', enabled.toString());
        if (enabled) {
            document.body.classList.add('high-contrast');
            announcer.announce('High contrast mode enabled', 'polite');
        }
        else {
            document.body.classList.remove('high-contrast');
            announcer.announce('High contrast mode disabled', 'polite');
        }
    };
    // Handle language change
    const handleLanguageChange = (newLanguage) => {
        setLanguage(newLanguage);
        announcer.announce(`Language changed to ${getLanguageDisplayName(newLanguage)}`, 'polite');
    };
    // Get display name for language
    const getLanguageDisplayName = (lang) => {
        const names = {
            'en-US': 'English (US)',
            'en-UK': 'English (UK)',
            'fr': 'Français',
            'de': 'Deutsch',
            'es': 'Español'
        };
        return names[lang] || lang;
    };
    return (_jsxs(DraggableModal, { isOpen: true, onClose: onClose, title: "Language & Accessibility", subtitle: "Configure display language and accessibility features", size: "medium", "aria-describedby": "language-accessibility-description", children: [_jsx("div", { id: "language-accessibility-description", className: "sr-only", children: "Settings dialog for configuring display language and accessibility options including high contrast mode." }), _jsxs("div", { className: "language-accessibility-content", children: [_jsxs("div", { className: "settings-section", children: [_jsx("h3", { children: "Interface Language" }), _jsx("p", { children: "Choose your preferred display language for the interface." }), _jsxs("div", { className: "language-selection", children: [_jsx("label", { htmlFor: "language-preference", children: "Language:" }), _jsxs("select", { id: "language-preference", value: language, onChange: (e) => handleLanguageChange(e.target.value), "aria-describedby": "language-help", className: "language-select", children: [_jsx("option", { value: "en-US", children: "English (US)" }), _jsx("option", { value: "en-UK", children: "English (UK)" }), _jsx("option", { value: "fr", children: "Fran\u00E7ais" }), _jsx("option", { value: "de", children: "Deutsch" }), _jsx("option", { value: "es", children: "Espa\u00F1ol" })] }), _jsx("div", { id: "language-help", className: "help-text", children: "Select your preferred language for the user interface." })] })] }), _jsxs("div", { className: "settings-section", children: [_jsx("h3", { children: "Accessibility Features" }), _jsx("p", { children: "Configure accessibility options to improve your experience." }), _jsxs("div", { className: "accessibility-controls", children: [_jsxs("div", { className: "accessibility-option", children: [_jsxs("label", { className: "checkbox-label", children: [_jsx("input", { type: "checkbox", checked: highContrastMode, onChange: (e) => handleHighContrastToggle(e.target.checked), "aria-describedby": "contrast-help", className: "accessibility-checkbox" }), _jsx("span", { className: "checkbox-text", children: "Enable High Contrast Mode" })] }), _jsx("div", { id: "contrast-help", className: "help-text", children: "Increases color contrast for better visibility and accessibility compliance." })] }), _jsxs("div", { className: "accessibility-info", children: [_jsx("h4", { children: "Built-in Accessibility Features" }), _jsxs("ul", { children: [_jsx("li", { children: "Full keyboard navigation support" }), _jsx("li", { children: "Screen reader compatibility" }), _jsx("li", { children: "WCAG 2.1 Level AA compliance" }), _jsx("li", { children: "Reduced motion support (respects system preferences)" }), _jsx("li", { children: "Focus indicators for all interactive elements" })] })] })] })] })] }), _jsx("div", { className: "modal-actions", children: _jsx(Button, { onClick: onClose, size: "medium", variant: "primary", children: "Done" }) })] }));
};
