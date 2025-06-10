/**
 * Enhanced Form Validator for Midas The Lifestyle
 * Provides comprehensive form validation with luxury-themed styling
 * Supports accessibility features and real-time validation
 */

class FormValidator {
    constructor() {
        this.forms = new Map();
        this.validationRules = {
            name: {
                required: true,
                pattern: /^[A-Za-z\s]{2,50}$/,
                minLength: 2,
                maxLength: 50,
                message: 'Please enter a valid name (2-50 characters, letters only)'
            },
            email: {
                required: true,
                pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                message: 'Please enter a valid email address'
            },
            phone: {
                required: true,
                pattern: /^[\+]?[1-9][\d\s\-\(\)]{7,15}$/,
                message: 'Please enter a valid phone number (e.g., +1 555 123 4567)'
            },
            location: {
                required: true,
                message: 'Please select your preferred location'
            },
            service: {
                required: true,
                message: 'Please select a service'
            },
            message: {
                required: true,
                minLength: 10,
                maxLength: 1000,
                message: 'Please enter your requirements (10-1000 characters)'
            },
            dates: {
                required: true,
                pattern: /^\d{4}-\d{2}-\d{2}\s+to\s+\d{4}-\d{2}-\d{2}$/,
                message: 'Please enter dates in format: YYYY-MM-DD to YYYY-MM-DD'
            }
        };
        
        this.init();
    }

    init() {
        // Initialize all forms on the page
        this.initializeForms();
        
        // Setup real-time validation
        this.setupRealTimeValidation();
        
        // Setup form submission handling
        this.setupFormSubmission();
        
        console.log('🔍 Form Validator initialized');
    }

    initializeForms() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            this.registerForm(form);
        });
    }

    registerForm(form) {
        const formId = form.id || `form-${Date.now()}`;
        if (!form.id) form.id = formId;

        const formData = {
            element: form,
            fields: new Map(),
            isValid: false,
            submitButton: form.querySelector('button[type="submit"]')
        };

        // Register all form fields
        const fields = form.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            this.registerField(formData, field);
        });

        this.forms.set(formId, formData);
        
        // Add ARIA attributes for accessibility
        form.setAttribute('novalidate', 'true');
        form.setAttribute('aria-label', form.getAttribute('aria-label') || 'Contact form');
    }

    registerField(formData, field) {
        const fieldName = field.name || field.id;
        if (!fieldName) return;

        const fieldData = {
            element: field,
            errorElement: this.createErrorElement(field),
            isValid: false,
            rules: this.validationRules[fieldName] || {}
        };

        // Add error element to DOM
        field.parentNode.appendChild(fieldData.errorElement);

        // Setup field event listeners
        this.setupFieldListeners(fieldData);

        // Add character counter for textarea
        if (field.tagName === 'TEXTAREA') {
            this.setupCharacterCounter(field);
        }

        formData.fields.set(fieldName, fieldData);
    }

    createErrorElement(field) {
        const errorId = `${field.id || field.name}-error`;
        let errorElement = document.getElementById(errorId);
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = errorId;
            errorElement.className = 'error-message';
            errorElement.setAttribute('role', 'alert');
            errorElement.setAttribute('aria-live', 'polite');
        }

        // Update field's aria-describedby
        const describedBy = field.getAttribute('aria-describedby');
        if (!describedBy || !describedBy.includes(errorId)) {
            field.setAttribute('aria-describedby', describedBy ? `${describedBy} ${errorId}` : errorId);
        }

        return errorElement;
    }

    setupFieldListeners(fieldData) {
        const { element } = fieldData;

        // Real-time validation on blur
        element.addEventListener('blur', () => {
            this.validateField(fieldData);
        });

        // Clear errors on input
        element.addEventListener('input', () => {
            this.clearFieldError(fieldData);
            
            // Update character counter for textarea
            if (element.tagName === 'TEXTAREA') {
                this.updateCharacterCounter(element);
            }
        });

        // Validate on change for select elements
        if (element.tagName === 'SELECT') {
            element.addEventListener('change', () => {
                this.validateField(fieldData);
            });
        }
    }

    setupCharacterCounter(textarea) {
        const counterId = `${textarea.id}-count`;
        let counter = document.getElementById(counterId);
        
        if (!counter) {
            counter = document.createElement('div');
            counter.id = counterId;
            counter.className = 'text-xs text-gray-400 mt-1';
            counter.innerHTML = `<span id="${textarea.id}-current">0</span>/${textarea.maxLength || 1000} characters`;
            textarea.parentNode.appendChild(counter);
        }

        this.updateCharacterCounter(textarea);
    }

    updateCharacterCounter(textarea) {
        const currentSpan = document.getElementById(`${textarea.id}-current`);
        if (currentSpan) {
            const currentLength = textarea.value.length;
            const maxLength = textarea.maxLength || 1000;
            currentSpan.textContent = currentLength;
            
            // Change color based on usage
            const counter = currentSpan.parentNode;
            if (currentLength > maxLength * 0.9) {
                counter.className = 'text-xs text-yellow-400 mt-1';
            } else if (currentLength > maxLength * 0.8) {
                counter.className = 'text-xs text-orange-400 mt-1';
            } else {
                counter.className = 'text-xs text-gray-400 mt-1';
            }
        }
    }

    setupRealTimeValidation() {
        // Validate forms on input changes
        document.addEventListener('input', (e) => {
            if (e.target.matches('input, select, textarea')) {
                const form = e.target.closest('form');
                if (form && this.forms.has(form.id)) {
                    // Debounce validation for better performance
                    clearTimeout(e.target.validationTimeout);
                    e.target.validationTimeout = setTimeout(() => {
                        this.validateForm(form.id);
                    }, 300);
                }
            }
        });
    }

    setupFormSubmission() {
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form && this.forms.has(form.id)) {
                e.preventDefault();
                this.handleFormSubmission(form.id);
            }
        });
    }

    validateField(fieldData) {
        const { element, rules, errorElement } = fieldData;
        const value = element.value.trim();
        
        let isValid = true;
        let errorMessage = '';

        // Required field validation
        if (rules.required && !value) {
            isValid = false;
            errorMessage = `${this.getFieldLabel(element)} is required`;
        }
        
        // Pattern validation
        else if (value && rules.pattern && !rules.pattern.test(value)) {
            isValid = false;
            errorMessage = rules.message || 'Invalid format';
        }
        
        // Length validation
        else if (value && rules.minLength && value.length < rules.minLength) {
            isValid = false;
            errorMessage = `Minimum ${rules.minLength} characters required`;
        }
        
        else if (value && rules.maxLength && value.length > rules.maxLength) {
            isValid = false;
            errorMessage = `Maximum ${rules.maxLength} characters allowed`;
        }

        // Custom validation for specific fields
        if (isValid && element.type === 'email' && value) {
            isValid = this.validateEmail(value);
            if (!isValid) errorMessage = 'Please enter a valid email address';
        }

        if (isValid && element.type === 'tel' && value) {
            isValid = this.validatePhone(value);
            if (!isValid) errorMessage = 'Please enter a valid phone number';
        }

        // Update field state
        fieldData.isValid = isValid;
        
        if (isValid) {
            this.clearFieldError(fieldData);
        } else {
            this.showFieldError(fieldData, errorMessage);
        }

        return isValid;
    }

    validateEmail(email) {
        // More comprehensive email validation
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return emailRegex.test(email) && email.length <= 254;
    }

    validatePhone(phone) {
        // Remove all non-digit characters except +
        const cleanPhone = phone.replace(/[^\d+]/g, '');
        
        // Check if it's a valid international format
        if (cleanPhone.startsWith('+')) {
            return cleanPhone.length >= 8 && cleanPhone.length <= 16;
        }
        
        // Check if it's a valid domestic format
        return cleanPhone.length >= 7 && cleanPhone.length <= 15;
    }

    getFieldLabel(element) {
        const label = document.querySelector(`label[for="${element.id}"]`);
        return label ? label.textContent.replace('*', '').trim() : element.name || 'Field';
    }

    showFieldError(fieldData, message) {
        const { element, errorElement } = fieldData;
        
        element.classList.add('error');
        element.setAttribute('aria-invalid', 'true');
        
        errorElement.textContent = message;
        errorElement.classList.add('show');
        
        // Add luxury error styling
        element.style.borderColor = '#ff6b6b';
        element.style.boxShadow = '0 0 0 2px rgba(255, 107, 107, 0.2)';
    }

    clearFieldError(fieldData) {
        const { element, errorElement } = fieldData;
        
        element.classList.remove('error');
        element.setAttribute('aria-invalid', 'false');
        
        errorElement.textContent = '';
        errorElement.classList.remove('show');
        
        // Restore luxury styling
        element.style.borderColor = '#D4AF37';
        element.style.boxShadow = '';
    }

    validateForm(formId) {
        const formData = this.forms.get(formId);
        if (!formData) return false;

        let isFormValid = true;
        
        // Validate all fields
        formData.fields.forEach(fieldData => {
            const fieldValid = this.validateField(fieldData);
            if (!fieldValid) isFormValid = false;
        });

        // Update form state
        formData.isValid = isFormValid;
        
        // Update submit button state
        if (formData.submitButton) {
            formData.submitButton.disabled = !isFormValid;
            if (isFormValid) {
                formData.submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
            } else {
                formData.submitButton.classList.add('opacity-50', 'cursor-not-allowed');
            }
        }

        return isFormValid;
    }

    async handleFormSubmission(formId) {
        const formData = this.forms.get(formId);
        if (!formData) return;

        // Final validation
        const isValid = this.validateForm(formId);
        if (!isValid) {
            this.focusFirstError(formData);
            return;
        }

        // Show loading state
        this.setFormLoading(formData, true);

        try {
            // Collect form data
            const data = this.collectFormData(formData);
            
            // Submit form (this would integrate with your existing form submission logic)
            await this.submitForm(formData.element, data);
            
            // Show success message
            this.showFormSuccess(formData);
            
        } catch (error) {
            console.error('Form submission error:', error);
            this.showFormError(formData, 'An error occurred. Please try again.');
        } finally {
            this.setFormLoading(formData, false);
        }
    }

    collectFormData(formData) {
        const data = {};
        formData.fields.forEach((fieldData, fieldName) => {
            data[fieldName] = fieldData.element.value.trim();
        });
        return data;
    }

    async submitForm(form, data) {
        // This would integrate with your existing form submission logic
        // For now, simulate an API call
        return new Promise((resolve) => {
            setTimeout(resolve, 1000);
        });
    }

    setFormLoading(formData, isLoading) {
        const submitButton = formData.submitButton;
        if (!submitButton) return;

        const loadingSpan = submitButton.querySelector('.submit-loading');
        const textSpan = submitButton.querySelector('.submit-text');

        if (isLoading) {
            submitButton.disabled = true;
            if (loadingSpan) loadingSpan.classList.remove('hidden');
            if (textSpan) textSpan.classList.add('hidden');
        } else {
            submitButton.disabled = false;
            if (loadingSpan) loadingSpan.classList.add('hidden');
            if (textSpan) textSpan.classList.remove('hidden');
        }
    }

    showFormSuccess(formData) {
        const statusElement = formData.element.querySelector('[role="status"]');
        if (statusElement) {
            statusElement.innerHTML = '<div class="text-green-400 font-semibold">✓ Thank you! Your request has been submitted successfully.</div>';
        }
    }

    showFormError(formData, message) {
        const statusElement = formData.element.querySelector('[role="status"]');
        if (statusElement) {
            statusElement.innerHTML = `<div class="text-red-400 font-semibold">✗ ${message}</div>`;
        }
    }

    focusFirstError(formData) {
        for (const [fieldName, fieldData] of formData.fields) {
            if (!fieldData.isValid) {
                fieldData.element.focus();
                break;
            }
        }
    }

    // Public method to manually validate a form
    validate(formId) {
        return this.validateForm(formId);
    }

    // Public method to get form status
    getFormStatus(formId) {
        const formData = this.forms.get(formId);
        if (!formData) return null;

        return {
            isValid: formData.isValid,
            fieldCount: formData.fields.size,
            validFields: Array.from(formData.fields.values()).filter(f => f.isValid).length
        };
    }
}

// Initialize form validator
const formValidator = new FormValidator();
