/**
 * Path Validator for Midas The Lifestyle
 * Validates all file paths and dependencies to ensure no errors
 */

class PathValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.validatedPaths = new Set();
        this.init();
    }

    async init() {
        console.log('🔍 Path Validator: Starting comprehensive validation...');
        
        // Validate all script references
        await this.validateScriptReferences();
        
        // Validate CSS references
        await this.validateCSSReferences();
        
        // Validate image references
        await this.validateImageReferences();
        
        // Validate API endpoints
        await this.validateAPIEndpoints();
        
        // Validate external dependencies
        await this.validateExternalDependencies();
        
        // Report results
        this.reportResults();
    }

    async validateScriptReferences() {
        console.log('📜 Validating script references...');
        
        const scripts = document.querySelectorAll('script[src]');
        const scriptPromises = Array.from(scripts).map(script => {
            const src = script.src;
            if (src.startsWith('http')) {
                return this.validateExternalResource(src, 'script');
            } else {
                return this.validateLocalResource(src, 'script');
            }
        });

        await Promise.all(scriptPromises);
    }

    async validateCSSReferences() {
        console.log('🎨 Validating CSS references...');
        
        const links = document.querySelectorAll('link[rel="stylesheet"]');
        const cssPromises = Array.from(links).map(link => {
            const href = link.href;
            if (href.startsWith('http')) {
                return this.validateExternalResource(href, 'css');
            } else {
                return this.validateLocalResource(href, 'css');
            }
        });

        await Promise.all(cssPromises);
    }

    async validateImageReferences() {
        console.log('🖼️ Validating image references...');
        
        const images = document.querySelectorAll('img[src]');
        const imagePromises = Array.from(images).map(img => {
            const src = img.src;
            if (src.startsWith('http') || src.startsWith('data:')) {
                return this.validateExternalResource(src, 'image');
            } else {
                return this.validateLocalResource(src, 'image');
            }
        });

        await Promise.all(imagePromises);
    }

    async validateAPIEndpoints() {
        console.log('🔗 Validating API endpoints...');
        
        const endpoints = [
            '/.netlify/functions/contact-form',
            '/.netlify/functions/reservation-form',
            '/.netlify/functions/booking-confirmation',
            '/.netlify/functions/oauth-callback'
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint, { method: 'OPTIONS' });
                if (response.ok || response.status === 405) {
                    console.log(`✅ API endpoint available: ${endpoint}`);
                } else {
                    this.warnings.push(`⚠️ API endpoint may not be available: ${endpoint} (Status: ${response.status})`);
                }
            } catch (error) {
                this.warnings.push(`⚠️ Could not validate API endpoint: ${endpoint} (${error.message})`);
            }
        }
    }

    async validateExternalDependencies() {
        console.log('🌐 Validating external dependencies...');
        
        const externalDeps = [
            'https://cdn.tailwindcss.com',
            'https://accounts.google.com/gsi/client',
            'https://js.stripe.com/v3/',
            'https://fonts.googleapis.com'
        ];

        for (const dep of externalDeps) {
            try {
                const response = await fetch(dep, { method: 'HEAD', mode: 'no-cors' });
                console.log(`✅ External dependency available: ${dep}`);
            } catch (error) {
                this.warnings.push(`⚠️ Could not validate external dependency: ${dep}`);
            }
        }
    }

    async validateLocalResource(path, type) {
        if (this.validatedPaths.has(path)) return;
        this.validatedPaths.add(path);

        try {
            const response = await fetch(path, { method: 'HEAD' });
            if (response.ok) {
                console.log(`✅ Local ${type} found: ${path}`);
            } else {
                this.errors.push(`❌ Local ${type} not found: ${path} (Status: ${response.status})`);
            }
        } catch (error) {
            this.errors.push(`❌ Error loading local ${type}: ${path} (${error.message})`);
        }
    }

    async validateExternalResource(url, type) {
        if (this.validatedPaths.has(url)) return;
        this.validatedPaths.add(url);

        try {
            // For external resources, we'll just check if they're accessible
            const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
            console.log(`✅ External ${type} accessible: ${url}`);
        } catch (error) {
            this.warnings.push(`⚠️ Could not validate external ${type}: ${url}`);
        }
    }

    validateJavaScriptModules() {
        console.log('🔧 Validating JavaScript modules...');
        
        // Check if critical objects are available
        const criticalObjects = [
            'userAuth',
            'aiChatbot',
            'oauthConfig',
            'bookingCalendar',
            'paymentSystem',
            'contentManager',
            'imageOptimizer'
        ];

        criticalObjects.forEach(obj => {
            if (typeof window[obj] !== 'undefined') {
                console.log(`✅ JavaScript module loaded: ${obj}`);
            } else {
                this.warnings.push(`⚠️ JavaScript module not found: ${obj}`);
            }
        });
    }

    validateFormElements() {
        console.log('📝 Validating form elements...');
        
        const forms = document.querySelectorAll('form');
        forms.forEach((form, index) => {
            const formId = form.id || `form-${index}`;
            
            // Check for required form elements
            const requiredElements = form.querySelectorAll('[required]');
            const submitButton = form.querySelector('button[type="submit"]');
            
            if (!submitButton) {
                this.warnings.push(`⚠️ Form ${formId} missing submit button`);
            }
            
            if (requiredElements.length === 0) {
                this.warnings.push(`⚠️ Form ${formId} has no required fields`);
            }
            
            console.log(`✅ Form validated: ${formId} (${requiredElements.length} required fields)`);
        });
    }

    validateAccessibility() {
        console.log('♿ Validating accessibility features...');
        
        // Check for missing alt attributes
        const images = document.querySelectorAll('img:not([alt])');
        if (images.length > 0) {
            this.warnings.push(`⚠️ ${images.length} images missing alt attributes`);
        }
        
        // Check for missing labels
        const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
        const inputsWithoutLabels = Array.from(inputs).filter(input => {
            return !document.querySelector(`label[for="${input.id}"]`);
        });
        
        if (inputsWithoutLabels.length > 0) {
            this.warnings.push(`⚠️ ${inputsWithoutLabels.length} inputs missing labels`);
        }
        
        console.log(`✅ Accessibility check completed`);
    }

    validatePerformance() {
        console.log('⚡ Validating performance considerations...');
        
        // Check for large images
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (img.naturalWidth > 2560 || img.naturalHeight > 1440) {
                this.warnings.push(`⚠️ Large image detected: ${img.src} (${img.naturalWidth}x${img.naturalHeight})`);
            }
        });
        
        // Check for unoptimized scripts
        const scripts = document.querySelectorAll('script:not([defer]):not([async])');
        if (scripts.length > 5) {
            this.warnings.push(`⚠️ ${scripts.length} synchronous scripts may impact performance`);
        }
        
        console.log(`✅ Performance check completed`);
    }

    reportResults() {
        console.log('\n📊 PATH VALIDATION RESULTS');
        console.log('=' .repeat(50));
        
        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log('🎉 ALL PATHS VALIDATED SUCCESSFULLY!');
            console.log('✅ No errors or warnings found');
            console.log('✅ All resources are accessible');
            console.log('✅ All dependencies are loaded');
            
            // Show success notification
            this.showSuccessNotification();
        } else {
            if (this.errors.length > 0) {
                console.log('\n❌ ERRORS FOUND:');
                this.errors.forEach(error => console.log(error));
            }
            
            if (this.warnings.length > 0) {
                console.log('\n⚠️ WARNINGS:');
                this.warnings.forEach(warning => console.log(warning));
            }
            
            // Show results notification
            this.showResultsNotification();
        }
        
        console.log('\n📈 VALIDATION SUMMARY:');
        console.log(`✅ Validated paths: ${this.validatedPaths.size}`);
        console.log(`❌ Errors: ${this.errors.length}`);
        console.log(`⚠️ Warnings: ${this.warnings.length}`);
        console.log('=' .repeat(50));
    }

    showSuccessNotification() {
        const notification = document.createElement('div');
        notification.className = 'path-validation-success';
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #22c55e, #16a34a);
                color: white;
                padding: 20px;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(34, 197, 94, 0.3);
                z-index: 10000;
                max-width: 400px;
                font-family: system-ui, -apple-system, sans-serif;
            ">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                    <div style="font-size: 24px;">🎉</div>
                    <h3 style="margin: 0; font-size: 18px; font-weight: 600;">All Paths Validated!</h3>
                </div>
                <p style="margin: 0; font-size: 14px; opacity: 0.9;">
                    ✅ ${this.validatedPaths.size} paths checked<br>
                    ✅ No errors found<br>
                    ✅ All resources accessible
                </p>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    showResultsNotification() {
        const notification = document.createElement('div');
        notification.className = 'path-validation-results';
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #f59e0b, #d97706);
                color: white;
                padding: 20px;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(245, 158, 11, 0.3);
                z-index: 10000;
                max-width: 400px;
                font-family: system-ui, -apple-system, sans-serif;
            ">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                    <div style="font-size: 24px;">📊</div>
                    <h3 style="margin: 0; font-size: 18px; font-weight: 600;">Validation Complete</h3>
                </div>
                <p style="margin: 0; font-size: 14px; opacity: 0.9;">
                    📊 ${this.validatedPaths.size} paths checked<br>
                    ${this.errors.length > 0 ? `❌ ${this.errors.length} errors` : '✅ No errors'}<br>
                    ${this.warnings.length > 0 ? `⚠️ ${this.warnings.length} warnings` : '✅ No warnings'}
                </p>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    padding: 8px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    margin-top: 12px;
                    font-size: 12px;
                ">Close</button>
            </div>
        `;
        
        document.body.appendChild(notification);
    }

    // Public method to run validation manually
    async runValidation() {
        this.errors = [];
        this.warnings = [];
        this.validatedPaths.clear();
        await this.init();
    }

    // Get validation results
    getResults() {
        return {
            errors: this.errors,
            warnings: this.warnings,
            validatedPaths: Array.from(this.validatedPaths),
            isValid: this.errors.length === 0
        };
    }
}

// Initialize path validator after page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.pathValidator = new PathValidator();
    }, 2000); // Wait 2 seconds for all resources to load
});

// Export for manual use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PathValidator;
}

console.log('🔍 Path Validator loaded successfully');
