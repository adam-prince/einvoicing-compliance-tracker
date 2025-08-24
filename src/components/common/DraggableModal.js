import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useEffect, useState, useCallback } from 'react';
import { focusManager, announcer } from '../../utils/accessibility';
export const DraggableModal = ({ isOpen, onClose, title, subtitle, children, size = 'medium', className = '', 'aria-describedby': ariaDescribedBy }) => {
    const modalRef = useRef(null);
    const headerRef = useRef(null);
    const backdropRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
    const [isInitialPosition, setIsInitialPosition] = useState(true);
    // Modal size configurations
    const sizeClasses = {
        small: { width: '400px', maxWidth: '90vw' },
        medium: { width: '600px', maxWidth: '90vw' },
        large: { width: '800px', maxWidth: '95vw' },
        xlarge: { width: '1200px', maxWidth: '95vw' }
    };
    // Center modal initially
    const centerModal = useCallback(() => {
        if (modalRef.current && isInitialPosition) {
            const modal = modalRef.current;
            const rect = modal.getBoundingClientRect();
            const centerX = (window.innerWidth - rect.width) / 2;
            const centerY = (window.innerHeight - rect.height) / 2;
            setModalPosition({
                x: Math.max(20, centerX),
                y: Math.max(20, centerY)
            });
            setIsInitialPosition(false);
        }
    }, [isInitialPosition]);
    // Handle drag start
    const handleDragStart = useCallback((e) => {
        if (e.target === headerRef.current || headerRef.current?.contains(e.target)) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - modalPosition.x,
                y: e.clientY - modalPosition.y
            });
            e.preventDefault();
        }
    }, [modalPosition]);
    // Handle drag move
    const handleDragMove = useCallback((e) => {
        if (!isDragging)
            return;
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        // Keep modal within viewport bounds
        const modal = modalRef.current;
        if (modal) {
            const rect = modal.getBoundingClientRect();
            const maxX = window.innerWidth - rect.width - 20;
            const maxY = window.innerHeight - rect.height - 20;
            setModalPosition({
                x: Math.min(Math.max(20, newX), maxX),
                y: Math.min(Math.max(20, newY), maxY)
            });
        }
    }, [isDragging, dragStart]);
    // Handle drag end
    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
    }, []);
    // Handle click outside to close
    const handleBackdropClick = useCallback((e) => {
        if (e.target === backdropRef.current) {
            onClose();
        }
    }, [onClose]);
    // Handle escape key
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape' && isOpen) {
            onClose();
        }
    }, [isOpen, onClose]);
    // Set up event listeners
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleDragMove);
            document.addEventListener('mouseup', handleDragEnd);
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'grabbing';
            return () => {
                document.removeEventListener('mousemove', handleDragMove);
                document.removeEventListener('mouseup', handleDragEnd);
                document.body.style.userSelect = '';
                document.body.style.cursor = '';
            };
        }
    }, [isDragging, handleDragMove, handleDragEnd]);
    // Set up keyboard listeners
    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, handleKeyDown]);
    // Focus management
    useEffect(() => {
        if (isOpen && modalRef.current) {
            // Center modal on first open
            centerModal();
            // Focus management
            const firstFocusable = modalRef.current.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (firstFocusable) {
                setTimeout(() => firstFocusable.focus(), 100);
            }
            else {
                modalRef.current.focus();
            }
            // Announce modal opening
            announcer.announce(`${title} dialog opened`, 'assertive');
            return () => {
                announcer.announce(`${title} dialog closed`, 'polite');
                focusManager.restoreFocus();
            };
        }
    }, [isOpen, title, centerModal]);
    // Reset position when modal reopens
    useEffect(() => {
        if (isOpen) {
            setIsInitialPosition(true);
        }
    }, [isOpen]);
    if (!isOpen)
        return null;
    const currentSize = sizeClasses[size];
    return (_jsx("div", { ref: backdropRef, className: "draggable-modal-backdrop", onClick: handleBackdropClick, role: "presentation", children: _jsxs("div", { ref: modalRef, className: `draggable-modal ${className}`, role: "dialog", "aria-modal": "true", "aria-labelledby": "modal-title", "aria-describedby": ariaDescribedBy, tabIndex: -1, style: {
                width: currentSize.width,
                maxWidth: currentSize.maxWidth,
                transform: `translate(${modalPosition.x}px, ${modalPosition.y}px)`,
                cursor: isDragging ? 'grabbing' : 'default'
            }, children: [_jsxs("div", { ref: headerRef, className: "draggable-modal-header", onMouseDown: handleDragStart, style: { cursor: isDragging ? 'grabbing' : 'grab' }, children: [_jsxs("div", { className: "modal-title-section", children: [_jsx("h2", { id: "modal-title", className: "modal-title", children: title }), subtitle && _jsx("p", { className: "modal-subtitle", children: subtitle })] }), _jsx("button", { className: "modal-close-button", onClick: onClose, "aria-label": "Close dialog", type: "button", children: _jsx("span", { "aria-hidden": "true", children: "\u00D7" }) })] }), _jsx("div", { className: "draggable-modal-content", children: children })] }) }));
};
