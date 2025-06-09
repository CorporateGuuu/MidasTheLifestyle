// Sitemap Generator for Midas The Lifestyle
// Generates XML sitemap for SEO optimization

const fs = require('fs');
const path = require('path');

/**
 * Generate XML sitemap for the website
 */
function generateSitemap() {
  const baseUrl = 'https://midasthelifestyle.com';
  const currentDate = new Date().toISOString().split('T')[0];
  
  const pages = [
    {
      url: '',
      changefreq: 'daily',
      priority: '1.0',
      lastmod: currentDate
    },
    {
      url: '/luxury-cars',
      changefreq: 'daily',
      priority: '0.9',
      lastmod: currentDate
    },
    {
      url: '/exotic-cars',
      changefreq: 'daily',
      priority: '0.9',
      lastmod: currentDate
    },
    {
      url: '/yachts',
      changefreq: 'weekly',
      priority: '0.8',
      lastmod: currentDate
    },
    {
      url: '/private-jets',
      changefreq: 'weekly',
      priority: '0.8',
      lastmod: currentDate
    },
    {
      url: '/luxury-properties',
      changefreq: 'weekly',
      priority: '0.8',
      lastmod: currentDate
    },
    {
      url: '/booking',
      changefreq: 'monthly',
      priority: '0.7',
      lastmod: currentDate
    },
    {
      url: '/about',
      changefreq: 'monthly',
      priority: '0.6',
      lastmod: currentDate
    },
    {
      url: '/contact',
      changefreq: 'monthly',
      priority: '0.6',
      lastmod: currentDate
    },
    {
      url: '/loyalty-program',
      changefreq: 'monthly',
      priority: '0.7',
      lastmod: currentDate
    },
    {
      url: '/virtual-tours',
      changefreq: 'weekly',
      priority: '0.8',
      lastmod: currentDate
    }
  ];

  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  pages.forEach(page => {
    sitemap += '  <url>\n';
    sitemap += `    <loc>${baseUrl}${page.url}</loc>\n`;
    sitemap += `    <lastmod>${page.lastmod}</lastmod>\n`;
    sitemap += `    <changefreq>${page.changefreq}</changefreq>\n`;
    sitemap += `    <priority>${page.priority}</priority>\n`;
    sitemap += '  </url>\n';
  });

  sitemap += '</urlset>';

  // Write sitemap to file
  fs.writeFileSync('sitemap.xml', sitemap);
  console.log('✅ Sitemap generated successfully');
}

/**
 * Generate robots.txt file
 */
function generateRobotsTxt() {
  const robotsTxt = `User-agent: *
Allow: /

# Sitemap
Sitemap: https://midasthelifestyle.com/sitemap.xml

# Disallow admin areas
Disallow: /admin/
Disallow: /api/
Disallow: /.netlify/

# Allow luxury content
Allow: /luxury-cars/
Allow: /exotic-cars/
Allow: /yachts/
Allow: /private-jets/
Allow: /luxury-properties/
Allow: /virtual-tours/
Allow: /loyalty-program/

# Crawl delay for respectful crawling
Crawl-delay: 1`;

  fs.writeFileSync('robots.txt', robotsTxt);
  console.log('✅ Robots.txt generated successfully');
}

// Run generators
if (require.main === module) {
  try {
    generateSitemap();
    generateRobotsTxt();
    console.log('🚀 SEO files generated successfully');
  } catch (error) {
    console.error('❌ Error generating SEO files:', error.message);
    process.exit(1);
  }
}

module.exports = {
  generateSitemap,
  generateRobotsTxt
};
