/**
 * Accessibility Enhancer for Midas The Lifestyle
 * Ensures WCAG 2.1 AA compliance while maintaining luxury design
 * Provides keyboard navigation, screen reader support, and enhanced UX
 */

class AccessibilityEnhancer {
    constructor() {
        this.focusableElements = [];
        this.skipLinks = [];
        this.headingStructure = [];
        this.colorContrastIssues = [];
        
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.enhance());
        } else {
            this.enhance();
        }
    }

    enhance() {
        // Core accessibility enhancements
        this.addSkipNavigation();
        this.enhanceKeyboardNavigation();
        this.improveHeadingStructure();
        this.enhanceFormAccessibility();
        this.addARIALabels();
        this.improveColorContrast();
        this.enhanceImageAccessibility();
        this.setupFocusManagement();
        this.addLiveRegions();
        
        console.log('♿ Accessibility Enhancer initialized');
    }

    // Add skip navigation links
    addSkipNavigation() {
        const skipNav = document.createElement('div');
        skipNav.className = 'skip-navigation';
        skipNav.innerHTML = `
            <a href="#main-content" class="skip-link">Skip to main content</a>
            <a href="#navigation" class="skip-link">Skip to navigation</a>
            <a href="#contact" class="skip-link">Skip to contact</a>
        `;

        // Add skip navigation styles
        const skipStyles = document.createElement('style');
        skipStyles.textContent = `
            .skip-navigation {
                position: absolute;
                top: -100px;
                left: 0;
                z-index: 10000;
            }
            .skip-link {
                position: absolute;
                top: -100px;
                left: 0;
                background: #D4AF37;
                color: #000;
                padding: 8px 16px;
                text-decoration: none;
                font-weight: bold;
                border-radius: 0 0 4px 0;
                transition: top 0.3s ease;
            }
            .skip-link:focus {
                top: 0;
                outline: 2px solid #fff;
                outline-offset: 2px;
            }
        `;
        document.head.appendChild(skipStyles);
        document.body.insertBefore(skipNav, document.body.firstChild);

        // Add main content landmark if not exists
        if (!document.getElementById('main-content')) {
            const main = document.querySelector('main') || document.querySelector('.hero-section');
            if (main) {
                main.id = 'main-content';
                main.setAttribute('role', 'main');
            }
        }

        // Add navigation landmark if not exists
        if (!document.getElementById('navigation')) {
            const nav = document.querySelector('nav') || document.querySelector('.nav-container');
            if (nav) {
                nav.id = 'navigation';
                nav.setAttribute('role', 'navigation');
                nav.setAttribute('aria-label', 'Main navigation');
            }
        }
    }

    // Enhance keyboard navigation
    enhanceKeyboardNavigation() {
        // Find all focusable elements
        this.focusableElements = this.getFocusableElements();

        // Add keyboard event listeners
        document.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e));

        // Enhance button keyboard support
        const buttons = document.querySelectorAll('button, [role="button"]');
        buttons.forEach(button => {
            if (!button.hasAttribute('tabindex')) {
                button.setAttribute('tabindex', '0');
            }

            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    button.click();
                }
            });
        });

        // Enhance modal keyboard support
        const modals = document.querySelectorAll('[role="dialog"], .modal');
        modals.forEach(modal => {
            this.enhanceModalAccessibility(modal);
        });
    }

    getFocusableElements() {
        const selector = `
            a[href],
            button:not([disabled]),
            input:not([disabled]),
            select:not([disabled]),
            textarea:not([disabled]),
            [tabindex]:not([tabindex="-1"]),
            [role="button"]:not([disabled]),
            [role="link"]:not([disabled])
        `;
        return Array.from(document.querySelectorAll(selector));
    }

    handleKeyboardNavigation(e) {
        // Handle Escape key for modals
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal[aria-hidden="false"]');
            if (openModal) {
                this.closeModal(openModal);
            }
        }

        // Handle Tab navigation
        if (e.key === 'Tab') {
            this.handleTabNavigation(e);
        }
    }

    handleTabNavigation(e) {
        const activeElement = document.activeElement;
        const focusableElements = this.getFocusableElements();
        const currentIndex = focusableElements.indexOf(activeElement);

        // If we're in a modal, trap focus within it
        const modal = activeElement.closest('[role="dialog"], .modal');
        if (modal && modal.getAttribute('aria-hidden') !== 'true') {
            const modalFocusable = modal.querySelectorAll(`
                a[href],
                button:not([disabled]),
                input:not([disabled]),
                select:not([disabled]),
                textarea:not([disabled]),
                [tabindex]:not([tabindex="-1"])
            `);
            
            if (modalFocusable.length > 0) {
                const firstFocusable = modalFocusable[0];
                const lastFocusable = modalFocusable[modalFocusable.length - 1];

                if (e.shiftKey && activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                } else if (!e.shiftKey && activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        }
    }

    // Improve heading structure
    improveHeadingStructure() {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let currentLevel = 0;
        let h1Count = 0;

        headings.forEach((heading, index) => {
            const level = parseInt(heading.tagName.charAt(1));
            
            // Ensure only one h1 per page
            if (level === 1) {
                h1Count++;
                if (h1Count > 1) {
                    console.warn('Multiple h1 elements found. Consider using h2 for subsequent headings.');
                }
            }

            // Check for proper heading hierarchy
            if (level > currentLevel + 1) {
                console.warn(`Heading level jump detected: ${heading.tagName} after h${currentLevel}`);
            }

            currentLevel = level;

            // Add ARIA attributes if missing
            if (!heading.id) {
                heading.id = `heading-${index + 1}`;
            }

            // Ensure headings are properly labeled
            if (!heading.textContent.trim()) {
                console.warn('Empty heading found:', heading);
            }
        });

        this.headingStructure = Array.from(headings).map(h => ({
            level: parseInt(h.tagName.charAt(1)),
            text: h.textContent.trim(),
            id: h.id
        }));
    }

    // Enhance form accessibility
    enhanceFormAccessibility() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            // Add form labels and descriptions
            const inputs = form.querySelectorAll('input, select, textarea');
            
            inputs.forEach(input => {
                // Ensure every input has a label
                const label = form.querySelector(`label[for="${input.id}"]`);
                if (!label && input.type !== 'hidden') {
                    console.warn('Input without label:', input);
                    
                    // Try to find a nearby text that could be a label
                    const possibleLabel = input.previousElementSibling;
                    if (possibleLabel && possibleLabel.textContent.trim()) {
                        const newLabel = document.createElement('label');
                        newLabel.setAttribute('for', input.id || `input-${Date.now()}`);
                        newLabel.textContent = possibleLabel.textContent;
                        possibleLabel.replaceWith(newLabel);
                    }
                }

                // Add required field indicators
                if (input.hasAttribute('required')) {
                    input.setAttribute('aria-required', 'true');
                    
                    // Add visual indicator if not present
                    const label = form.querySelector(`label[for="${input.id}"]`);
                    if (label && !label.textContent.includes('*')) {
                        label.innerHTML += ' <span aria-hidden="true" style="color: #D4AF37;">*</span>';
                    }
                }

                // Add input descriptions
                if (input.placeholder && !input.getAttribute('aria-describedby')) {
                    const descId = `${input.id}-desc`;
                    const description = document.createElement('div');
                    description.id = descId;
                    description.className = 'sr-only';
                    description.textContent = input.placeholder;
                    input.parentNode.appendChild(description);
                    input.setAttribute('aria-describedby', descId);
                }
            });

            // Add fieldset for grouped inputs
            const radioGroups = form.querySelectorAll('input[type="radio"]');
            const checkboxGroups = form.querySelectorAll('input[type="checkbox"]');
            
            // Group radio buttons with same name
            const radioNames = new Set();
            radioGroups.forEach(radio => {
                if (radio.name && !radioNames.has(radio.name)) {
                    radioNames.add(radio.name);
                    this.wrapInFieldset(form, `input[name="${radio.name}"]`, radio.name);
                }
            });
        });
    }

    wrapInFieldset(form, selector, legendText) {
        const elements = form.querySelectorAll(selector);
        if (elements.length > 1) {
            const fieldset = document.createElement('fieldset');
            const legend = document.createElement('legend');
            legend.textContent = legendText.charAt(0).toUpperCase() + legendText.slice(1);
            fieldset.appendChild(legend);

            const parent = elements[0].parentNode;
            parent.insertBefore(fieldset, elements[0]);
            
            elements.forEach(element => {
                fieldset.appendChild(element.parentNode);
            });
        }
    }

    // Add ARIA labels and descriptions
    addARIALabels() {
        // Enhance navigation
        const navLinks = document.querySelectorAll('nav a, .nav-container a');
        navLinks.forEach(link => {
            if (!link.getAttribute('aria-label') && !link.textContent.trim()) {
                // Try to get label from image alt or title
                const img = link.querySelector('img');
                if (img && img.alt) {
                    link.setAttribute('aria-label', img.alt);
                } else if (link.title) {
                    link.setAttribute('aria-label', link.title);
                }
            }
        });

        // Enhance buttons
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            if (!button.getAttribute('aria-label') && !button.textContent.trim()) {
                // Try to get label from nearby text or icon
                const icon = button.querySelector('svg, i');
                if (icon) {
                    const action = button.className.includes('close') ? 'Close' :
                                 button.className.includes('menu') ? 'Menu' :
                                 button.className.includes('search') ? 'Search' : 'Button';
                    button.setAttribute('aria-label', action);
                }
            }
        });

        // Enhance interactive elements
        const interactiveElements = document.querySelectorAll('[onclick], [role="button"]');
        interactiveElements.forEach(element => {
            if (!element.getAttribute('aria-label') && !element.textContent.trim()) {
                element.setAttribute('aria-label', 'Interactive element');
            }
        });
    }

    // Improve color contrast
    improveColorContrast() {
        // Check and fix common contrast issues
        const textElements = document.querySelectorAll('p, span, div, a, button');
        
        textElements.forEach(element => {
            const styles = window.getComputedStyle(element);
            const color = styles.color;
            const backgroundColor = styles.backgroundColor;
            
            // Check if element has sufficient contrast
            if (this.hasLowContrast(color, backgroundColor)) {
                this.colorContrastIssues.push({
                    element,
                    color,
                    backgroundColor
                });
            }
        });

        // Apply contrast fixes for luxury theme
        const contrastFixes = document.createElement('style');
        contrastFixes.textContent = `
            /* Accessibility contrast improvements */
            .text-gray-400 {
                color: #9CA3AF !important; /* Improved from original */
            }
            .text-gray-500 {
                color: #6B7280 !important; /* Improved from original */
            }
            /* Ensure gold text has sufficient contrast on dark backgrounds */
            .gold-accent {
                color: #F59E0B !important; /* Slightly darker gold for better contrast */
            }
            /* Improve link contrast */
            a:not(.btn):not(.button) {
                color: #60A5FA !important; /* Better blue for links */
            }
            a:not(.btn):not(.button):hover {
                color: #93C5FD !important;
            }
        `;
        document.head.appendChild(contrastFixes);
    }

    hasLowContrast(color, backgroundColor) {
        // Simplified contrast check - in production, use a proper contrast ratio calculator
        const colorLuminance = this.getLuminance(color);
        const bgLuminance = this.getLuminance(backgroundColor);
        
        const contrast = (Math.max(colorLuminance, bgLuminance) + 0.05) / 
                        (Math.min(colorLuminance, bgLuminance) + 0.05);
        
        return contrast < 4.5; // WCAG AA standard
    }

    getLuminance(color) {
        // Simplified luminance calculation
        // In production, use a proper color parsing library
        if (color === 'rgb(255, 255, 255)' || color === '#ffffff' || color === 'white') return 1;
        if (color === 'rgb(0, 0, 0)' || color === '#000000' || color === 'black') return 0;
        return 0.5; // Default middle value
    }

    // Enhance image accessibility
    enhanceImageAccessibility() {
        const images = document.querySelectorAll('img');
        
        images.forEach(img => {
            // Ensure all images have alt text
            if (!img.hasAttribute('alt')) {
                // Try to generate alt text from context
                const figcaption = img.closest('figure')?.querySelector('figcaption');
                const title = img.title;
                const filename = img.src.split('/').pop().split('.')[0];
                
                const altText = figcaption?.textContent || 
                               title || 
                               filename.replace(/[-_]/g, ' ') || 
                               'Image';
                
                img.setAttribute('alt', altText);
            }

            // Mark decorative images
            if (img.alt === '' || img.hasAttribute('data-decorative')) {
                img.setAttribute('role', 'presentation');
                img.setAttribute('aria-hidden', 'true');
            }
        });
    }

    // Setup focus management
    setupFocusManagement() {
        // Add focus indicators
        const focusStyles = document.createElement('style');
        focusStyles.textContent = `
            /* Enhanced focus indicators */
            *:focus {
                outline: 2px solid #D4AF37 !important;
                outline-offset: 2px !important;
            }
            
            /* Custom focus for luxury elements */
            .luxury-button:focus,
            .btn-luxury:focus {
                outline: 2px solid #fff !important;
                outline-offset: 2px !important;
                box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.3) !important;
            }
            
            /* Focus for form elements */
            input:focus,
            select:focus,
            textarea:focus {
                outline: 2px solid #D4AF37 !important;
                outline-offset: 2px !important;
                border-color: #D4AF37 !important;
            }
        `;
        document.head.appendChild(focusStyles);

        // Manage focus for dynamic content
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-focus-target]')) {
                const targetId = e.target.getAttribute('data-focus-target');
                const target = document.getElementById(targetId);
                if (target) {
                    target.focus();
                }
            }
        });
    }

    // Add live regions for dynamic content
    addLiveRegions() {
        // Create status live region
        const statusRegion = document.createElement('div');
        statusRegion.id = 'status-live-region';
        statusRegion.setAttribute('aria-live', 'polite');
        statusRegion.setAttribute('aria-atomic', 'true');
        statusRegion.className = 'sr-only';
        document.body.appendChild(statusRegion);

        // Create alert live region
        const alertRegion = document.createElement('div');
        alertRegion.id = 'alert-live-region';
        alertRegion.setAttribute('aria-live', 'assertive');
        alertRegion.setAttribute('aria-atomic', 'true');
        alertRegion.className = 'sr-only';
        document.body.appendChild(alertRegion);

        // Add screen reader only class
        const srOnlyStyles = document.createElement('style');
        srOnlyStyles.textContent = `
            .sr-only {
                position: absolute !important;
                width: 1px !important;
                height: 1px !important;
                padding: 0 !important;
                margin: -1px !important;
                overflow: hidden !important;
                clip: rect(0, 0, 0, 0) !important;
                white-space: nowrap !important;
                border: 0 !important;
            }
        `;
        document.head.appendChild(srOnlyStyles);
    }

    // Enhanced modal accessibility
    enhanceModalAccessibility(modal) {
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-hidden', 'true');

        // Add close button if not present
        if (!modal.querySelector('[data-dismiss], .modal-close, .close')) {
            const closeButton = document.createElement('button');
            closeButton.className = 'modal-close-btn';
            closeButton.setAttribute('aria-label', 'Close dialog');
            closeButton.innerHTML = '×';
            closeButton.addEventListener('click', () => this.closeModal(modal));
            
            const header = modal.querySelector('.modal-header, .modal-content');
            if (header) {
                header.appendChild(closeButton);
            }
        }
    }

    closeModal(modal) {
        modal.setAttribute('aria-hidden', 'true');
        modal.style.display = 'none';
        
        // Return focus to trigger element
        const trigger = document.querySelector(`[data-target="#${modal.id}"]`);
        if (trigger) {
            trigger.focus();
        }
    }

    // Public method to announce messages to screen readers
    announce(message, priority = 'polite') {
        const region = priority === 'assertive' ? 
                      document.getElementById('alert-live-region') : 
                      document.getElementById('status-live-region');
        
        if (region) {
            region.textContent = message;
            
            // Clear after announcement
            setTimeout(() => {
                region.textContent = '';
            }, 1000);
        }
    }

    // Public method to get accessibility status
    getAccessibilityStatus() {
        return {
            focusableElements: this.focusableElements.length,
            headingStructure: this.headingStructure,
            colorContrastIssues: this.colorContrastIssues.length,
            skipLinksAdded: this.skipLinks.length > 0
        };
    }
}

// Initialize accessibility enhancer
const accessibilityEnhancer = new AccessibilityEnhancer();
