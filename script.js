// Midas Lifestyle JavaScript Functionality

// Initialize Swiper for Hero Slider
const heroSwiper = new Swiper('.hero-slider', {
    slidesPerView: 1,
    loop: true,
    autoplay: {
        delay: 5000,
        disableOnInteraction: false,
    },
    effect: 'fade',
    fadeEffect: {
        crossFade: true
    }
});

// Initialize Swiper for Car Slider
const carSwiper = new Swiper('.car-slider', {
    slidesPerView: 1,
    spaceBetween: 30,
    navigation: {
        nextEl: '.car-slider .swiper-button-next',
        prevEl: '.car-slider .swiper-button-prev',
    },
    pagination: {
        el: '.car-slider .swiper-pagination',
        clickable: true,
    },
    breakpoints: {
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
    },
});

// Initialize Swiper for Yacht Slider
const yachtSwiper = new Swiper('.yacht-slider', {
    slidesPerView: 1,
    spaceBetween: 30,
    navigation: {
        nextEl: '.yacht-slider .swiper-button-next',
        prevEl: '.yacht-slider .swiper-button-prev',
    },
    pagination: {
        el: '.yacht-slider .swiper-pagination',
        clickable: true,
    },
    breakpoints: {
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
    },
});

// Initialize Swiper for Plane Slider
const planeSwiper = new Swiper('.plane-slider', {
    slidesPerView: 1,
    spaceBetween: 30,
    navigation: {
        nextEl: '.plane-slider .swiper-button-next',
        prevEl: '.plane-slider .swiper-button-prev',
    },
    pagination: {
        el: '.plane-slider .swiper-pagination',
        clickable: true,
    },
    breakpoints: {
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
    },
});

// Initialize Swiper for Property Slider
const propertySwiper = new Swiper('.property-slider', {
    slidesPerView: 1,
    spaceBetween: 30,
    navigation: {
        nextEl: '.property-slider .swiper-button-next',
        prevEl: '.property-slider .swiper-button-prev',
    },
    pagination: {
        el: '.property-slider .swiper-pagination',
        clickable: true,
    },
    breakpoints: {
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
    },
});

// Filter Functionality for All Sections
function setupFilters(sectionId, swiperInstance) {
    const section = document.querySelector(`#${sectionId}`);
    if (!section) return;
    
    const filterButtons = section.querySelectorAll('.filter-btn[data-type]');
    const slides = section.querySelectorAll('.swiper-slide[data-type]');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Filter slides
            slides.forEach(slide => {
                if (type === 'all' || slide.getAttribute('data-type') === type) {
                    slide.style.display = 'block';
                } else {
                    slide.style.display = 'none';
                }
            });
            
            // Update swiper
            swiperInstance.update();
        });
    });
    
    // Set first button as active by default
    if (filterButtons.length > 0) {
        filterButtons[0].classList.add('active');
    }
}

// Setup filters for all sections
setupFilters('cars', carSwiper);
setupFilters('yachts', yachtSwiper);
setupFilters('planes', planeSwiper);
setupFilters('properties', propertySwiper);

// Modal Functionality - Enhanced with Booking Calendar Integration
function openModal(itemName = '') {
    // Try to find item and open booking calendar
    if (itemName && window.contentManager && window.contentManager.inventory) {
        for (const category of Object.values(window.contentManager.inventory.categories)) {
            const item = category.items.find(item => item.name === itemName);
            if (item && window.bookingCalendar) {
                window.bookingCalendar.openCalendar(item.id);
                return;
            }
        }
    }

    // Fallback to original modal for general inquiries
    const modal = document.getElementById('booking-modal');
    const title = document.getElementById('modal-title');

    if (itemName) {
        title.textContent = `Reserve ${itemName}`;
    } else {
        title.textContent = 'Request VVIP Consultation';
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

// Show item details function for enhanced cards
function showItemDetails(itemId) {
    if (window.contentManager) {
        window.contentManager.showItemDetails(itemId);
    }
}

function closeModal() {
    const modal = document.getElementById('booking-modal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto'; // Restore scrolling
}

// Close modal when clicking outside
document.getElementById('booking-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Contact Form Submission with Backend Integration
document.getElementById('contact-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    // Show loading state
    const submitButton = this.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Sending...';
    submitButton.disabled = true;

    try {
        // Get form data
        const formData = new FormData(this);
        const data = Object.fromEntries(formData);

        // Add honeypot field for spam protection
        data.honeypot = '';

        // Send to Netlify function
        const response = await fetch('/.netlify/functions/contact-form', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Show success message
            showNotification('success', result.message || 'Thank you for your inquiry! Our VVIP concierge team will contact you within 2 hours.');

            // Reset form
            this.reset();
        } else {
            throw new Error(result.error || 'Failed to submit form');
        }

    } catch (error) {
        console.error('Error submitting contact form:', error);
        showNotification('error', 'There was an error submitting your inquiry. Please try again or contact us directly at +971 123 456 789.');
    } finally {
        // Restore button state
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
});

// Modal Form Submission with Backend Integration
document.getElementById('modal-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    // Show loading state
    const submitButton = this.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Processing...';
    submitButton.disabled = true;

    try {
        // Get form data
        const formData = new FormData(this);
        const data = Object.fromEntries(formData);

        // Add the selected item from modal title
        const modalTitle = document.getElementById('modal-title').textContent;
        data.item = modalTitle.replace('Reserve ', '').replace('Request VVIP Consultation', 'General Inquiry');

        // Add honeypot field for spam protection
        data.honeypot = '';

        // Send to Netlify function
        const response = await fetch('/.netlify/functions/reservation-form', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Show success message
            showNotification('success', result.message || 'Your reservation request has been submitted with PRIORITY status!');

            // Close modal and reset form
            closeModal();
            this.reset();
        } else {
            throw new Error(result.error || 'Failed to submit reservation');
        }

    } catch (error) {
        console.error('Error submitting reservation:', error);
        showNotification('error', 'There was an error submitting your reservation. Please contact our concierge team directly at +971 123 456 789.');
    } finally {
        // Restore button state
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
});

// Smooth scrolling for navigation links
document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all fade-in elements
document.querySelectorAll('.fade-in').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Loading animation for images
document.querySelectorAll('img').forEach(img => {
    img.addEventListener('load', function() {
        this.style.opacity = '1';
    });
    
    // If image is already loaded
    if (img.complete) {
        img.style.opacity = '1';
    }
});

// Notification System
function showNotification(type, message) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${type === 'success' ? '✅' : '❌'}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
        background: ${type === 'success' ? '#1a5f1a' : '#8B0000'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        border: 2px solid #D4AF37;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideInRight 0.3s ease-out;
    `;

    // Add to page
    document.body.appendChild(notification);

    // Auto-remove after 8 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }
    }, 8000);
}

// Add notification animations to CSS
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .notification-icon {
        font-size: 18px;
    }
    .notification-message {
        flex: 1;
        font-size: 14px;
        line-height: 1.4;
    }
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s;
    }
    .notification-close:hover {
        background-color: rgba(255,255,255,0.2);
    }
`;
document.head.appendChild(notificationStyles);

// Rate limiting for form submissions
const formSubmissionTracker = {
    submissions: [],
    maxSubmissions: 3,
    timeWindow: 300000, // 5 minutes

    canSubmit() {
        const now = Date.now();
        // Remove old submissions outside time window
        this.submissions = this.submissions.filter(time => now - time < this.timeWindow);

        if (this.submissions.length >= this.maxSubmissions) {
            showNotification('error', 'Too many submissions. Please wait 5 minutes before trying again.');
            return false;
        }

        this.submissions.push(now);
        return true;
    }
};

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Midas Lifestyle website loaded successfully');

    // Add honeypot fields to forms for spam protection
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const honeypot = document.createElement('input');
        honeypot.type = 'text';
        honeypot.name = 'honeypot';
        honeypot.style.cssText = 'position: absolute; left: -9999px; opacity: 0; pointer-events: none;';
        honeypot.tabIndex = -1;
        honeypot.autocomplete = 'off';
        form.appendChild(honeypot);
    });

    // Preload hero images for better performance
    const heroImages = [
        'https://source.unsplash.com/random/1920x1080?bugatti',
        'https://source.unsplash.com/random/1920x1080?superyacht',
        'https://source.unsplash.com/random/1920x1080?private-jet',
        'https://source.unsplash.com/random/1920x1080?luxury-villa'
    ];

    heroImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });

    // Initialize form validation
    initializeFormValidation();
});

// Enhanced form validation
function initializeFormValidation() {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea, select');

        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });

            input.addEventListener('input', function() {
                // Clear error state on input
                this.classList.remove('error');
                const errorMsg = this.parentElement.querySelector('.error-message');
                if (errorMsg) errorMsg.remove();
            });
        });
    });
}

function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    // Required field validation
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'This field is required';
    }

    // Email validation
    if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        }
    }

    // Phone validation (basic)
    if (field.type === 'tel' && value) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
            isValid = false;
            errorMessage = 'Please enter a valid phone number';
        }
    }

    // Message length validation
    if (field.tagName === 'TEXTAREA' && value && value.length < 10) {
        isValid = false;
        errorMessage = 'Message must be at least 10 characters long';
    }

    // Update field appearance
    if (!isValid) {
        field.classList.add('error');
        showFieldError(field, errorMessage);
    } else {
        field.classList.remove('error');
        clearFieldError(field);
    }

    return isValid;
}

function showFieldError(field, message) {
    clearFieldError(field);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = 'color: #ff6b6b; font-size: 12px; margin-top: 5px;';
    field.parentElement.appendChild(errorDiv);
}

function clearFieldError(field) {
    const errorMsg = field.parentElement.querySelector('.error-message');
    if (errorMsg) errorMsg.remove();
}
