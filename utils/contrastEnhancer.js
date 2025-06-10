/**
 * Contrast Enhancer for Midas The Lifestyle
 * Dynamically improves text contrast for mobile devices
 * Maintains luxury black/gold aesthetic while ensuring WCAG 2.1 AA compliance
 */

class ContrastEnhancer {
    constructor() {
        this.isMobile = this.detectMobile();
        this.contrastRatios = {
            normalText: 4.5,
            largeText: 3.0,
            uiComponents: 3.0
        };
        
        this.luxuryColors = {
            primaryGold: '#D4AF37',
            lightGold: '#F4D03F',
            enhancedGold: '#F7DC6F',
            darkBackground: '#0A0A0A',
            cardBackground: '#1A1A1A',
            enhancedWhite: '#FFFFFF',
            enhancedGray: '#E5E5E5',
            lightGray: '#F0F0F0'
        };
        
        this.init();
    }

    init() {
        console.log('🎨 Initializing Contrast Enhancer for luxury mobile experience');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.enhanceContrast());
        } else {
            this.enhanceContrast();
        }
        
        // Re-enhance on window resize
        window.addEventListener('resize', () => {
            this.isMobile = this.detectMobile();
            this.enhanceContrast();
        });
        
        // Enhance dynamically added content
        this.observeContentChanges();
    }

    detectMobile() {
        return window.innerWidth <= 768 || 
               /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    enhanceContrast() {
        if (!this.isMobile) return;
        
        console.log('📱 Applying mobile contrast enhancements');
        
        this.enhanceNavigationContrast();
        this.enhanceFormContrast();
        this.enhanceCardContrast();
        this.enhanceTextOverImages();
        this.enhanceButtonContrast();
        this.enhanceModalContrast();
        this.addContrastIndicators();
    }

    enhanceNavigationContrast() {
        // Enhance main navigation
        const nav = document.querySelector('nav');
        if (nav) {
            nav.style.background = 'rgba(10, 10, 10, 0.99)';
            nav.style.borderBottom = '3px solid #D4AF37';
            nav.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';
        }

        // Enhance navigation links
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            link.style.color = this.luxuryColors.enhancedWhite;
            link.style.fontWeight = '600';
            link.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.8)';
            
            // Enhanced hover states
            link.addEventListener('mouseenter', () => {
                link.style.color = this.luxuryColors.lightGold;
                link.style.textShadow = '0 0 10px rgba(247, 220, 111, 0.5)';
            });
            
            link.addEventListener('mouseleave', () => {
                link.style.color = this.luxuryColors.enhancedWhite;
                link.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.8)';
            });
        });

        // Enhance mobile menu
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
            mobileMenu.style.background = 'rgba(10, 10, 10, 0.99)';
            mobileMenu.style.borderTop = '3px solid #D4AF37';
            
            const mobileLinks = mobileMenu.querySelectorAll('a');
            mobileLinks.forEach(link => {
                link.style.color = this.luxuryColors.enhancedWhite;
                link.style.fontWeight = '600';
                link.style.padding = '16px 0';
                link.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.8)';
            });
        }
    }

    enhanceFormContrast() {
        // Enhance all form inputs
        const formElements = document.querySelectorAll('input, select, textarea');
        formElements.forEach(element => {
            element.style.background = 'rgba(0, 0, 0, 0.9)';
            element.style.border = '2px solid #777';
            element.style.color = this.luxuryColors.enhancedWhite;
            element.style.fontSize = '16px'; // Prevent zoom on iOS
            element.style.fontWeight = '500';
            
            // Enhanced focus states
            element.addEventListener('focus', () => {
                element.style.borderColor = this.luxuryColors.lightGold;
                element.style.boxShadow = '0 0 0 3px rgba(247, 220, 111, 0.3)';
            });
        });

        // Enhance form labels
        const labels = document.querySelectorAll('label');
        labels.forEach(label => {
            label.style.color = this.luxuryColors.enhancedWhite;
            label.style.fontWeight = '600';
            label.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.7)';
        });

        // Enhance placeholder text
        const style = document.createElement('style');
        style.textContent = `
            input::placeholder, select::placeholder, textarea::placeholder {
                color: #D0D0D0 !important;
                opacity: 1 !important;
            }
        `;
        document.head.appendChild(style);
    }

    enhanceCardContrast() {
        // Enhance all card elements
        const cards = document.querySelectorAll('.card, .premium-card, .luxury-card');
        cards.forEach(card => {
            card.style.background = 'linear-gradient(145deg, #1a1a1a, #2a2a2a)';
            card.style.border = '2px solid #D4AF37';
            card.style.borderRadius = '12px';
            
            // Enhance card text
            const cardText = card.querySelectorAll('p, span, div:not(.gold-accent)');
            cardText.forEach(text => {
                if (!text.classList.contains('gold-accent') && 
                    !text.style.color.includes('#D4AF37')) {
                    text.style.color = this.luxuryColors.lightGray;
                    text.style.textShadow = '0 1px 3px rgba(0, 0, 0, 0.7)';
                }
            });
            
            // Enhance card headings
            const cardHeadings = card.querySelectorAll('h1, h2, h3, h4, h5, h6');
            cardHeadings.forEach(heading => {
                heading.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.7)';
            });
        });
    }

    enhanceTextOverImages() {
        // Find sections with background images
        const sectionsWithBg = document.querySelectorAll('.hero-bg, .section-bg, .parallax-bg');
        sectionsWithBg.forEach(section => {
            // Add additional overlay for better contrast
            if (!section.querySelector('.contrast-overlay')) {
                const overlay = document.createElement('div');
                overlay.className = 'contrast-overlay';
                overlay.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.3);
                    z-index: 1;
                    pointer-events: none;
                `;
                section.style.position = 'relative';
                section.appendChild(overlay);
            }
            
            // Enhance all text in these sections
            const textElements = section.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, li, a');
            textElements.forEach(element => {
                element.style.position = 'relative';
                element.style.zIndex = '2';
                element.style.textShadow = '0 3px 6px rgba(0, 0, 0, 0.8)';
            });
        });
    }

    enhanceButtonContrast() {
        // Enhance all buttons
        const buttons = document.querySelectorAll('button, .luxury-button, .btn-luxury');
        buttons.forEach(button => {
            if (button.style.background.includes('gradient') || 
                button.classList.contains('luxury-button')) {
                button.style.fontWeight = '700';
                button.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.3)';
                button.style.fontSize = '16px';
            }
        });
    }

    enhanceModalContrast() {
        // Enhance modal backgrounds
        const modals = document.querySelectorAll('.modal, .transportation-modal');
        modals.forEach(modal => {
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.style.background = 'linear-gradient(145deg, #1a1a1a, #2a2a2a)';
                modalContent.style.border = '3px solid #D4AF37';
            }
        });
    }

    addContrastIndicators() {
        // Add visual indicators for enhanced contrast (development mode)
        if (window.location.hostname === 'localhost' || window.location.hostname.includes('netlify')) {
            const indicator = document.createElement('div');
            indicator.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(212, 175, 55, 0.9);
                color: #000;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
                z-index: 10000;
                pointer-events: none;
            `;
            indicator.textContent = '📱 Enhanced Contrast Active';
            document.body.appendChild(indicator);
            
            // Remove after 3 seconds
            setTimeout(() => indicator.remove(), 3000);
        }
    }

    observeContentChanges() {
        // Watch for dynamically added content
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Re-enhance contrast for new content
                    setTimeout(() => this.enhanceContrast(), 100);
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Utility method to calculate contrast ratio
    calculateContrastRatio(color1, color2) {
        const getLuminance = (color) => {
            const rgb = this.hexToRgb(color);
            const rsRGB = rgb.r / 255;
            const gsRGB = rgb.g / 255;
            const bsRGB = rgb.b / 255;

            const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
            const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
            const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };

        const lum1 = getLuminance(color1);
        const lum2 = getLuminance(color2);
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);

        return (brightest + 0.05) / (darkest + 0.05);
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
}

// Initialize the contrast enhancer
const contrastEnhancer = new ContrastEnhancer();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContrastEnhancer;
}

console.log('✨ Midas The Lifestyle Contrast Enhancer loaded - Luxury accessibility optimized');
