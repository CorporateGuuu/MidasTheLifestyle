#!/usr/bin/env node

// Image Optimization Script for Midas Lifestyle
// Converts and optimizes images for web performance

const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

class ImageOptimizer {
  constructor() {
    this.inputDir = path.join(__dirname, '../assets/images');
    this.outputDir = path.join(__dirname, '../assets/images/optimized');
    this.formats = ['webp', 'avif', 'jpeg'];
    this.sizes = {
      hero: { width: 1920, height: 1080 },
      large: { width: 1200, height: 800 },
      medium: { width: 768, height: 512 },
      small: { width: 480, height: 320 },
      thumbnail: { width: 400, height: 300 }
    };
  }

  async init() {
    console.log('🎨 Starting Midas Lifestyle Image Optimization...\n');
    
    try {
      await this.ensureDirectories();
      await this.processImages();
      console.log('\n✅ Image optimization completed successfully!');
    } catch (error) {
      console.error('❌ Error during image optimization:', error);
      process.exit(1);
    }
  }

  async ensureDirectories() {
    try {
      await fs.access(this.outputDir);
    } catch {
      await fs.mkdir(this.outputDir, { recursive: true });
      console.log(`📁 Created output directory: ${this.outputDir}`);
    }

    // Create subdirectories for each category
    const categories = ['cars', 'yachts', 'jets', 'properties', 'hero', 'brand'];
    for (const category of categories) {
      const categoryDir = path.join(this.outputDir, category);
      try {
        await fs.access(categoryDir);
      } catch {
        await fs.mkdir(categoryDir, { recursive: true });
        console.log(`📁 Created category directory: ${category}`);
      }
    }
  }

  async processImages() {
    const categories = await this.getCategories();
    
    for (const category of categories) {
      console.log(`\n🔄 Processing ${category} images...`);
      await this.processCategory(category);
    }
  }

  async getCategories() {
    try {
      const items = await fs.readdir(this.inputDir, { withFileTypes: true });
      return items
        .filter(item => item.isDirectory() && item.name !== 'optimized')
        .map(item => item.name);
    } catch (error) {
      console.warn('⚠️ Input directory not found, creating sample structure...');
      await this.createSampleStructure();
      return [];
    }
  }

  async processCategory(category) {
    const categoryPath = path.join(this.inputDir, category);
    const outputCategoryPath = path.join(this.outputDir, category);
    
    try {
      const files = await fs.readdir(categoryPath);
      const imageFiles = files.filter(file => 
        /\.(jpg|jpeg|png|tiff|webp)$/i.test(file)
      );

      for (const file of imageFiles) {
        await this.processImage(categoryPath, outputCategoryPath, file);
      }
    } catch (error) {
      console.warn(`⚠️ Could not process category ${category}:`, error.message);
    }
  }

  async processImage(inputPath, outputPath, filename) {
    const inputFile = path.join(inputPath, filename);
    const baseName = path.parse(filename).name;
    
    console.log(`  📸 Processing: ${filename}`);

    try {
      const image = sharp(inputFile);
      const metadata = await image.metadata();
      
      // Determine appropriate sizes based on original dimensions
      const sizesToGenerate = this.determineSizes(metadata);
      
      for (const sizeName of sizesToGenerate) {
        const size = this.sizes[sizeName];
        
        for (const format of this.formats) {
          const outputFilename = `${baseName}-${sizeName}.${format}`;
          const outputFile = path.join(outputPath, outputFilename);
          
          await this.generateOptimizedImage(image, outputFile, size, format);
        }
      }
      
      // Also create original format optimized version
      const originalFormat = metadata.format;
      const optimizedOriginal = path.join(outputPath, `${baseName}-original.${originalFormat}`);
      await this.generateOptimizedImage(image, optimizedOriginal, null, originalFormat);
      
      console.log(`    ✅ Generated ${sizesToGenerate.length * this.formats.length + 1} variants`);
      
    } catch (error) {
      console.error(`    ❌ Error processing ${filename}:`, error.message);
    }
  }

  determineSizes(metadata) {
    const { width, height } = metadata;
    const sizes = [];
    
    // Always generate thumbnail
    sizes.push('thumbnail');
    
    // Generate sizes based on original dimensions
    if (width >= 1920 || height >= 1080) {
      sizes.push('hero', 'large', 'medium', 'small');
    } else if (width >= 1200 || height >= 800) {
      sizes.push('large', 'medium', 'small');
    } else if (width >= 768 || height >= 512) {
      sizes.push('medium', 'small');
    } else {
      sizes.push('small');
    }
    
    return sizes;
  }

  async generateOptimizedImage(image, outputFile, size, format) {
    let pipeline = image.clone();
    
    // Resize if size is specified
    if (size) {
      pipeline = pipeline.resize(size.width, size.height, {
        fit: 'cover',
        position: 'center'
      });
    }
    
    // Apply format-specific optimizations
    switch (format) {
      case 'webp':
        pipeline = pipeline.webp({ 
          quality: 85,
          effort: 6
        });
        break;
        
      case 'avif':
        pipeline = pipeline.avif({ 
          quality: 80,
          effort: 6
        });
        break;
        
      case 'jpeg':
        pipeline = pipeline.jpeg({ 
          quality: 85,
          progressive: true,
          mozjpeg: true
        });
        break;
        
      case 'png':
        pipeline = pipeline.png({ 
          quality: 90,
          compressionLevel: 9
        });
        break;
    }
    
    await pipeline.toFile(outputFile);
  }

  async createSampleStructure() {
    console.log('📁 Creating sample directory structure...');
    
    const structure = {
      'cars': ['bugatti-chiron', 'koenigsegg-jesko', 'rolls-royce-cullinan'],
      'yachts': ['icon-280', 'azimut-grande-35', 'lurssen-90m'],
      'jets': ['gulfstream-g700', 'cessna-citation', 'bombardier-learjet'],
      'properties': ['palm-jumeirah-villa', 'dubai-marina-penthouse', 'miami-beach-penthouse'],
      'hero': ['hero-1', 'hero-2', 'hero-3', 'hero-4'],
      'brand': ['logo', 'logo-white', 'og-image']
    };

    for (const [category, items] of Object.entries(structure)) {
      const categoryDir = path.join(this.inputDir, category);
      await fs.mkdir(categoryDir, { recursive: true });
      
      // Create README for each category
      const readmeContent = `# ${category.charAt(0).toUpperCase() + category.slice(1)} Images

Place your ${category} images in this directory.

Required images:
${items.map(item => `- ${item}.jpg (or .png)`).join('\n')}

Image specifications:
- Format: JPEG or PNG
- Minimum resolution: 1200x800 for products, 1920x1080 for hero images
- Quality: High resolution, professional photography
- Style: Luxury aesthetic matching Midas Lifestyle brand

The optimization script will automatically generate:
- WebP and AVIF formats for modern browsers
- Multiple sizes for responsive design
- Optimized compression for web performance
`;
      
      await fs.writeFile(path.join(categoryDir, 'README.md'), readmeContent);
    }
    
    console.log('📝 Created sample structure with README files');
    console.log('📸 Please add your images to the appropriate directories and run this script again');
  }

  async generateReport() {
    console.log('\n📊 Optimization Report:');
    
    try {
      const stats = await this.getOptimizationStats();
      console.log(`   Original images: ${stats.originalCount}`);
      console.log(`   Optimized variants: ${stats.optimizedCount}`);
      console.log(`   Total size reduction: ${stats.sizeReduction}%`);
      console.log(`   Formats generated: ${this.formats.join(', ')}`);
    } catch (error) {
      console.log('   Could not generate detailed report');
    }
  }

  async getOptimizationStats() {
    // This would calculate actual statistics
    // For now, return sample data
    return {
      originalCount: 0,
      optimizedCount: 0,
      sizeReduction: 0
    };
  }
}

// CLI interface
if (require.main === module) {
  const optimizer = new ImageOptimizer();
  optimizer.init().then(() => {
    console.log('\n🎉 Image optimization complete!');
    console.log('💡 Tip: Run this script whenever you add new images to maintain optimal performance.');
  });
}

module.exports = ImageOptimizer;
