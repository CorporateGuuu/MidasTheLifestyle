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

// Modal Functionality
function openModal(itemName = '') {
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

// Contact Form Submission
document.getElementById('contact-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(this);
    const data = Object.fromEntries(formData);
    
    // Show success message
    alert('Thank you for your inquiry! Our VVIP concierge team will contact you shortly.');
    
    // Reset form
    this.reset();
    
    // Here you would typically send the data to your server
    console.log('Contact form data:', data);
});

// Modal Form Submission
document.getElementById('modal-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(this);
    const data = Object.fromEntries(formData);
    
    // Show success message
    alert('Your reservation request has been submitted! Our concierge will confirm shortly.');
    
    // Close modal and reset form
    closeModal();
    this.reset();
    
    // Here you would typically send the data to your server
    console.log('Reservation form data:', data);
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

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Midas Lifestyle website loaded successfully');
    
    // Add any additional initialization here
    
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
});
