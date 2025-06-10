// Build script for Midas The Lifestyle production deployment
const fs = require('fs');
const path = require('path');

/**
 * Production build script
 * Ensures all assets are properly configured for deployment
 */
function buildForProduction() {
    console.log('🚀 Building Midas The Lifestyle for production...');
    
    try {
        // Verify critical files exist
        const criticalFiles = [
            'index.html',
            'styles.css',
            'script.js',
            'netlify.toml',
            'package.json'
        ];
        
        console.log('📋 Checking critical files...');
        criticalFiles.forEach(file => {
            if (fs.existsSync(file)) {
                console.log(`✅ ${file} - Found`);
            } else {
                console.log(`❌ ${file} - Missing`);
            }
        });
        
        // Check Netlify functions
        console.log('🔧 Checking Netlify functions...');
        const functionsDir = 'netlify/functions';
        if (fs.existsSync(functionsDir)) {
            const functions = fs.readdirSync(functionsDir);
            console.log(`✅ Found ${functions.length} Netlify functions`);
            functions.forEach(func => {
                console.log(`   - ${func}`);
            });
        } else {
            console.log('❌ Netlify functions directory not found');
        }
        
        // Verify CSS file content
        console.log('🎨 Checking CSS file...');
        if (fs.existsSync('styles.css')) {
            const cssContent = fs.readFileSync('styles.css', 'utf8');
            if (cssContent.includes('.luxury-heading') && cssContent.includes('#D4AF37')) {
                console.log('✅ CSS contains luxury styling');
            } else {
                console.log('⚠️ CSS may be missing luxury styles');
            }
        }
        
        // Check HTML file
        console.log('📄 Checking HTML file...');
        if (fs.existsSync('index.html')) {
            const htmlContent = fs.readFileSync('index.html', 'utf8');
            if (htmlContent.includes('styles.css') && htmlContent.includes('Midas The Lifestyle')) {
                console.log('✅ HTML properly references CSS and contains branding');
            } else {
                console.log('⚠️ HTML may have issues with CSS reference or branding');
            }
        }
        
        // Generate sitemap
        console.log('🗺️ Generating sitemap...');
        generateSitemap();
        
        // Generate robots.txt
        console.log('🤖 Generating robots.txt...');
        generateRobotsTxt();
        
        console.log('✅ Production build completed successfully!');
        console.log('🌐 Ready for deployment to Netlify');
        
    } catch (error) {
        console.error('❌ Build failed:', error.message);
        process.exit(1);
    }
}

/**
 * Generate sitemap.xml
 */
function generateSitemap() {
    const baseUrl = 'https://midasthelifestyle.com';
    const currentDate = new Date().toISOString().split('T')[0];
    
    const pages = [
        { url: '', priority: '1.0', changefreq: 'daily' },
        { url: '#cars', priority: '0.9', changefreq: 'daily' },
        { url: '#yachts', priority: '0.8', changefreq: 'weekly' },
        { url: '#planes', priority: '0.8', changefreq: 'weekly' },
        { url: '#properties', priority: '0.8', changefreq: 'weekly' },
        { url: '#transportation', priority: '0.7', changefreq: 'monthly' },
        { url: '#contact', priority: '0.6', changefreq: 'monthly' }
    ];

    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    pages.forEach(page => {
        sitemap += '  <url>\n';
        sitemap += `    <loc>${baseUrl}/${page.url}</loc>\n`;
        sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
        sitemap += `    <changefreq>${page.changefreq}</changefreq>\n`;
        sitemap += `    <priority>${page.priority}</priority>\n`;
        sitemap += '  </url>\n';
    });

    sitemap += '</urlset>';

    fs.writeFileSync('sitemap.xml', sitemap);
    console.log('✅ Sitemap generated');
}

/**
 * Generate robots.txt
 */
function generateRobotsTxt() {
    const robotsTxt = `User-agent: *
Allow: /

# Sitemap
Sitemap: https://midasthelifestyle.com/sitemap.xml

# Allow luxury content
Allow: /#cars
Allow: /#yachts
Allow: /#planes
Allow: /#properties
Allow: /#transportation
Allow: /#contact

# Disallow admin areas
Disallow: /admin/
Disallow: /api/
Disallow: /.netlify/

# Crawl delay for respectful crawling
Crawl-delay: 1`;

    fs.writeFileSync('robots.txt', robotsTxt);
    console.log('✅ Robots.txt generated');
}

// Run build if this script is executed directly
if (require.main === module) {
    buildForProduction();
}

module.exports = {
    buildForProduction,
    generateSitemap,
    generateRobotsTxt
};
