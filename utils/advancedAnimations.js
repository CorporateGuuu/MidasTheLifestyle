// Advanced Animation System for Midas The Lifestyle
// Sophisticated loading animations and luxury-themed effects

class AdvancedAnimations {
  constructor() {
    this.isInitialized = false;
    this.observers = new Map();
    this.loadingStates = new Map();
    this.init();
  }

  // Initialize animation system
  init() {
    this.setupIntersectionObserver();
    this.setupPageTransitions();
    this.setupLoadingAnimations();
    this.setupParallaxEffects();
    this.isInitialized = true;
    console.log('✨ Advanced Animation System initialized');
  }

  // Setup intersection observer for scroll animations
  setupIntersectionObserver() {
    const observerOptions = {
      threshold: [0.1, 0.3, 0.5, 0.7, 0.9],
      rootMargin: '0px 0px -50px 0px'
    };

    this.scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.triggerScrollAnimation(entry.target, entry.intersectionRatio);
        }
      });
    }, observerOptions);

    // Observe all animatable elements
    this.observeElements();
  }

  // Observe elements for scroll animations
  observeElements() {
    const animatableSelectors = [
      '.fade-in',
      '.slide-up',
      '.slide-left',
      '.slide-right',
      '.scale-in',
      '.luxury-reveal',
      '.stagger-children'
    ];

    animatableSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        this.scrollObserver.observe(element);
      });
    });
  }

  // Trigger scroll-based animations
  triggerScrollAnimation(element, ratio) {
    const animationType = this.getAnimationType(element);
    
    switch (animationType) {
      case 'fade-in':
        this.animateFadeIn(element, ratio);
        break;
      case 'slide-up':
        this.animateSlideUp(element, ratio);
        break;
      case 'slide-left':
        this.animateSlideLeft(element, ratio);
        break;
      case 'slide-right':
        this.animateSlideRight(element, ratio);
        break;
      case 'scale-in':
        this.animateScaleIn(element, ratio);
        break;
      case 'luxury-reveal':
        this.animateLuxuryReveal(element, ratio);
        break;
      case 'stagger-children':
        this.animateStaggerChildren(element, ratio);
        break;
    }
  }

  // Get animation type from element classes
  getAnimationType(element) {
    const classes = element.classList;
    if (classes.contains('fade-in')) return 'fade-in';
    if (classes.contains('slide-up')) return 'slide-up';
    if (classes.contains('slide-left')) return 'slide-left';
    if (classes.contains('slide-right')) return 'slide-right';
    if (classes.contains('scale-in')) return 'scale-in';
    if (classes.contains('luxury-reveal')) return 'luxury-reveal';
    if (classes.contains('stagger-children')) return 'stagger-children';
    return 'fade-in'; // default
  }

  // Animation methods
  animateFadeIn(element, ratio) {
    const opacity = Math.min(ratio * 2, 1);
    element.style.opacity = opacity;
    element.style.transform = `translateY(${(1 - ratio) * 30}px)`;
  }

  animateSlideUp(element, ratio) {
    const translateY = (1 - ratio) * 50;
    const opacity = Math.min(ratio * 2, 1);
    element.style.transform = `translateY(${translateY}px)`;
    element.style.opacity = opacity;
  }

  animateSlideLeft(element, ratio) {
    const translateX = (1 - ratio) * 50;
    const opacity = Math.min(ratio * 2, 1);
    element.style.transform = `translateX(${translateX}px)`;
    element.style.opacity = opacity;
  }

  animateSlideRight(element, ratio) {
    const translateX = (ratio - 1) * 50;
    const opacity = Math.min(ratio * 2, 1);
    element.style.transform = `translateX(${translateX}px)`;
    element.style.opacity = opacity;
  }

  animateScaleIn(element, ratio) {
    const scale = 0.8 + (ratio * 0.2);
    const opacity = Math.min(ratio * 2, 1);
    element.style.transform = `scale(${scale})`;
    element.style.opacity = opacity;
  }

  animateLuxuryReveal(element, ratio) {
    const scale = 0.9 + (ratio * 0.1);
    const opacity = Math.min(ratio * 1.5, 1);
    const blur = (1 - ratio) * 5;
    element.style.transform = `scale(${scale})`;
    element.style.opacity = opacity;
    element.style.filter = `blur(${blur}px)`;
  }

  animateStaggerChildren(element, ratio) {
    const children = element.children;
    Array.from(children).forEach((child, index) => {
      const delay = index * 100;
      const childRatio = Math.max(0, ratio - (index * 0.1));
      setTimeout(() => {
        this.animateFadeIn(child, childRatio);
      }, delay);
    });
  }

  // Setup page transitions
  setupPageTransitions() {
    // Smooth page transitions for SPA-like experience
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (link) {
        e.preventDefault();
        this.smoothScrollToSection(link.getAttribute('href'));
      }
    });
  }

  // Smooth scroll to section with luxury animation
  smoothScrollToSection(targetId) {
    const target = document.querySelector(targetId);
    if (!target) return;

    // Add loading overlay
    this.showPageTransition();

    // Smooth scroll
    target.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

    // Remove loading overlay after scroll
    setTimeout(() => {
      this.hidePageTransition();
    }, 800);
  }

  // Show page transition overlay
  showPageTransition() {
    const overlay = document.createElement('div');
    overlay.className = 'page-transition-overlay';
    overlay.innerHTML = `
      <div class="luxury-loader-container">
        <div class="luxury-loader"></div>
        <div class="loader-text">Midas The Lifestyle</div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
    });
  }

  // Hide page transition overlay
  hidePageTransition() {
    const overlay = document.querySelector('.page-transition-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.remove();
      }, 300);
    }
  }

  // Setup loading animations for various states
  setupLoadingAnimations() {
    this.createLoadingTemplates();
  }

  // Create loading animation templates
  createLoadingTemplates() {
    const style = document.createElement('style');
    style.textContent = `
      .page-transition-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, rgba(0,0,0,0.9), rgba(26,26,26,0.9));
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
        backdrop-filter: blur(10px);
      }

      .luxury-loader-container {
        text-align: center;
        color: #D4AF37;
      }

      .luxury-loader {
        width: 60px;
        height: 60px;
        border: 3px solid rgba(212, 175, 55, 0.3);
        border-radius: 50%;
        border-top-color: #D4AF37;
        animation: luxurySpinGlow 1.5s ease-in-out infinite;
        margin: 0 auto 20px;
      }

      .loader-text {
        font-family: 'Playfair Display', serif;
        font-size: 18px;
        font-weight: 700;
        letter-spacing: 2px;
        animation: luxuryPulse 2s ease-in-out infinite;
      }

      @keyframes luxurySpinGlow {
        0% { 
          transform: rotate(0deg);
          box-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
        }
        50% {
          box-shadow: 0 0 40px rgba(212, 175, 55, 0.6);
        }
        100% { 
          transform: rotate(360deg);
          box-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
        }
      }

      @keyframes luxuryPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }

      .image-loading {
        position: relative;
        overflow: hidden;
      }

      .image-loading::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.3), transparent);
        animation: shimmer 2s infinite;
      }

      @keyframes shimmer {
        0% { left: -100%; }
        100% { left: 100%; }
      }
    `;
    document.head.appendChild(style);
  }

  // Setup parallax effects
  setupParallaxEffects() {
    window.addEventListener('scroll', () => {
      this.updateParallaxElements();
    });
  }

  // Update parallax elements on scroll
  updateParallaxElements() {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.parallax-element');
    
    parallaxElements.forEach(element => {
      const speed = element.dataset.speed || 0.5;
      const yPos = -(scrolled * speed);
      element.style.transform = `translateY(${yPos}px)`;
    });
  }

  // Show loading state for specific element
  showLoadingState(elementId, type = 'default') {
    const element = document.getElementById(elementId);
    if (!element) return;

    this.loadingStates.set(elementId, type);
    element.classList.add('loading-state');

    switch (type) {
      case 'image':
        this.showImageLoading(element);
        break;
      case 'form':
        this.showFormLoading(element);
        break;
      case 'data':
        this.showDataLoading(element);
        break;
      default:
        this.showDefaultLoading(element);
    }
  }

  // Hide loading state
  hideLoadingState(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.classList.remove('loading-state');
    this.loadingStates.delete(elementId);
    
    // Remove loading overlay
    const overlay = element.querySelector('.loading-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  // Show image loading animation
  showImageLoading(element) {
    element.classList.add('image-loading');
  }

  // Show form loading animation
  showFormLoading(element) {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="luxury-loader"></div>
      <div class="loading-text">Processing...</div>
    `;
    element.appendChild(overlay);
  }

  // Show data loading animation
  showDataLoading(element) {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="luxury-loader"></div>
      <div class="loading-text">Loading luxury experiences...</div>
    `;
    element.appendChild(overlay);
  }

  // Show default loading animation
  showDefaultLoading(element) {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `<div class="luxury-loader"></div>`;
    element.appendChild(overlay);
  }

  // Trigger luxury entrance animation for new elements
  triggerEntranceAnimation(element, type = 'fadeIn') {
    element.style.opacity = '0';
    element.style.transform = 'translateY(30px)';
    
    requestAnimationFrame(() => {
      element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    });
  }
}

// Initialize advanced animations
const advancedAnimations = new AdvancedAnimations();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdvancedAnimations;
} else {
  window.AdvancedAnimations = AdvancedAnimations;
  window.advancedAnimations = advancedAnimations;
}
