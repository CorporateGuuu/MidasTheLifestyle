// PWA Icon Generator for Midas The Lifestyle
// Generates high-quality icons for all required sizes

class IconGenerator {
    constructor() {
        this.iconSizes = [16, 32, 72, 96, 128, 144, 152, 180, 192, 384, 512];
        this.splashSizes = {
            'iphone5_splash': { width: 640, height: 1136 },
            'iphone6_splash': { width: 750, height: 1334 },
            'iphoneplus_splash': { width: 1242, height: 2208 },
            'iphonex_splash': { width: 1125, height: 2436 },
            'iphonexr_splash': { width: 828, height: 1792 },
            'iphonexsmax_splash': { width: 1242, height: 2688 },
            'ipad_splash': { width: 1536, height: 2048 },
            'ipadpro1_splash': { width: 1668, height: 2224 },
            'ipadpro3_splash': { width: 2048, height: 2732 }
        };
        this.init();
    }

    init() {
        this.createCanvas();
        this.generateIcons();
        this.generateSplashScreens();
        console.log('🎨 PWA Icons generated successfully');
    }

    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    generateIcons() {
        this.iconSizes.forEach(size => {
            this.createIcon(size);
        });
    }

    createIcon(size) {
        this.canvas.width = size;
        this.canvas.height = size;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, size, size);
        
        // Create luxury gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#000000');
        gradient.addColorStop(0.5, '#1a1a1a');
        gradient.addColorStop(1, '#000000');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, size, size);
        
        // Add gold border
        const borderWidth = Math.max(2, size * 0.02);
        this.ctx.strokeStyle = '#D4AF37';
        this.ctx.lineWidth = borderWidth;
        this.ctx.strokeRect(borderWidth/2, borderWidth/2, size - borderWidth, size - borderWidth);
        
        // Add Midas logo/text
        this.drawMidasLogo(size);
        
        // Convert to blob and create download link
        this.canvas.toBlob(blob => {
            this.downloadIcon(blob, `icon-${size}x${size}.png`);
        }, 'image/png');
    }

    drawMidasLogo(size) {
        const centerX = size / 2;
        const centerY = size / 2;
        
        // Draw crown symbol
        this.ctx.fillStyle = '#D4AF37';
        this.ctx.font = `bold ${size * 0.4}px serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('♔', centerX, centerY - size * 0.1);
        
        // Draw "M" for Midas
        this.ctx.font = `bold ${size * 0.25}px serif`;
        this.ctx.fillText('M', centerX, centerY + size * 0.15);
        
        // Add subtle glow effect
        this.ctx.shadowColor = '#D4AF37';
        this.ctx.shadowBlur = size * 0.05;
        this.ctx.fillText('M', centerX, centerY + size * 0.15);
        this.ctx.shadowBlur = 0;
    }

    generateSplashScreens() {
        Object.entries(this.splashSizes).forEach(([name, dimensions]) => {
            this.createSplashScreen(name, dimensions.width, dimensions.height);
        });
    }

    createSplashScreen(name, width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, width, height);
        
        // Create luxury gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#000000');
        gradient.addColorStop(0.3, '#1a1a1a');
        gradient.addColorStop(0.7, '#1a1a1a');
        gradient.addColorStop(1, '#000000');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, width, height);
        
        // Add centered logo
        const logoSize = Math.min(width, height) * 0.3;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Draw main logo
        this.ctx.fillStyle = '#D4AF37';
        this.ctx.font = `bold ${logoSize * 0.4}px serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('♔', centerX, centerY - logoSize * 0.2);
        
        // Draw brand name
        this.ctx.font = `bold ${logoSize * 0.15}px sans-serif`;
        this.ctx.fillText('MIDAS', centerX, centerY + logoSize * 0.1);
        
        this.ctx.font = `${logoSize * 0.08}px sans-serif`;
        this.ctx.fillText('THE LIFESTYLE', centerX, centerY + logoSize * 0.25);
        
        // Add tagline
        this.ctx.fillStyle = '#888888';
        this.ctx.font = `${logoSize * 0.06}px sans-serif`;
        this.ctx.fillText('Luxury Rentals', centerX, centerY + logoSize * 0.4);
        
        // Convert to blob and create download link
        this.canvas.toBlob(blob => {
            this.downloadIcon(blob, `${name}.png`);
        }, 'image/png');
    }

    downloadIcon(blob, filename) {
        // In a real implementation, you would save these to the server
        // For now, we'll create the file structure documentation
        console.log(`Generated: /images/icons/${filename}`);
    }

    // Method to create favicon
    createFavicon() {
        this.createIcon(32);
        this.canvas.toBlob(blob => {
            this.downloadIcon(blob, 'favicon.ico');
        }, 'image/png');
    }

    // Method to update manifest with generated icons
    updateManifest() {
        const iconEntries = this.iconSizes.map(size => ({
            src: `/images/icons/icon-${size}x${size}.png`,
            sizes: `${size}x${size}`,
            type: 'image/png',
            purpose: size >= 192 ? 'any maskable' : 'any'
        }));

        return {
            icons: iconEntries,
            splash_screens: Object.keys(this.splashSizes).map(name => ({
                src: `/images/splash/${name}.png`,
                media: this.getSplashMediaQuery(name)
            }))
        };
    }

    getSplashMediaQuery(name) {
        const queries = {
            'iphone5_splash': '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
            'iphone6_splash': '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)',
            'iphoneplus_splash': '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)',
            'iphonex_splash': '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)',
            'iphonexr_splash': '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)',
            'iphonexsmax_splash': '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)',
            'ipad_splash': '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)',
            'ipadpro1_splash': '(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)',
            'ipadpro3_splash': '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)'
        };
        return queries[name] || '';
    }
}

// Auto-generate icons when script loads
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.search.includes('generate-icons')) {
        const generator = new IconGenerator();
        window.iconGenerator = generator;
    }
});
