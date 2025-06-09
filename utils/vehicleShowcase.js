// Enhanced Vehicle Showcase System
// Luxury vehicle carousel with specifications and animations

class VehicleShowcase {
  constructor() {
    this.currentVehicle = 0;
    this.vehicles = this.initializeVehicleData();
    this.autoPlayInterval = null;
    this.autoPlayDelay = 5000;
    this.isPlaying = true;
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.init();
  }

  // Initialize vehicle data
  initializeVehicleData() {
    return [
      {
        id: 'bugatti-chiron',
        name: 'Bugatti Chiron',
        category: 'Hypercar',
        price: 'AED 20,000/day',
        image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1920&h=1080&fit=crop&crop=center&auto=format&q=85&ixlib=rb-4.0.3',
        specs: {
          power: '1,479 HP',
          topSpeed: '420 km/h',
          acceleration: '0-100 in 2.4s',
          engine: '8.0L Quad-Turbo W16'
        },
        features: ['Carbon Fiber Body', 'Luxury Interior', 'Advanced Aerodynamics'],
        description: 'The pinnacle of automotive engineering and luxury'
      },
      {
        id: 'koenigsegg-jesko',
        name: 'Koenigsegg Jesko',
        category: 'Hypercar',
        price: 'AED 22,000/day',
        image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1920&h=1080&fit=crop&crop=center&auto=format&q=85&ixlib=rb-4.0.3',
        specs: {
          power: '1,600 HP',
          topSpeed: '480+ km/h',
          acceleration: '0-100 in 2.5s',
          engine: '5.0L Twin-Turbo V8'
        },
        features: ['Track-Focused Design', 'Active Aerodynamics', 'Lightweight Construction'],
        description: 'Swedish engineering excellence meets extreme performance'
      },
      {
        id: 'mclaren-p1',
        name: 'McLaren P1',
        category: 'Hypercar',
        price: 'AED 18,000/day',
        image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1920&h=1080&fit=crop&crop=center&auto=format&q=85&ixlib=rb-4.0.3',
        specs: {
          power: '903 HP',
          topSpeed: '350 km/h',
          acceleration: '0-100 in 2.8s',
          engine: '3.8L Twin-Turbo V8 + Electric'
        },
        features: ['Hybrid Technology', 'F1 Heritage', 'Active Suspension'],
        description: 'Formula 1 technology meets road-going luxury'
      },
      {
        id: 'rolls-royce-phantom',
        name: 'Rolls-Royce Phantom',
        category: 'Luxury Sedan',
        price: 'AED 9,000/day',
        image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=1920&h=1080&fit=crop&crop=center&auto=format&q=85&ixlib=rb-4.0.3',
        specs: {
          power: '563 HP',
          topSpeed: '250 km/h',
          acceleration: '0-100 in 5.3s',
          engine: '6.75L Twin-Turbo V12'
        },
        features: ['Starlight Headliner', 'Whisper Quiet Cabin', 'Bespoke Craftsmanship'],
        description: 'The ultimate expression of luxury and refinement'
      },
      {
        id: 'bentley-mulsanne',
        name: 'Bentley Mulsanne',
        category: 'Luxury Sedan',
        price: 'AED 7,500/day',
        image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1920&h=1080&fit=crop&crop=center&auto=format&q=85&ixlib=rb-4.0.3',
        specs: {
          power: '505 HP',
          topSpeed: '296 km/h',
          acceleration: '0-100 in 5.1s',
          engine: '6.75L Twin-Turbo V8'
        },
        features: ['Handcrafted Interior', 'British Heritage', 'Mulliner Customization'],
        description: 'British luxury craftsmanship at its finest'
      }
    ];
  }

  // Initialize showcase
  init() {
    this.createShowcaseHTML();
    this.setupEventListeners();
    this.startAutoPlay();
    this.updateVehicleDisplay();
    console.log('🚗 Vehicle Showcase initialized');
  }

  // Create showcase HTML
  createShowcaseHTML() {
    const showcaseHTML = `
      <div id="vehicle-showcase" class="vehicle-showcase">
        <div class="showcase-container">
          <!-- Vehicle Display -->
          <div class="vehicle-display">
            <div class="vehicle-image-container">
              <img id="showcase-image" class="vehicle-image" src="" alt="" loading="eager">
              <div class="image-overlay">
                <div class="vehicle-category" id="showcase-category"></div>
                <div class="vehicle-name" id="showcase-name"></div>
                <div class="vehicle-price" id="showcase-price"></div>
              </div>
            </div>
          </div>

          <!-- Vehicle Information -->
          <div class="vehicle-info-panel">
            <div class="specs-container">
              <h3>Specifications</h3>
              <div class="specs-grid" id="showcase-specs"></div>
            </div>
            
            <div class="features-container">
              <h3>Key Features</h3>
              <ul class="features-list" id="showcase-features"></ul>
            </div>
            
            <div class="description-container">
              <p class="vehicle-description" id="showcase-description"></p>
            </div>

            <div class="action-buttons">
              <button class="showcase-btn primary" onclick="bookingSystem.openBookingModal(vehicleShowcase.getCurrentVehicleId())">
                Reserve Now
              </button>
              <button class="showcase-btn secondary" onclick="vehicleShowcase.showVehicleDetails()">
                View Details
              </button>
            </div>
          </div>

          <!-- Navigation Controls -->
          <div class="showcase-navigation">
            <button class="nav-arrow prev" onclick="vehicleShowcase.previousVehicle()">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            
            <div class="vehicle-indicators" id="showcase-indicators"></div>
            
            <button class="nav-arrow next" onclick="vehicleShowcase.nextVehicle()">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>

          <!-- Auto-play Controls -->
          <div class="autoplay-controls">
            <button class="autoplay-btn" onclick="vehicleShowcase.toggleAutoPlay()" id="autoplay-toggle">
              <svg class="w-5 h-5 play-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6l5-3-5-3z"></path>
              </svg>
              <svg class="w-5 h-5 pause-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="display: none;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;

    // Insert after hero section
    const heroSection = document.getElementById('home');
    if (heroSection) {
      heroSection.insertAdjacentHTML('afterend', showcaseHTML);
    }

    this.createIndicators();
  }

  // Create navigation indicators
  createIndicators() {
    const indicatorsContainer = document.getElementById('showcase-indicators');
    if (!indicatorsContainer) return;

    indicatorsContainer.innerHTML = this.vehicles.map((_, index) => `
      <button class="indicator ${index === 0 ? 'active' : ''}" 
              onclick="vehicleShowcase.goToVehicle(${index})"
              data-index="${index}">
      </button>
    `).join('');
  }

  // Setup event listeners
  setupEventListeners() {
    // Touch events for mobile
    const showcase = document.getElementById('vehicle-showcase');
    if (showcase) {
      showcase.addEventListener('touchstart', (e) => {
        this.touchStartX = e.changedTouches[0].screenX;
      });

      showcase.addEventListener('touchend', (e) => {
        this.touchEndX = e.changedTouches[0].screenX;
        this.handleSwipe();
      });

      // Pause autoplay on hover
      showcase.addEventListener('mouseenter', () => {
        this.pauseAutoPlay();
      });

      showcase.addEventListener('mouseleave', () => {
        if (this.isPlaying) {
          this.startAutoPlay();
        }
      });
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        this.previousVehicle();
      } else if (e.key === 'ArrowRight') {
        this.nextVehicle();
      } else if (e.key === ' ') {
        e.preventDefault();
        this.toggleAutoPlay();
      }
    });
  }

  // Handle swipe gestures
  handleSwipe() {
    const swipeThreshold = 50;
    const diff = this.touchStartX - this.touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        this.nextVehicle();
      } else {
        this.previousVehicle();
      }
    }
  }

  // Navigation methods
  nextVehicle() {
    this.currentVehicle = (this.currentVehicle + 1) % this.vehicles.length;
    this.updateVehicleDisplay();
    this.resetAutoPlay();
  }

  previousVehicle() {
    this.currentVehicle = this.currentVehicle === 0 ? this.vehicles.length - 1 : this.currentVehicle - 1;
    this.updateVehicleDisplay();
    this.resetAutoPlay();
  }

  goToVehicle(index) {
    if (index >= 0 && index < this.vehicles.length) {
      this.currentVehicle = index;
      this.updateVehicleDisplay();
      this.resetAutoPlay();
    }
  }

  // Update vehicle display
  updateVehicleDisplay() {
    const vehicle = this.vehicles[this.currentVehicle];
    if (!vehicle) return;

    // Update image with fade effect
    const imageElement = document.getElementById('showcase-image');
    if (imageElement) {
      imageElement.style.opacity = '0';
      setTimeout(() => {
        imageElement.src = vehicle.image;
        imageElement.alt = vehicle.name;
        imageElement.style.opacity = '1';
      }, 150);
    }

    // Update text content
    this.updateElement('showcase-category', vehicle.category);
    this.updateElement('showcase-name', vehicle.name);
    this.updateElement('showcase-price', vehicle.price);
    this.updateElement('showcase-description', vehicle.description);

    // Update specifications
    this.updateSpecs(vehicle.specs);
    this.updateFeatures(vehicle.features);
    this.updateIndicators();
  }

  // Update element content
  updateElement(id, content) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = content;
    }
  }

  // Update specifications
  updateSpecs(specs) {
    const specsContainer = document.getElementById('showcase-specs');
    if (!specsContainer) return;

    specsContainer.innerHTML = Object.entries(specs).map(([key, value]) => `
      <div class="spec-item">
        <span class="spec-label">${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
        <span class="spec-value">${value}</span>
      </div>
    `).join('');
  }

  // Update features
  updateFeatures(features) {
    const featuresContainer = document.getElementById('showcase-features');
    if (!featuresContainer) return;

    featuresContainer.innerHTML = features.map(feature => `
      <li class="feature-item">${feature}</li>
    `).join('');
  }

  // Update indicators
  updateIndicators() {
    const indicators = document.querySelectorAll('.indicator');
    indicators.forEach((indicator, index) => {
      indicator.classList.toggle('active', index === this.currentVehicle);
    });
  }

  // Auto-play functionality
  startAutoPlay() {
    this.stopAutoPlay();
    this.autoPlayInterval = setInterval(() => {
      this.nextVehicle();
    }, this.autoPlayDelay);
    this.updateAutoPlayButton(true);
  }

  stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }

  pauseAutoPlay() {
    this.stopAutoPlay();
  }

  resetAutoPlay() {
    if (this.isPlaying) {
      this.startAutoPlay();
    }
  }

  toggleAutoPlay() {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      this.startAutoPlay();
    } else {
      this.stopAutoPlay();
    }
    this.updateAutoPlayButton(this.isPlaying);
  }

  updateAutoPlayButton(playing) {
    const playIcon = document.querySelector('.play-icon');
    const pauseIcon = document.querySelector('.pause-icon');
    
    if (playIcon && pauseIcon) {
      playIcon.style.display = playing ? 'none' : 'block';
      pauseIcon.style.display = playing ? 'block' : 'none';
    }
  }

  // Get current vehicle ID
  getCurrentVehicleId() {
    return this.vehicles[this.currentVehicle]?.id;
  }

  // Show vehicle details
  showVehicleDetails() {
    const vehicle = this.vehicles[this.currentVehicle];
    if (vehicle && window.openModal) {
      window.openModal(vehicle.name);
    }
  }
}

// Initialize Vehicle Showcase
document.addEventListener('DOMContentLoaded', () => {
  window.vehicleShowcase = new VehicleShowcase();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VehicleShowcase;
}
