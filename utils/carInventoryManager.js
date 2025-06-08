// Car Inventory Manager for Midas The Lifestyle
// Manages dynamic loading and display of luxury car inventory

class CarInventoryManager {
    constructor() {
        this.inventory = null;
        this.currentFilter = 'all';
        this.currentSort = 'name';
        this.searchQuery = '';
        this.swiperInstance = null;
        this.favorites = this.loadFavorites();
        this.comparisonList = [];
        this.availabilityCache = new Map();
        this.init();
    }

    async init() {
        try {
            await this.loadInventory();
            this.setupEventListeners();
            this.setupAdvancedControls();
            this.renderCarCards();
            this.initializeAvailabilityChecking();
            console.log('Car Inventory Manager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Car Inventory Manager:', error);
            // Fallback to static content if dynamic loading fails
        }
    }

    async loadInventory() {
        try {
            const response = await fetch('/data/inventory.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.inventory = data.categories.cars;
            return this.inventory;
        } catch (error) {
            console.error('Error loading inventory:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Setup filter buttons
        const filterButtons = document.querySelectorAll('#cars .filter-btn[data-type]');
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleFilterClick(e.target);
            });
        });
    }

    handleFilterClick(button) {
        const filterType = button.getAttribute('data-type');
        
        // Update active button
        const allFilterButtons = document.querySelectorAll('#cars .filter-btn[data-type]');
        allFilterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Update current filter
        this.currentFilter = filterType;
        
        // Filter and update display
        this.filterCars(filterType);
    }

    filterCars(filterType) {
        const carSlides = document.querySelectorAll('#cars .swiper-slide[data-type]');
        
        carSlides.forEach(slide => {
            if (filterType === 'all' || slide.getAttribute('data-type') === filterType) {
                slide.style.display = 'block';
            } else {
                slide.style.display = 'none';
            }
        });

        // Update swiper if available
        if (window.carSwiper) {
            window.carSwiper.update();
        }
    }

    renderCarCards() {
        if (!this.inventory || !this.inventory.items) {
            console.warn('No inventory data available for rendering');
            return;
        }

        const swiperWrapper = document.querySelector('#cars .swiper-wrapper');
        if (!swiperWrapper) {
            console.warn('Swiper wrapper not found');
            return;
        }

        // Clear existing content
        swiperWrapper.innerHTML = '';

        // Render each car
        this.inventory.items.forEach(car => {
            const carCard = this.createCarCard(car);
            swiperWrapper.appendChild(carCard);
        });

        // Reinitialize swiper if needed
        this.reinitializeSwiper();
    }

    createCarCard(car) {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide card';
        slide.setAttribute('data-type', car.category);

        // Generate image URL (using placeholder service for now)
        const imageUrl = this.generateImageUrl(car);
        
        // Format pricing
        const pricing = this.formatPricing(car.pricing);

        slide.innerHTML = `
            <img src="${imageUrl}" alt="${car.name}" loading="lazy">
            <div class="p-6">
                <h3 class="text-2xl font-semibold gold-accent">${car.name}</h3>
                <p class="text-white mb-2">${pricing}</p>
                <div class="text-sm text-gray-300 mb-3">
                    <div>${car.specifications.horsepower} HP • ${car.specifications.topSpeed}</div>
                    <div class="text-xs">${car.specifications.engine}</div>
                </div>
                <div class="flex justify-between items-center">
                    <button onclick="openModal('${car.name}')" class="text-[#D4AF37] hover:underline font-semibold">
                        Reserve Now
                    </button>
                    <button onclick="carInventoryManager.showCarDetails('${car.id}')" class="text-gray-400 hover:text-[#D4AF37] text-sm">
                        Details
                    </button>
                </div>
            </div>
        `;

        return slide;
    }

    generateImageUrl(car, type = 'hero') {
        // Use the image manager if available
        if (window.imageManager) {
            return window.imageManager.getCarImage(car.id, type);
        }

        // Fallback to high-quality Unsplash images with specific search terms
        const searchTerms = {
            'bugatti-chiron-001': 'bugatti-chiron-luxury-supercar',
            'koenigsegg-jesko-001': 'koenigsegg-jesko-hypercar',
            'ferrari-sf90-stradale-001': 'ferrari-sf90-stradale-hybrid',
            'lamborghini-huracan-evo-001': 'lamborghini-huracan-evo-supercar',
            'mclaren-720s-001': 'mclaren-720s-supercar',
            'bentley-continental-gt-001': 'bentley-continental-gt-luxury',
            'rolls-royce-phantom-001': 'rolls-royce-phantom-luxury-sedan',
            'aston-martin-db11-001': 'aston-martin-db11-luxury-coupe',
            'bentley-bentayga-001': 'bentley-bentayga-luxury-suv',
            'lamborghini-urus-001': 'lamborghini-urus-super-suv',
            'mercedes-maybach-s680-001': 'mercedes-maybach-s680-luxury',
            'rolls-royce-cullinan-001': 'rolls-royce-cullinan-luxury-suv'
        };

        const searchTerm = searchTerms[car.id] || `${car.brand.toLowerCase().replace(/\s+/g, '-')}-luxury-car`;
        return `https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=600&fit=crop&crop=center&auto=format&q=80&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D`;
    }

    formatPricing(pricing) {
        if (pricing.daily) {
            return `AED ${pricing.daily.aed.toLocaleString()}/day | $${pricing.daily.usd.toLocaleString()}/day`;
        }
        return 'Price on request';
    }

    showCarDetails(carId) {
        const car = this.inventory.items.find(item => item.id === carId);
        if (!car) {
            console.error('Car not found:', carId);
            return;
        }

        // Create and show detailed modal
        this.createDetailModal(car);
    }

    createDetailModal(car) {
        // Remove existing detail modal if any
        const existingModal = document.getElementById('car-detail-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'car-detail-modal';
        modal.className = 'modal';
        
        const features = car.features.map(feature => `<li>• ${feature}</li>`).join('');
        const locations = car.availability.locations.join(', ');

        modal.innerHTML = `
            <div class="modal-content max-w-4xl">
                <button class="modal-close absolute top-4 right-4 text-2xl text-gray-400 hover:text-white" onclick="this.parentElement.parentElement.remove()">×</button>
                
                <div class="grid md:grid-cols-2 gap-8">
                    <div>
                        <img src="${this.generateImageUrl(car)}" alt="${car.name}" class="w-full h-64 object-cover rounded-lg mb-4">
                        <h2 class="text-3xl font-bold gold-accent mb-2">${car.name}</h2>
                        <p class="text-xl text-white mb-4">${this.formatPricing(car.pricing)}</p>
                        
                        <div class="bg-gray-900 p-4 rounded-lg mb-4">
                            <h3 class="text-lg font-semibold gold-accent mb-2">Specifications</h3>
                            <div class="grid grid-cols-2 gap-2 text-sm">
                                <div><span class="text-gray-400">Engine:</span> ${car.specifications.engine}</div>
                                <div><span class="text-gray-400">Power:</span> ${car.specifications.horsepower} HP</div>
                                <div><span class="text-gray-400">Top Speed:</span> ${car.specifications.topSpeed}</div>
                                <div><span class="text-gray-400">Brand:</span> ${car.brand}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h3 class="text-lg font-semibold gold-accent mb-3">Premium Features</h3>
                        <ul class="text-gray-300 space-y-1 mb-6 text-sm">
                            ${features}
                        </ul>
                        
                        <h3 class="text-lg font-semibold gold-accent mb-3">Available Locations</h3>
                        <p class="text-gray-300 mb-6 text-sm">${locations}</p>
                        
                        <div class="space-y-3">
                            <button onclick="openModal('${car.name}')" class="w-full bg-[#D4AF37] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#E8C96A] transition-all">
                                Reserve This Vehicle
                            </button>
                            <button onclick="this.parentElement.parentElement.parentElement.parentElement.remove()" class="w-full bg-transparent border border-[#D4AF37] text-[#D4AF37] px-6 py-3 rounded-lg font-semibold hover:bg-[#D4AF37] hover:text-black transition-all">
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                document.body.style.overflow = 'auto';
            }
        });
    }

    reinitializeSwiper() {
        // Destroy existing swiper if it exists
        if (window.carSwiper && window.carSwiper.destroy) {
            window.carSwiper.destroy(true, true);
        }

        // Reinitialize swiper
        setTimeout(() => {
            window.carSwiper = new Swiper('.car-slider', {
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
        }, 100);
    }

    // Public method to get car by ID
    getCarById(carId) {
        if (!this.inventory || !this.inventory.items) return null;
        return this.inventory.items.find(item => item.id === carId);
    }

    // Public method to get cars by category
    getCarsByCategory(category) {
        if (!this.inventory || !this.inventory.items) return [];
        if (category === 'all') return this.inventory.items;
        return this.inventory.items.filter(item => item.category === category);
    }

    // Advanced Controls Setup
    setupAdvancedControls() {
        this.createAdvancedControlsUI();
        this.setupSearchFunctionality();
        this.setupSortFunctionality();
        this.setupComparisonFunctionality();
    }

    createAdvancedControlsUI() {
        const carsSection = document.querySelector('#cars');
        if (!carsSection) return;

        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'advanced-controls bg-gray-900 p-6 rounded-lg mb-8 border border-gray-700';
        controlsContainer.innerHTML = `
            <div class="grid md:grid-cols-4 gap-4 mb-4">
                <div class="search-container">
                    <label class="block text-sm font-medium text-[#D4AF37] mb-2">Search Vehicles</label>
                    <input type="text" id="car-search" placeholder="Search by name, brand..."
                           class="w-full p-3 bg-black text-white border border-[#D4AF37] rounded-lg focus:ring-2 focus:ring-[#D4AF37]">
                </div>
                <div class="sort-container">
                    <label class="block text-sm font-medium text-[#D4AF37] mb-2">Sort By</label>
                    <select id="car-sort" class="w-full p-3 bg-black text-white border border-[#D4AF37] rounded-lg focus:ring-2 focus:ring-[#D4AF37]">
                        <option value="name">Name (A-Z)</option>
                        <option value="price-low">Price (Low to High)</option>
                        <option value="price-high">Price (High to Low)</option>
                        <option value="power">Horsepower</option>
                        <option value="brand">Brand</option>
                    </select>
                </div>
                <div class="price-range-container">
                    <label class="block text-sm font-medium text-[#D4AF37] mb-2">Price Range (AED/day)</label>
                    <div class="flex gap-2">
                        <input type="number" id="price-min" placeholder="Min"
                               class="w-full p-3 bg-black text-white border border-[#D4AF37] rounded-lg focus:ring-2 focus:ring-[#D4AF37]">
                        <input type="number" id="price-max" placeholder="Max"
                               class="w-full p-3 bg-black text-white border border-[#D4AF37] rounded-lg focus:ring-2 focus:ring-[#D4AF37]">
                    </div>
                </div>
                <div class="actions-container flex flex-col justify-end">
                    <button id="clear-filters" class="bg-gray-700 text-white px-4 py-3 rounded-lg hover:bg-gray-600 transition-all mb-2">
                        Clear Filters
                    </button>
                    <button id="compare-vehicles" class="bg-[#D4AF37] text-black px-4 py-3 rounded-lg hover:bg-[#E8C96A] transition-all" disabled>
                        Compare (<span id="compare-count">0</span>)
                    </button>
                </div>
            </div>
            <div class="flex justify-between items-center">
                <div class="results-info">
                    <span id="results-count" class="text-gray-300">Showing all vehicles</span>
                </div>
                <div class="view-options">
                    <button id="toggle-favorites" class="text-[#D4AF37] hover:underline mr-4">
                        <span class="mr-1">⭐</span> My Favorites (<span id="favorites-count">${this.favorites.length}</span>)
                    </button>
                    <button id="availability-check" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all">
                        Check Real-time Availability
                    </button>
                </div>
            </div>
        `;

        // Insert after the filter buttons
        const filterContainer = carsSection.querySelector('.flex.justify-center.mb-8');
        if (filterContainer) {
            filterContainer.parentNode.insertBefore(controlsContainer, filterContainer.nextSibling);
        }
    }

    setupSearchFunctionality() {
        const searchInput = document.getElementById('car-search');
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.applyFiltersAndSort();
        });
    }

    setupSortFunctionality() {
        const sortSelect = document.getElementById('car-sort');
        const priceMinInput = document.getElementById('price-min');
        const priceMaxInput = document.getElementById('price-max');
        const clearFiltersBtn = document.getElementById('clear-filters');

        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.applyFiltersAndSort();
            });
        }

        if (priceMinInput && priceMaxInput) {
            [priceMinInput, priceMaxInput].forEach(input => {
                input.addEventListener('input', () => {
                    this.applyFiltersAndSort();
                });
            });
        }

        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }
    }

    setupComparisonFunctionality() {
        const compareBtn = document.getElementById('compare-vehicles');
        const favoritesBtn = document.getElementById('toggle-favorites');
        const availabilityBtn = document.getElementById('availability-check');

        if (compareBtn) {
            compareBtn.addEventListener('click', () => {
                this.showComparisonModal();
            });
        }

        if (favoritesBtn) {
            favoritesBtn.addEventListener('click', () => {
                this.toggleFavoritesView();
            });
        }

        if (availabilityBtn) {
            availabilityBtn.addEventListener('click', () => {
                this.checkRealTimeAvailability();
            });
        }
    }

    applyFiltersAndSort() {
        if (!this.inventory || !this.inventory.items) return;

        let filteredCars = [...this.inventory.items];

        // Apply category filter
        if (this.currentFilter !== 'all') {
            filteredCars = filteredCars.filter(car => car.category === this.currentFilter);
        }

        // Apply search filter
        if (this.searchQuery) {
            filteredCars = filteredCars.filter(car =>
                car.name.toLowerCase().includes(this.searchQuery) ||
                car.brand.toLowerCase().includes(this.searchQuery) ||
                car.specifications.engine.toLowerCase().includes(this.searchQuery)
            );
        }

        // Apply price range filter
        const priceMin = document.getElementById('price-min')?.value;
        const priceMax = document.getElementById('price-max')?.value;
        if (priceMin || priceMax) {
            filteredCars = filteredCars.filter(car => {
                const price = car.pricing.daily?.aed || 0;
                const min = priceMin ? parseInt(priceMin) : 0;
                const max = priceMax ? parseInt(priceMax) : Infinity;
                return price >= min && price <= max;
            });
        }

        // Apply sorting
        filteredCars = this.sortCars(filteredCars);

        // Update display
        this.renderFilteredCars(filteredCars);
        this.updateResultsCount(filteredCars.length);
    }

    sortCars(cars) {
        return cars.sort((a, b) => {
            switch (this.currentSort) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'price-low':
                    return (a.pricing.daily?.aed || 0) - (b.pricing.daily?.aed || 0);
                case 'price-high':
                    return (b.pricing.daily?.aed || 0) - (a.pricing.daily?.aed || 0);
                case 'power':
                    return (b.specifications.horsepower || 0) - (a.specifications.horsepower || 0);
                case 'brand':
                    return a.brand.localeCompare(b.brand);
                default:
                    return 0;
            }
        });
    }

    renderFilteredCars(cars) {
        const swiperWrapper = document.querySelector('#cars .swiper-wrapper');
        if (!swiperWrapper) return;

        swiperWrapper.innerHTML = '';

        cars.forEach(car => {
            const carCard = this.createEnhancedCarCard(car);
            swiperWrapper.appendChild(carCard);
        });

        this.reinitializeSwiper();
    }

    createEnhancedCarCard(car) {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide card enhanced-card';
        slide.setAttribute('data-type', car.category);
        slide.setAttribute('data-car-id', car.id);

        const imageUrl = this.generateImageUrl(car, 'hero');
        const pricing = this.formatPricing(car.pricing);
        const isFavorite = this.favorites.includes(car.id);
        const isInComparison = this.comparisonList.includes(car.id);
        const availabilityStatus = this.getAvailabilityStatus(car.id);

        slide.innerHTML = `
            <div class="relative car-image-container">
                <img src="${imageUrl}"
                     alt="${car.name} - Luxury ${car.category} rental"
                     loading="lazy"
                     class="w-full h-64 object-cover rounded-t-lg transition-transform duration-300 hover:scale-105"
                     data-fallback="car-default">
                <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                <div class="absolute top-3 right-3 flex gap-2">
                    <button onclick="carInventoryManager.toggleFavorite('${car.id}')"
                            class="favorite-btn p-2 rounded-full ${isFavorite ? 'bg-[#D4AF37] text-black' : 'bg-black bg-opacity-70 text-white'} hover:bg-[#D4AF37] hover:text-black transition-all backdrop-blur-sm">
                        ⭐
                    </button>
                    <button onclick="carInventoryManager.toggleComparison('${car.id}')"
                            class="compare-btn p-2 rounded-full ${isInComparison ? 'bg-[#D4AF37] text-black' : 'bg-black bg-opacity-70 text-white'} hover:bg-[#D4AF37] hover:text-black transition-all backdrop-blur-sm">
                        ⚖️
                    </button>
                    <button onclick="carInventoryManager.showImageGallery('${car.id}')"
                            class="gallery-btn p-2 rounded-full bg-black bg-opacity-70 text-white hover:bg-[#D4AF37] hover:text-black transition-all backdrop-blur-sm">
                        📷
                    </button>
                </div>
                <div class="absolute top-3 left-3">
                    <span class="availability-indicator px-2 py-1 rounded-full text-xs font-semibold ${availabilityStatus.class} backdrop-blur-sm">
                        ${availabilityStatus.text}
                    </span>
                </div>
                <div class="absolute bottom-3 left-3 right-3">
                    <div class="bg-black bg-opacity-70 backdrop-blur-sm rounded-lg p-2 text-white text-xs opacity-0 hover:opacity-100 transition-opacity duration-300">
                        <div class="flex justify-between items-center">
                            <span>Click for gallery</span>
                            <span>${this.getImageCount(car.id)} photos</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="p-6 bg-gradient-to-b from-gray-900 to-black">
                <h3 class="text-2xl font-semibold gold-accent mb-1">${car.name}</h3>
                <p class="text-gray-400 text-sm mb-2">${car.brand}</p>
                <p class="text-white mb-3 font-semibold">${pricing}</p>
                <div class="text-sm text-gray-300 mb-4">
                    <div class="flex justify-between items-center mb-1">
                        <span class="flex items-center gap-1">
                            <span class="text-[#D4AF37]">⚡</span>
                            ${car.specifications.horsepower} HP
                        </span>
                        <span class="flex items-center gap-1">
                            <span class="text-[#D4AF37]">🏁</span>
                            ${car.specifications.topSpeed}
                        </span>
                    </div>
                    <div class="text-xs text-gray-400 truncate" title="${car.specifications.engine}">
                        ${car.specifications.engine}
                    </div>
                </div>
                <div class="flex justify-between items-center">
                    <button onclick="carInventoryManager.openEnhancedBooking('${car.id}')"
                            class="bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#E8C96A] transition-all text-sm">
                        Reserve Now
                    </button>
                    <button onclick="carInventoryManager.showCarDetails('${car.id}')"
                            class="text-[#D4AF37] hover:text-[#E8C96A] text-sm font-medium transition-colors">
                        View Details
                    </button>
                </div>
            </div>
        `;

        return slide;
    }

    getImageCount(carId) {
        if (window.imageManager) {
            const gallery = window.imageManager.getCarGallery(carId);
            return gallery.length || 6;
        }
        return 6; // Default count
    }

    showImageGallery(carId) {
        const car = this.getCarById(carId);
        if (!car) return;

        this.createImageGalleryModal(car);
    }

    createImageGalleryModal(car) {
        const existingModal = document.getElementById('image-gallery-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = 'image-gallery-modal';
        modal.className = 'modal image-gallery-modal';

        let galleryImages = [];
        if (window.imageManager) {
            galleryImages = window.imageManager.getCarGallery(car.id);
        }

        // Fallback images if no gallery available
        if (galleryImages.length === 0) {
            galleryImages = [
                this.generateImageUrl(car, 'hero'),
                this.generateImageUrl(car, 'front'),
                this.generateImageUrl(car, 'side'),
                this.generateImageUrl(car, 'interior')
            ];
        }

        const imageSlides = galleryImages.map((src, index) => `
            <div class="swiper-slide">
                <img src="${src}"
                     alt="${car.name} - Image ${index + 1}"
                     class="w-full h-full object-cover"
                     data-fallback="car-default">
            </div>
        `).join('');

        modal.innerHTML = `
            <div class="modal-content max-w-6xl h-5/6">
                <button class="modal-close absolute top-4 right-4 text-2xl text-white hover:text-[#D4AF37] z-20 bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center" onclick="this.parentElement.parentElement.remove()">×</button>

                <div class="h-full flex flex-col">
                    <div class="p-6 bg-gradient-to-r from-black to-gray-900 border-b border-[#D4AF37]">
                        <h2 class="text-3xl font-bold gold-accent">${car.name}</h2>
                        <p class="text-gray-300">${car.brand} - Image Gallery</p>
                    </div>

                    <div class="flex-1 relative">
                        <div class="swiper gallery-swiper h-full">
                            <div class="swiper-wrapper">
                                ${imageSlides}
                            </div>
                            <div class="swiper-button-next text-[#D4AF37]"></div>
                            <div class="swiper-button-prev text-[#D4AF37]"></div>
                            <div class="swiper-pagination"></div>
                        </div>
                    </div>

                    <div class="p-4 bg-gradient-to-r from-gray-900 to-black border-t border-[#D4AF37] flex justify-between items-center">
                        <div class="text-sm text-gray-300">
                            ${galleryImages.length} images • Use arrow keys to navigate
                        </div>
                        <div class="flex gap-3">
                            <button onclick="carInventoryManager.openEnhancedBooking('${car.id}')"
                                    class="bg-[#D4AF37] text-black px-6 py-2 rounded-lg font-semibold hover:bg-[#E8C96A] transition-all">
                                Reserve This Vehicle
                            </button>
                            <button onclick="this.parentElement.parentElement.parentElement.parentElement.remove()"
                                    class="bg-transparent border border-[#D4AF37] text-[#D4AF37] px-6 py-2 rounded-lg hover:bg-[#D4AF37] hover:text-black transition-all">
                                Close Gallery
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Initialize gallery swiper
        setTimeout(() => {
            new Swiper('.gallery-swiper', {
                slidesPerView: 1,
                spaceBetween: 0,
                navigation: {
                    nextEl: '.gallery-swiper .swiper-button-next',
                    prevEl: '.gallery-swiper .swiper-button-prev',
                },
                pagination: {
                    el: '.gallery-swiper .swiper-pagination',
                    clickable: true,
                    type: 'bullets',
                },
                keyboard: {
                    enabled: true,
                },
                loop: true,
                autoplay: {
                    delay: 5000,
                    disableOnInteraction: true,
                },
            });
        }, 100);

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                document.body.style.overflow = 'auto';
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', function escapeHandler(e) {
            if (e.key === 'Escape') {
                modal.remove();
                document.body.style.overflow = 'auto';
                document.removeEventListener('keydown', escapeHandler);
            }
        });
    }
}

    // Favorites Management
    loadFavorites() {
        const saved = localStorage.getItem('midas-car-favorites');
        return saved ? JSON.parse(saved) : [];
    }

    saveFavorites() {
        localStorage.setItem('midas-car-favorites', JSON.stringify(this.favorites));
    }

    toggleFavorite(carId) {
        const index = this.favorites.indexOf(carId);
        if (index > -1) {
            this.favorites.splice(index, 1);
        } else {
            this.favorites.push(carId);
        }
        this.saveFavorites();
        this.updateFavoritesCount();
        this.updateFavoriteButtons();
    }

    updateFavoritesCount() {
        const countElement = document.getElementById('favorites-count');
        if (countElement) {
            countElement.textContent = this.favorites.length;
        }
    }

    updateFavoriteButtons() {
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            const carId = btn.closest('[data-car-id]')?.getAttribute('data-car-id');
            if (carId) {
                const isFavorite = this.favorites.includes(carId);
                btn.className = `favorite-btn p-2 rounded-full ${isFavorite ? 'bg-[#D4AF37] text-black' : 'bg-black bg-opacity-70 text-white'} hover:bg-[#D4AF37] hover:text-black transition-all`;
            }
        });
    }

    toggleFavoritesView() {
        if (this.currentFilter === 'favorites') {
            this.currentFilter = 'all';
            this.applyFiltersAndSort();
        } else {
            this.showFavoritesOnly();
        }
    }

    showFavoritesOnly() {
        if (!this.inventory || !this.inventory.items) return;

        const favoriteCars = this.inventory.items.filter(car => this.favorites.includes(car.id));
        this.renderFilteredCars(favoriteCars);
        this.updateResultsCount(favoriteCars.length, 'favorites');
        this.currentFilter = 'favorites';
    }

    // Comparison Functionality
    toggleComparison(carId) {
        const index = this.comparisonList.indexOf(carId);
        if (index > -1) {
            this.comparisonList.splice(index, 1);
        } else {
            if (this.comparisonList.length < 3) {
                this.comparisonList.push(carId);
            } else {
                this.showNotification('You can compare up to 3 vehicles at a time', 'warning');
                return;
            }
        }
        this.updateComparisonCount();
        this.updateComparisonButtons();
    }

    updateComparisonCount() {
        const countElement = document.getElementById('compare-count');
        const compareBtn = document.getElementById('compare-vehicles');

        if (countElement) {
            countElement.textContent = this.comparisonList.length;
        }

        if (compareBtn) {
            compareBtn.disabled = this.comparisonList.length < 2;
        }
    }

    updateComparisonButtons() {
        document.querySelectorAll('.compare-btn').forEach(btn => {
            const carId = btn.closest('[data-car-id]')?.getAttribute('data-car-id');
            if (carId) {
                const isInComparison = this.comparisonList.includes(carId);
                btn.className = `compare-btn p-2 rounded-full ${isInComparison ? 'bg-[#D4AF37] text-black' : 'bg-black bg-opacity-70 text-white'} hover:bg-[#D4AF37] hover:text-black transition-all`;
            }
        });
    }

    showComparisonModal() {
        if (this.comparisonList.length < 2) {
            this.showNotification('Please select at least 2 vehicles to compare', 'warning');
            return;
        }

        const comparisonCars = this.comparisonList.map(id => this.getCarById(id)).filter(Boolean);
        this.createComparisonModal(comparisonCars);
    }

    createComparisonModal(cars) {
        const existingModal = document.getElementById('comparison-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = 'comparison-modal';
        modal.className = 'modal';

        const carColumns = cars.map(car => `
            <div class="comparison-column bg-gray-800 p-6 rounded-lg">
                <img src="${this.generateImageUrl(car)}" alt="${car.name}" class="w-full h-48 object-cover rounded-lg mb-4">
                <h3 class="text-xl font-bold gold-accent mb-2">${car.name}</h3>
                <p class="text-gray-400 mb-4">${car.brand}</p>

                <div class="comparison-specs space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-400">Price/day:</span>
                        <span class="text-[#D4AF37]">${this.formatPricing(car.pricing)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-400">Horsepower:</span>
                        <span>${car.specifications.horsepower} HP</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-400">Top Speed:</span>
                        <span>${car.specifications.topSpeed}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-400">Engine:</span>
                        <span>${car.specifications.engine}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-400">Category:</span>
                        <span class="capitalize">${car.category}</span>
                    </div>
                </div>

                <div class="mt-6 space-y-2">
                    <button onclick="carInventoryManager.openEnhancedBooking('${car.id}')"
                            class="w-full bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#E8C96A] transition-all">
                        Reserve Now
                    </button>
                    <button onclick="carInventoryManager.showCarDetails('${car.id}')"
                            class="w-full bg-transparent border border-[#D4AF37] text-[#D4AF37] px-4 py-2 rounded-lg hover:bg-[#D4AF37] hover:text-black transition-all">
                        View Details
                    </button>
                </div>
            </div>
        `).join('');

        modal.innerHTML = `
            <div class="modal-content max-w-6xl">
                <button class="modal-close absolute top-4 right-4 text-2xl text-gray-400 hover:text-white z-10" onclick="this.parentElement.parentElement.remove()">×</button>

                <h2 class="text-3xl font-bold gold-accent mb-6 text-center">Vehicle Comparison</h2>

                <div class="grid md:grid-cols-${cars.length} gap-6">
                    ${carColumns}
                </div>

                <div class="mt-8 text-center">
                    <button onclick="carInventoryManager.clearComparison()"
                            class="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-all mr-4">
                        Clear Comparison
                    </button>
                    <button onclick="this.parentElement.parentElement.remove()"
                            class="bg-[#D4AF37] text-black px-6 py-3 rounded-lg hover:bg-[#E8C96A] transition-all">
                        Close Comparison
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                document.body.style.overflow = 'auto';
            }
        });
    }

    clearComparison() {
        this.comparisonList = [];
        this.updateComparisonCount();
        this.updateComparisonButtons();
        document.getElementById('comparison-modal')?.remove();
        document.body.style.overflow = 'auto';
    }

    // Availability Management
    initializeAvailabilityChecking() {
        // Simulate availability data
        this.generateMockAvailability();
    }

    generateMockAvailability() {
        if (!this.inventory || !this.inventory.items) return;

        this.inventory.items.forEach(car => {
            // Simulate different availability statuses
            const statuses = ['available', 'limited', 'booked'];
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
            this.availabilityCache.set(car.id, {
                status: randomStatus,
                lastChecked: new Date(),
                nextAvailable: randomStatus === 'booked' ? this.getRandomFutureDate() : null
            });
        });
    }

    getRandomFutureDate() {
        const today = new Date();
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + Math.floor(Math.random() * 30) + 1);
        return futureDate;
    }

    getAvailabilityStatus(carId) {
        const availability = this.availabilityCache.get(carId);
        if (!availability) {
            return { class: 'bg-gray-500 text-white', text: 'Unknown' };
        }

        switch (availability.status) {
            case 'available':
                return { class: 'bg-green-500 text-white', text: 'Available' };
            case 'limited':
                return { class: 'bg-yellow-500 text-black', text: 'Limited' };
            case 'booked':
                return { class: 'bg-red-500 text-white', text: 'Booked' };
            default:
                return { class: 'bg-gray-500 text-white', text: 'Unknown' };
        }
    }

    async checkRealTimeAvailability() {
        const btn = document.getElementById('availability-check');
        if (!btn) return;

        btn.textContent = 'Checking...';
        btn.disabled = true;

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        this.generateMockAvailability();
        this.applyFiltersAndSort();

        btn.textContent = 'Check Real-time Availability';
        btn.disabled = false;

        this.showNotification('Availability updated successfully', 'success');
    }

    // Utility Methods
    clearAllFilters() {
        this.searchQuery = '';
        this.currentFilter = 'all';
        this.currentSort = 'name';

        document.getElementById('car-search').value = '';
        document.getElementById('car-sort').value = 'name';
        document.getElementById('price-min').value = '';
        document.getElementById('price-max').value = '';

        // Reset filter buttons
        document.querySelectorAll('#cars .filter-btn[data-type]').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-type') === 'all') {
                btn.classList.add('active');
            }
        });

        this.applyFiltersAndSort();
    }

    updateResultsCount(count, type = 'vehicles') {
        const countElement = document.getElementById('results-count');
        if (countElement) {
            countElement.textContent = `Showing ${count} ${type}`;
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
            type === 'success' ? 'bg-green-600' :
            type === 'warning' ? 'bg-yellow-600' :
            type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        } text-white`;

        notification.innerHTML = `
            <div class="flex justify-between items-center">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-xl">&times;</button>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // Enhanced booking integration
    openEnhancedBooking(carId) {
        const car = this.getCarById(carId);
        if (!car) return;

        // Check if booking calendar is available
        if (window.bookingCalendar) {
            // Enhanced integration with booking calendar
            this.prepareBookingData(car);
            window.bookingCalendar.openCalendar(carId);
        } else {
            // Fallback to regular modal with car-specific data
            this.openCarSpecificModal(car);
        }
    }

    prepareBookingData(car) {
        // Prepare additional data for booking calendar
        const bookingData = {
            carId: car.id,
            name: car.name,
            brand: car.brand,
            category: car.category,
            pricing: car.pricing,
            specifications: car.specifications,
            features: car.features,
            availability: car.availability,
            imageUrl: this.generateImageUrl(car)
        };

        // Store in session for booking calendar to access
        sessionStorage.setItem('currentBookingCar', JSON.stringify(bookingData));

        // Dispatch event for booking calendar to listen to
        window.dispatchEvent(new CustomEvent('carBookingInitiated', {
            detail: bookingData
        }));
    }

    openCarSpecificModal(car) {
        const existingModal = document.getElementById('booking-modal');
        if (existingModal) {
            const title = document.getElementById('modal-title');
            if (title) {
                title.textContent = `Reserve ${car.name}`;
            }

            // Add car-specific pricing information
            const modalContent = existingModal.querySelector('.modal-content');
            if (modalContent) {
                let pricingInfo = modalContent.querySelector('.car-pricing-info');
                if (!pricingInfo) {
                    pricingInfo = document.createElement('div');
                    pricingInfo.className = 'car-pricing-info bg-gray-900 p-4 rounded-lg mb-4';
                    pricingInfo.innerHTML = `
                        <h3 class="text-lg font-semibold gold-accent mb-2">${car.name}</h3>
                        <p class="text-white mb-2">${this.formatPricing(car.pricing)}</p>
                        <p class="text-gray-400 text-sm">${car.specifications.horsepower} HP • ${car.specifications.topSpeed}</p>
                    `;
                    modalContent.insertBefore(pricingInfo, modalContent.firstChild.nextSibling);
                }
            }

            existingModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
}

// Initialize the car inventory manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.carInventoryManager = new CarInventoryManager();
});
