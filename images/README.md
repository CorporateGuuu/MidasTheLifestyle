# Midas The Lifestyle - Image Assets

## Folder Structure

```
images/
├── cars/                          # Luxury vehicle images
│   ├── bugatti-chiron/
│   │   ├── hero.jpg              # Main showcase image (1920x1080)
│   │   ├── front.jpg             # Front view (1200x800)
│   │   ├── side.jpg              # Side profile (1200x800)
│   │   ├── rear.jpg              # Rear view (1200x800)
│   │   ├── interior.jpg          # Interior shot (1200x800)
│   │   ├── detail1.jpg           # Detail shot 1 (800x600)
│   │   ├── detail2.jpg           # Detail shot 2 (800x600)
│   │   └── thumbnail.jpg         # Thumbnail (400x300)
│   ├── ferrari-sf90/
│   ├── lamborghini-huracan/
│   ├── mclaren-720s/
│   ├── rolls-royce-cullinan/
│   ├── bentley-continental/
│   ├── rolls-royce-phantom/
│   ├── aston-martin-db11/
│   ├── bentley-bentayga/
│   ├── lamborghini-urus/
│   └── mercedes-maybach-s680/
├── yachts/                        # Superyacht images
│   ├── hero.jpg                  # Main yacht hero (1920x1080)
│   ├── luxury-yacht-1.jpg        # Yacht exterior (1200x800)
│   ├── luxury-yacht-2.jpg        # Yacht at sea (1200x800)
│   ├── yacht-interior-1.jpg      # Luxury interior (1200x800)
│   ├── yacht-deck.jpg            # Deck area (1200x800)
│   └── yacht-sunset.jpg          # Yacht at sunset (1200x800)
├── jets/                          # Private jet images
│   ├── hero.jpg                  # Main jet hero (1920x1080)
│   ├── private-jet-1.jpg         # Jet exterior (1200x800)
│   ├── private-jet-2.jpg         # Jet on tarmac (1200x800)
│   ├── jet-interior-1.jpg        # Luxury cabin (1200x800)
│   ├── jet-cockpit.jpg           # Cockpit view (1200x800)
│   └── jet-exterior.jpg          # Jet exterior detail (1200x800)
├── properties/                    # Luxury estate images
│   ├── hero.jpg                  # Main property hero (1920x1080)
│   ├── luxury-villa-1.jpg        # Villa exterior (1200x800)
│   ├── luxury-villa-2.jpg        # Villa with pool (1200x800)
│   ├── penthouse-1.jpg           # Penthouse view (1200x800)
│   ├── estate-exterior.jpg       # Estate grounds (1200x800)
│   └── luxury-interior.jpg       # Luxury interior (1200x800)
├── lifestyle/                     # Lifestyle and service images
│   ├── concierge-service.jpg     # Concierge team (800x600)
│   ├── white-glove-delivery.jpg  # Vehicle delivery (800x600)
│   ├── luxury-experience.jpg     # Client experience (800x600)
│   └── satisfied-client.jpg      # Happy client (800x600)
├── branding/                      # Brand assets
│   ├── midas-logo.png           # Main logo (512x512)
│   ├── midas-logo-white.png     # White logo variant (512x512)
│   └── midas-watermark.png      # Watermark (256x256)
├── icons/                         # PWA and app icons
│   ├── icon-16x16.png
│   ├── icon-32x32.png
│   ├── icon-72x72.png
│   ├── icon-96x96.png
│   ├── icon-128x128.png
│   ├── icon-144x144.png
│   ├── icon-152x152.png
│   ├── icon-180x180.png
│   ├── icon-192x192.png
│   ├── icon-384x384.png
│   └── icon-512x512.png
├── splash/                        # iOS splash screens
│   ├── iphone5_splash.png
│   ├── iphone6_splash.png
│   ├── iphoneplus_splash.png
│   ├── iphonex_splash.png
│   ├── iphonexr_splash.png
│   ├── iphonexsmax_splash.png
│   ├── ipad_splash.png
│   ├── ipadpro1_splash.png
│   └── ipadpro3_splash.png
└── hero/                          # Hero section images
    ├── luxury-hero.jpg           # Main hero background (1920x1080)
    ├── cars-hero.jpg             # Cars section hero (1920x1080)
    ├── yachts-hero.jpg           # Yachts section hero (1920x1080)
    ├── jets-hero.jpg             # Jets section hero (1920x1080)
    └── properties-hero.jpg       # Properties section hero (1920x1080)
```

## Image Specifications

### Quality Standards
- **Format**: JPEG for photos, PNG for logos/graphics with transparency
- **Compression**: 80-85% quality for web optimization
- **Color Profile**: sRGB for web compatibility
- **Optimization**: WebP variants for modern browsers

### Size Guidelines
- **Hero Images**: 1920x1080px (16:9 aspect ratio)
- **Gallery Images**: 1200x800px (3:2 aspect ratio)
- **Thumbnails**: 400x300px (4:3 aspect ratio)
- **Detail Shots**: 800x600px (4:3 aspect ratio)
- **Icons**: Multiple sizes as specified in PWA manifest

### Naming Convention
- Use lowercase with hyphens for separation
- Include descriptive keywords
- Maintain consistency across similar image types
- Example: `bugatti-chiron-front-view.jpg`

## Image Sources

### Recommended Sources for High-Quality Luxury Images
1. **Automotive**: Official manufacturer press kits, automotive photography specialists
2. **Yachts**: Marine photography professionals, yacht manufacturer galleries
3. **Jets**: Aviation photography specialists, aircraft manufacturer resources
4. **Properties**: Luxury real estate photography, architectural photographers
5. **Lifestyle**: Professional lifestyle photographers, luxury service documentation

### Licensing Requirements
- Ensure all images have proper commercial licensing
- Maintain attribution records where required
- Use only high-resolution, professional-quality images
- Avoid watermarked or low-quality stock photos

## Implementation Notes

### Performance Optimization
- Implement lazy loading for all non-critical images
- Use responsive images with multiple sizes
- Compress images without sacrificing luxury appeal
- Implement WebP format with JPEG fallbacks

### Accessibility
- Include descriptive alt text for all images
- Ensure sufficient contrast for text overlays
- Provide alternative content for decorative images

### SEO Benefits
- Use descriptive filenames with relevant keywords
- Implement proper image sitemaps
- Include structured data for vehicle images
- Optimize image metadata for search engines

This image system is designed to showcase the luxury and exclusivity of Midas The Lifestyle services while maintaining optimal web performance and user experience.
