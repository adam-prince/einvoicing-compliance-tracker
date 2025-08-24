/**
 * Accessibility utilities for enhancing WCAG 2.2 Level AA compliance
 */
// Focus management utilities
export class FocusManager {
    constructor() {
        Object.defineProperty(this, "focusHistory", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
    }
    /**
     * Pushes current focus to history and sets focus to new element
     */
    setFocus(element, options) {
        if (!element)
            return;
        const activeElement = document.activeElement;
        if (activeElement && activeElement !== document.body) {
            this.focusHistory.push(activeElement);
        }
        element.focus(options);
    }
    /**
     * Restores focus to the previous element in history
     */
    restoreFocus() {
        const previousElement = this.focusHistory.pop();
        if (previousElement && document.contains(previousElement)) {
            previousElement.focus();
        }
    }
    /**
     * Clears focus history
     */
    clearHistory() {
        this.focusHistory = [];
    }
    /**
     * Traps focus within a container element
     */
    trapFocus(container) {
        const focusableElements = this.getFocusableElements(container);
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const handleKeyDown = (e) => {
            if (e.key !== 'Tab')
                return;
            if (e.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            }
            else {
                // Tab
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };
        container.addEventListener('keydown', handleKeyDown);
        // Return cleanup function
        return () => {
            container.removeEventListener('keydown', handleKeyDown);
        };
    }
    /**
     * Gets all focusable elements within a container
     */
    getFocusableElements(container) {
        const focusableSelectors = [
            'button:not([disabled])',
            '[href]',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
        ];
        return Array.from(container.querySelectorAll(focusableSelectors.join(', ')));
    }
}
export const focusManager = new FocusManager();
/**
 * Keyboard navigation utilities
 */
export const KeyboardNavigation = {
    /**
     * Handles arrow key navigation for a list
     */
    handleArrowNavigation(event, items, currentIndex, onSelectionChange, options = {}) {
        const { wrap = true, orientation = 'vertical' } = options;
        let newIndex = currentIndex;
        switch (event.key) {
            case 'ArrowDown':
                if (orientation === 'vertical' || orientation === 'both') {
                    newIndex = wrap && currentIndex === items.length - 1 ? 0 : Math.min(currentIndex + 1, items.length - 1);
                    event.preventDefault();
                }
                break;
            case 'ArrowUp':
                if (orientation === 'vertical' || orientation === 'both') {
                    newIndex = wrap && currentIndex === 0 ? items.length - 1 : Math.max(currentIndex - 1, 0);
                    event.preventDefault();
                }
                break;
            case 'ArrowRight':
                if (orientation === 'horizontal' || orientation === 'both') {
                    newIndex = wrap && currentIndex === items.length - 1 ? 0 : Math.min(currentIndex + 1, items.length - 1);
                    event.preventDefault();
                }
                break;
            case 'ArrowLeft':
                if (orientation === 'horizontal' || orientation === 'both') {
                    newIndex = wrap && currentIndex === 0 ? items.length - 1 : Math.max(currentIndex - 1, 0);
                    event.preventDefault();
                }
                break;
            case 'Home':
                newIndex = 0;
                event.preventDefault();
                break;
            case 'End':
                newIndex = items.length - 1;
                event.preventDefault();
                break;
            default:
                return false;
        }
        if (newIndex !== currentIndex) {
            onSelectionChange(newIndex);
            return true;
        }
        return false;
    },
    /**
     * Creates a roving tabindex handler for better keyboard navigation
     */
    createRovingTabindex(container, itemSelector) {
        let currentIndex = 0;
        const updateTabindices = () => {
            const items = Array.from(container.querySelectorAll(itemSelector));
            items.forEach((item, index) => {
                item.tabIndex = index === currentIndex ? 0 : -1;
            });
        };
        const handleKeyDown = (event) => {
            const items = Array.from(container.querySelectorAll(itemSelector));
            this.handleArrowNavigation(event, items, currentIndex, (newIndex) => {
                currentIndex = newIndex;
                updateTabindices();
                items[newIndex]?.focus();
            });
        };
        const handleFocus = (event) => {
            const target = event.target;
            const items = Array.from(container.querySelectorAll(itemSelector));
            const index = items.indexOf(target);
            if (index !== -1) {
                currentIndex = index;
                updateTabindices();
            }
        };
        container.addEventListener('keydown', handleKeyDown);
        container.addEventListener('focus', handleFocus, true);
        // Initialize tabindices
        updateTabindices();
        return () => {
            container.removeEventListener('keydown', handleKeyDown);
            container.removeEventListener('focus', handleFocus, true);
        };
    }
};
/**
 * Screen reader announcements
 */
export class ScreenReaderAnnouncer {
    constructor() {
        Object.defineProperty(this, "liveRegion", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "politeRegion", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        this.createLiveRegions();
    }
    createLiveRegions() {
        // Assertive live region for urgent announcements
        this.liveRegion = document.createElement('div');
        this.liveRegion.setAttribute('aria-live', 'assertive');
        this.liveRegion.setAttribute('aria-atomic', 'true');
        this.liveRegion.setAttribute('class', 'sr-only');
        this.liveRegion.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;';
        document.body.appendChild(this.liveRegion);
        // Polite live region for non-urgent announcements
        this.politeRegion = document.createElement('div');
        this.politeRegion.setAttribute('aria-live', 'polite');
        this.politeRegion.setAttribute('aria-atomic', 'true');
        this.politeRegion.setAttribute('class', 'sr-only');
        this.politeRegion.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;';
        document.body.appendChild(this.politeRegion);
    }
    /**
     * Announces a message to screen readers (assertive)
     */
    announce(message, priority = 'polite') {
        const region = priority === 'assertive' ? this.liveRegion : this.politeRegion;
        if (region) {
            region.textContent = message;
            // Clear the message after a short delay to allow for repeated announcements
            setTimeout(() => {
                if (region)
                    region.textContent = '';
            }, 1000);
        }
    }
    /**
     * Cleanup live regions
     */
    destroy() {
        if (this.liveRegion) {
            document.body.removeChild(this.liveRegion);
            this.liveRegion = null;
        }
        if (this.politeRegion) {
            document.body.removeChild(this.politeRegion);
            this.politeRegion = null;
        }
    }
}
export const announcer = new ScreenReaderAnnouncer();
/**
 * ARIA utilities
 */
export const AriaUtils = {
    /**
     * Sets up proper ARIA attributes for a modal dialog
     */
    setupModalAria(modal, triggerElement = null) {
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        // Set focus to modal or first focusable element
        const focusable = focusManager.getFocusableElements(modal);
        if (focusable.length > 0) {
            focusable[0].focus();
        }
        else {
            modal.focus();
        }
        // Setup focus trap
        const cleanup = focusManager.trapFocus(modal);
        // Store cleanup function on modal for later use
        modal.__focusCleanup = cleanup;
    },
    /**
     * Cleans up modal ARIA and focus management
     */
    cleanupModalAria(modal) {
        const cleanup = modal.__focusCleanup;
        if (cleanup) {
            cleanup();
            delete modal.__focusCleanup;
        }
        focusManager.restoreFocus();
    },
    /**
     * Sets up ARIA attributes for expandable content
     */
    setupExpandable(trigger, content, isExpanded = false) {
        const contentId = content.id || `expandable-${Date.now()}`;
        content.id = contentId;
        trigger.setAttribute('aria-expanded', isExpanded.toString());
        trigger.setAttribute('aria-controls', contentId);
        if (!isExpanded) {
            content.setAttribute('aria-hidden', 'true');
        }
        else {
            content.removeAttribute('aria-hidden');
        }
    },
    /**
     * Updates expandable state
     */
    updateExpandable(trigger, content, isExpanded) {
        trigger.setAttribute('aria-expanded', isExpanded.toString());
        if (isExpanded) {
            content.removeAttribute('aria-hidden');
            announcer.announce(`${trigger.textContent || 'Section'} expanded`, 'polite');
        }
        else {
            content.setAttribute('aria-hidden', 'true');
            announcer.announce(`${trigger.textContent || 'Section'} collapsed`, 'polite');
        }
    },
    /**
     * Sets up ARIA attributes for a data table
     */
    setupTableAria(table, caption) {
        table.setAttribute('role', 'table');
        if (caption) {
            let captionElement = table.querySelector('caption');
            if (!captionElement) {
                captionElement = document.createElement('caption');
                table.insertBefore(captionElement, table.firstChild);
            }
            captionElement.textContent = caption;
        }
        // Setup row and column headers
        const headers = table.querySelectorAll('th');
        headers.forEach(header => {
            if (!header.getAttribute('scope')) {
                const parent = header.parentElement;
                if (parent?.parentElement?.tagName === 'THEAD') {
                    header.setAttribute('scope', 'col');
                }
                else {
                    header.setAttribute('scope', 'row');
                }
            }
        });
    }
};
/**
 * High contrast and reduced motion utilities
 */
export const AccessibilityPreferences = {
    /**
     * Checks if user prefers reduced motion
     */
    prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },
    /**
     * Checks if user prefers high contrast
     */
    prefersHighContrast() {
        return window.matchMedia('(prefers-contrast: high)').matches;
    },
    /**
     * Applies accessibility-friendly styles based on user preferences
     */
    applyPreferences(element) {
        if (this.prefersReducedMotion()) {
            element.style.transition = 'none';
            element.style.animation = 'none';
        }
        if (this.prefersHighContrast()) {
            element.classList.add('high-contrast');
        }
    },
    /**
     * Checks if user prefers dark mode
     */
    prefersDarkMode() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
};
/**
 * Skip links utility
 */
export const SkipLinks = {
    /**
     * Creates a skip link for keyboard navigation
     */
    createSkipLink(targetId, text = 'Skip to main content') {
        const skipLink = document.createElement('a');
        skipLink.href = `#${targetId}`;
        skipLink.textContent = text;
        skipLink.className = 'skip-link';
        // Style the skip link to be visible only when focused
        skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: var(--color-primary, #000);
      color: var(--color-white, #fff);
      padding: 8px;
      text-decoration: none;
      z-index: 9999;
      border-radius: 4px;
      transition: top 0.2s ease-in-out;
    `;
        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
        });
        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });
        return skipLink;
    }
};
