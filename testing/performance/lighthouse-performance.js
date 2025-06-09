// Lighthouse Performance Testing for Midas The Lifestyle
// Comprehensive performance monitoring and optimization validation

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

/**
 * Performance Testing Configuration
 */
const config = {
  // Test URLs
  urls: [
    {
      url: 'https://midasthelifestyle.netlify.app/',
      name: 'Homepage',
      critical: true,
      thresholds: {
        performance: 90,
        accessibility: 95,
        bestPractices: 90,
        seo: 95,
        pwa: 80,
      },
    },
    {
      url: 'https://midasthelifestyle.netlify.app/inventory',
      name: 'Inventory Page',
      critical: true,
      thresholds: {
        performance: 85,
        accessibility: 95,
        bestPractices: 90,
        seo: 90,
        pwa: 80,
      },
    },
    {
      url: 'https://midasthelifestyle.netlify.app/inventory/cars',
      name: 'Cars Category',
      critical: true,
      thresholds: {
        performance: 85,
        accessibility: 95,
        bestPractices: 90,
        seo: 90,
        pwa: 80,
      },
    },
    {
      url: 'https://midasthelifestyle.netlify.app/booking',
      name: 'Booking Flow',
      critical: true,
      thresholds: {
        performance: 80,
        accessibility: 95,
        bestPractices: 90,
        seo: 85,
        pwa: 80,
      },
    },
    {
      url: 'https://midasthelifestyle.netlify.app/login',
      name: 'Login Page',
      critical: false,
      thresholds: {
        performance: 90,
        accessibility: 95,
        bestPractices: 90,
        seo: 85,
        pwa: 80,
      },
    },
  ],

  // Lighthouse configuration
  lighthouseConfig: {
    extends: 'lighthouse:default',
    settings: {
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
      formFactor: 'desktop',
      throttling: {
        rttMs: 40,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0,
      },
      screenEmulation: {
        mobile: false,
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        disabled: false,
      },
      emulatedUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  },

  // Mobile configuration
  mobileConfig: {
    extends: 'lighthouse:default',
    settings: {
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
      formFactor: 'mobile',
      throttling: {
        rttMs: 150,
        throughputKbps: 1638.4,
        cpuSlowdownMultiplier: 4,
        requestLatencyMs: 150,
        downloadThroughputKbps: 1638.4,
        uploadThroughputKbps: 750,
      },
      screenEmulation: {
        mobile: true,
        width: 375,
        height: 667,
        deviceScaleFactor: 2,
        disabled: false,
      },
      emulatedUserAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
    },
  },

  // Chrome launch options
  chromeFlags: [
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-extensions',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
  ],

  // Output configuration
  output: {
    directory: './testing/performance/reports',
    formats: ['html', 'json'],
  },
};

/**
 * Performance Testing Class
 */
class PerformanceTester {
  constructor() {
    this.results = [];
    this.chrome = null;
  }

  /**
   * Initialize Chrome browser
   */
  async initChrome() {
    this.chrome = await chromeLauncher.launch({
      chromeFlags: config.chromeFlags,
    });
    console.log(`🚀 Chrome launched on port ${this.chrome.port}`);
  }

  /**
   * Close Chrome browser
   */
  async closeChrome() {
    if (this.chrome) {
      await this.chrome.kill();
      console.log('🔴 Chrome closed');
    }
  }

  /**
   * Run Lighthouse audit for a single URL
   */
  async runAudit(urlConfig, formFactor = 'desktop') {
    const lighthouseConfig = formFactor === 'mobile' ? config.mobileConfig : config.lighthouseConfig;
    
    console.log(`🔍 Running ${formFactor} audit for: ${urlConfig.name}`);
    
    try {
      const runnerResult = await lighthouse(
        urlConfig.url,
        {
          port: this.chrome.port,
          output: config.output.formats,
          logLevel: 'info',
        },
        lighthouseConfig
      );

      const report = runnerResult.report;
      const scores = this.extractScores(runnerResult.lhr);
      
      // Save reports
      await this.saveReports(urlConfig.name, formFactor, report, runnerResult.lhr);
      
      // Analyze results
      const analysis = this.analyzeResults(urlConfig, scores, runnerResult.lhr);
      
      return {
        url: urlConfig.url,
        name: urlConfig.name,
        formFactor,
        scores,
        analysis,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`❌ Error running audit for ${urlConfig.name}:`, error.message);
      return {
        url: urlConfig.url,
        name: urlConfig.name,
        formFactor,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Extract scores from Lighthouse results
   */
  extractScores(lhr) {
    return {
      performance: Math.round(lhr.categories.performance.score * 100),
      accessibility: Math.round(lhr.categories.accessibility.score * 100),
      bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
      seo: Math.round(lhr.categories.seo.score * 100),
      pwa: lhr.categories.pwa ? Math.round(lhr.categories.pwa.score * 100) : null,
    };
  }

  /**
   * Analyze Lighthouse results
   */
  analyzeResults(urlConfig, scores, lhr) {
    const analysis = {
      passed: true,
      warnings: [],
      errors: [],
      recommendations: [],
      metrics: {},
    };

    // Check against thresholds
    Object.entries(urlConfig.thresholds).forEach(([category, threshold]) => {
      const score = scores[category];
      if (score !== null && score < threshold) {
        analysis.passed = false;
        analysis.errors.push({
          category,
          score,
          threshold,
          message: `${category} score (${score}) is below threshold (${threshold})`,
        });
      }
    });

    // Extract Core Web Vitals
    const audits = lhr.audits;
    analysis.metrics = {
      firstContentfulPaint: audits['first-contentful-paint']?.numericValue,
      largestContentfulPaint: audits['largest-contentful-paint']?.numericValue,
      cumulativeLayoutShift: audits['cumulative-layout-shift']?.numericValue,
      totalBlockingTime: audits['total-blocking-time']?.numericValue,
      speedIndex: audits['speed-index']?.numericValue,
      timeToInteractive: audits['interactive']?.numericValue,
    };

    // Check Core Web Vitals thresholds
    if (analysis.metrics.firstContentfulPaint > 1800) {
      analysis.warnings.push('First Contentful Paint is slower than recommended (1.8s)');
    }

    if (analysis.metrics.largestContentfulPaint > 2500) {
      analysis.warnings.push('Largest Contentful Paint is slower than recommended (2.5s)');
    }

    if (analysis.metrics.cumulativeLayoutShift > 0.1) {
      analysis.warnings.push('Cumulative Layout Shift is higher than recommended (0.1)');
    }

    if (analysis.metrics.totalBlockingTime > 200) {
      analysis.warnings.push('Total Blocking Time is higher than recommended (200ms)');
    }

    // Generate recommendations
    this.generateRecommendations(analysis, audits);

    return analysis;
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations(analysis, audits) {
    // Image optimization recommendations
    if (audits['uses-optimized-images']?.score < 1) {
      analysis.recommendations.push({
        category: 'Images',
        priority: 'high',
        message: 'Optimize images to improve loading performance',
        details: audits['uses-optimized-images']?.details,
      });
    }

    // JavaScript optimization
    if (audits['unused-javascript']?.score < 1) {
      analysis.recommendations.push({
        category: 'JavaScript',
        priority: 'medium',
        message: 'Remove unused JavaScript to reduce bundle size',
        details: audits['unused-javascript']?.details,
      });
    }

    // CSS optimization
    if (audits['unused-css-rules']?.score < 1) {
      analysis.recommendations.push({
        category: 'CSS',
        priority: 'medium',
        message: 'Remove unused CSS rules to reduce stylesheet size',
        details: audits['unused-css-rules']?.details,
      });
    }

    // Caching recommendations
    if (audits['uses-long-cache-ttl']?.score < 1) {
      analysis.recommendations.push({
        category: 'Caching',
        priority: 'high',
        message: 'Implement longer cache TTL for static assets',
        details: audits['uses-long-cache-ttl']?.details,
      });
    }

    // Compression recommendations
    if (audits['uses-text-compression']?.score < 1) {
      analysis.recommendations.push({
        category: 'Compression',
        priority: 'high',
        message: 'Enable text compression (gzip/brotli) for better performance',
        details: audits['uses-text-compression']?.details,
      });
    }

    // Accessibility recommendations
    if (audits['color-contrast']?.score < 1) {
      analysis.recommendations.push({
        category: 'Accessibility',
        priority: 'high',
        message: 'Improve color contrast for better accessibility',
        details: audits['color-contrast']?.details,
      });
    }

    // SEO recommendations
    if (audits['meta-description']?.score < 1) {
      analysis.recommendations.push({
        category: 'SEO',
        priority: 'medium',
        message: 'Add meta descriptions to improve SEO',
        details: audits['meta-description']?.details,
      });
    }
  }

  /**
   * Save Lighthouse reports
   */
  async saveReports(pageName, formFactor, reports, lhr) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseFilename = `${pageName.toLowerCase().replace(/\s+/g, '-')}-${formFactor}-${timestamp}`;
    
    // Ensure output directory exists
    const outputDir = config.output.directory;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save HTML report
    if (Array.isArray(reports)) {
      const htmlReport = reports.find(report => typeof report === 'string' && report.includes('<html>'));
      if (htmlReport) {
        const htmlPath = path.join(outputDir, `${baseFilename}.html`);
        fs.writeFileSync(htmlPath, htmlReport);
        console.log(`📄 HTML report saved: ${htmlPath}`);
      }
    }

    // Save JSON report
    const jsonPath = path.join(outputDir, `${baseFilename}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(lhr, null, 2));
    console.log(`📊 JSON report saved: ${jsonPath}`);
  }

  /**
   * Run performance tests for all URLs
   */
  async runAllTests() {
    console.log('🚀 Starting Midas The Lifestyle Performance Testing');
    
    await this.initChrome();
    
    try {
      for (const urlConfig of config.urls) {
        // Test desktop
        const desktopResult = await this.runAudit(urlConfig, 'desktop');
        this.results.push(desktopResult);
        
        // Test mobile
        const mobileResult = await this.runAudit(urlConfig, 'mobile');
        this.results.push(mobileResult);
        
        // Wait between tests
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Generate summary report
      await this.generateSummaryReport();
      
    } finally {
      await this.closeChrome();
    }
  }

  /**
   * Generate summary report
   */
  async generateSummaryReport() {
    console.log('📊 Generating performance summary report');
    
    const summary = {
      timestamp: new Date().toISOString(),
      totalTests: this.results.length,
      passedTests: this.results.filter(r => r.analysis?.passed).length,
      failedTests: this.results.filter(r => r.analysis?.passed === false).length,
      errorTests: this.results.filter(r => r.error).length,
      results: this.results,
      averageScores: this.calculateAverageScores(),
      criticalIssues: this.getCriticalIssues(),
      recommendations: this.getTopRecommendations(),
    };
    
    // Save summary report
    const summaryPath = path.join(config.output.directory, 'performance-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    // Generate HTML summary
    const htmlSummary = this.generateHtmlSummary(summary);
    const htmlSummaryPath = path.join(config.output.directory, 'performance-summary.html');
    fs.writeFileSync(htmlSummaryPath, htmlSummary);
    
    console.log(`📋 Summary report saved: ${summaryPath}`);
    console.log(`📄 HTML summary saved: ${htmlSummaryPath}`);
    
    // Print console summary
    this.printConsoleSummary(summary);
  }

  /**
   * Calculate average scores across all tests
   */
  calculateAverageScores() {
    const validResults = this.results.filter(r => r.scores && !r.error);
    if (validResults.length === 0) return null;
    
    const totals = {
      performance: 0,
      accessibility: 0,
      bestPractices: 0,
      seo: 0,
      pwa: 0,
    };
    
    validResults.forEach(result => {
      Object.keys(totals).forEach(category => {
        if (result.scores[category] !== null) {
          totals[category] += result.scores[category];
        }
      });
    });
    
    const averages = {};
    Object.keys(totals).forEach(category => {
      averages[category] = Math.round(totals[category] / validResults.length);
    });
    
    return averages;
  }

  /**
   * Get critical issues across all tests
   */
  getCriticalIssues() {
    const issues = [];
    
    this.results.forEach(result => {
      if (result.analysis?.errors) {
        result.analysis.errors.forEach(error => {
          issues.push({
            page: result.name,
            formFactor: result.formFactor,
            ...error,
          });
        });
      }
    });
    
    return issues;
  }

  /**
   * Get top recommendations
   */
  getTopRecommendations() {
    const recommendations = new Map();
    
    this.results.forEach(result => {
      if (result.analysis?.recommendations) {
        result.analysis.recommendations.forEach(rec => {
          const key = `${rec.category}-${rec.message}`;
          if (recommendations.has(key)) {
            recommendations.get(key).count++;
          } else {
            recommendations.set(key, { ...rec, count: 1 });
          }
        });
      }
    });
    
    return Array.from(recommendations.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Generate HTML summary report
   */
  generateHtmlSummary(summary) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Midas The Lifestyle - Performance Report</title>
    <style>
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 20px; background: #0A0A0A; color: #FFFFFF; }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { color: #D4AF37; font-size: 2.5rem; font-weight: bold; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .metric { background: #1A1A1A; padding: 20px; border-radius: 8px; border: 1px solid #333; }
        .metric-value { font-size: 2rem; font-weight: bold; color: #D4AF37; }
        .results { margin-bottom: 40px; }
        .result { background: #1A1A1A; margin: 10px 0; padding: 15px; border-radius: 8px; border: 1px solid #333; }
        .score { display: inline-block; padding: 5px 10px; border-radius: 4px; margin: 2px; }
        .score.good { background: #4CAF50; }
        .score.average { background: #FF9800; }
        .score.poor { background: #F44336; }
        .recommendations { background: #1A1A1A; padding: 20px; border-radius: 8px; border: 1px solid #333; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">MIDAS THE LIFESTYLE</div>
        <h1>Performance Testing Report</h1>
        <p>Generated on ${new Date(summary.timestamp).toLocaleString()}</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <div class="metric-value">${summary.totalTests}</div>
            <div>Total Tests</div>
        </div>
        <div class="metric">
            <div class="metric-value">${summary.passedTests}</div>
            <div>Passed Tests</div>
        </div>
        <div class="metric">
            <div class="metric-value">${summary.failedTests}</div>
            <div>Failed Tests</div>
        </div>
        <div class="metric">
            <div class="metric-value">${summary.averageScores?.performance || 'N/A'}</div>
            <div>Avg Performance</div>
        </div>
    </div>
    
    <div class="results">
        <h2>Test Results</h2>
        ${summary.results.map(result => `
            <div class="result">
                <h3>${result.name} (${result.formFactor})</h3>
                ${result.scores ? Object.entries(result.scores).map(([category, score]) => 
                    `<span class="score ${score >= 90 ? 'good' : score >= 70 ? 'average' : 'poor'}">${category}: ${score}</span>`
                ).join('') : '<span class="score poor">Error: ' + result.error + '</span>'}
            </div>
        `).join('')}
    </div>
    
    <div class="recommendations">
        <h2>Top Recommendations</h2>
        <ul>
            ${summary.recommendations.map(rec => 
                `<li><strong>${rec.category}:</strong> ${rec.message} (${rec.count} occurrences)</li>`
            ).join('')}
        </ul>
    </div>
</body>
</html>`;
  }

  /**
   * Print console summary
   */
  printConsoleSummary(summary) {
    console.log('\n🎯 PERFORMANCE TESTING SUMMARY');
    console.log('================================');
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed: ${summary.passedTests}`);
    console.log(`Failed: ${summary.failedTests}`);
    console.log(`Errors: ${summary.errorTests}`);
    
    if (summary.averageScores) {
      console.log('\n📊 Average Scores:');
      Object.entries(summary.averageScores).forEach(([category, score]) => {
        const emoji = score >= 90 ? '🟢' : score >= 70 ? '🟡' : '🔴';
        console.log(`${emoji} ${category}: ${score}`);
      });
    }
    
    if (summary.criticalIssues.length > 0) {
      console.log('\n🚨 Critical Issues:');
      summary.criticalIssues.forEach(issue => {
        console.log(`❌ ${issue.page} (${issue.formFactor}): ${issue.message}`);
      });
    }
    
    console.log('\n✅ Performance testing completed!');
  }
}

// Export for use in other modules
module.exports = PerformanceTester;

// CLI usage
if (require.main === module) {
  const tester = new PerformanceTester();
  tester.runAllTests().catch(console.error);
}
