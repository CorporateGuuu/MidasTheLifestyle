# Custom Domain Setup Guide - Midas The Lifestyle
## Configure midasthelifestyle.com to serve the luxury rental platform

### 🎯 **OBJECTIVE**
Configure https://midasthelifestyle.com to display the exact same content, styling, and functionality as https://midasthelifestyle.netlify.app with complete parity.

---

## 📋 **STEP-BY-STEP CONFIGURATION**

### **Step 1: Netlify Domain Settings**

1. **Access Netlify Dashboard**
   - Go to https://app.netlify.com/
   - Navigate to your "MidasTheLifestyle" site
   - Click on "Domain settings" in the left sidebar

2. **Add Custom Domain**
   - Click "Add custom domain"
   - Enter: `midasthelifestyle.com`
   - Click "Verify"
   - Netlify will show DNS configuration requirements

3. **Configure Domain Aliases**
   - Add both: `midasthelifestyle.com` and `www.midasthelifestyle.com`
   - Set `midasthelifestyle.com` as primary domain
   - Enable automatic HTTPS/SSL certificate

---

### **Step 2: DNS Configuration**

#### **Required DNS Records:**

**A Records (for midasthelifestyle.com):**
```
Type: A
Name: @
Value: 75.2.60.5
TTL: 3600
```

**CNAME Record (for www subdomain):**
```
Type: CNAME
Name: www
Value: midasthelifestyle.netlify.app
TTL: 3600
```

**Alternative: CNAME for Apex Domain (if supported by DNS provider):**
```
Type: CNAME
Name: @
Value: midasthelifestyle.netlify.app
TTL: 3600
```

#### **DNS Provider Instructions:**

**For Cloudflare:**
1. Login to Cloudflare dashboard
2. Select midasthelifestyle.com domain
3. Go to DNS settings
4. Add the A record and CNAME record above
5. Ensure proxy status is "DNS only" (gray cloud)

**For GoDaddy:**
1. Login to GoDaddy account
2. Go to DNS Management for midasthelifestyle.com
3. Add A record pointing @ to 75.2.60.5
4. Add CNAME record pointing www to midasthelifestyle.netlify.app

**For Namecheap:**
1. Login to Namecheap account
2. Go to Domain List → Manage
3. Advanced DNS tab
4. Add A record and CNAME record as specified above

---

### **Step 3: SSL Certificate Configuration**

1. **Automatic SSL (Recommended)**
   - Netlify will automatically provision Let's Encrypt SSL
   - This happens automatically after DNS propagation
   - Usually takes 24-48 hours for full propagation

2. **Force HTTPS Redirect**
   - In Netlify Domain settings
   - Enable "Force HTTPS" option
   - This redirects all HTTP traffic to HTTPS

3. **HSTS Configuration**
   - Add security headers in netlify.toml
   - Enhance security and SEO performance

---

### **Step 4: Netlify Configuration Updates**

Update netlify.toml with custom domain optimizations:

```toml
[build]
  publish = "."
  command = "node build.js && echo 'CUSTOM DOMAIN DEPLOYMENT'"
  functions = "netlify/functions"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"

[[headers]]
  for = "*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.jpg"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "*.png"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[redirects]]
  from = "https://www.midasthelifestyle.com/*"
  to = "https://midasthelifestyle.com/:splat"
  status = 301
  force = true

[[redirects]]
  from = "http://midasthelifestyle.com/*"
  to = "https://midasthelifestyle.com/:splat"
  status = 301
  force = true

[[redirects]]
  from = "http://www.midasthelifestyle.com/*"
  to = "https://midasthelifestyle.com/:splat"
  status = 301
  force = true
```

---

### **Step 5: Verification and Testing**

#### **DNS Propagation Check**
```bash
# Check A record
dig midasthelifestyle.com A

# Check CNAME record
dig www.midasthelifestyle.com CNAME

# Check from different locations
nslookup midasthelifestyle.com 8.8.8.8
```

#### **SSL Certificate Verification**
- Use SSL Labs test: https://www.ssllabs.com/ssltest/
- Check certificate validity and security rating
- Ensure A+ rating for security

#### **Content Verification Checklist**
- [ ] Homepage loads with luxury black/gold theme
- [ ] All vehicle catalogs display correctly
- [ ] Yacht, jet, and property sections functional
- [ ] "Washington, DC" formatting preserved throughout
- [ ] Contact forms and booking system operational
- [ ] Mobile responsiveness maintained
- [ ] All images and assets loading correctly
- [ ] Performance metrics maintained (<3 second load time)

---

### **Step 6: SEO and Performance Optimization**

#### **Update Meta Tags for Custom Domain**
```html
<meta property="og:url" content="https://midasthelifestyle.com/">
<meta property="twitter:url" content="https://midasthelifestyle.com/">
<link rel="canonical" href="https://midasthelifestyle.com/">
```

#### **Update Sitemap**
```xml
<loc>https://midasthelifestyle.com/</loc>
```

#### **Google Search Console**
1. Add midasthelifestyle.com as new property
2. Verify ownership via DNS TXT record
3. Submit updated sitemap
4. Monitor indexing and performance

---

## ⏱️ **TIMELINE EXPECTATIONS**

### **Immediate (0-2 hours)**
- DNS record configuration
- Netlify domain settings update
- SSL certificate request initiated

### **Short-term (2-24 hours)**
- DNS propagation begins
- SSL certificate provisioning
- Initial domain accessibility

### **Complete (24-48 hours)**
- Full DNS propagation worldwide
- SSL certificate fully active
- All functionality verified
- SEO indexing begins

---

## 🔧 **TROUBLESHOOTING**

### **Common Issues and Solutions**

**Domain not resolving:**
- Check DNS records are correct
- Wait for propagation (up to 48 hours)
- Clear local DNS cache

**SSL certificate issues:**
- Ensure DNS is fully propagated
- Check Netlify SSL settings
- Contact Netlify support if needed

**Content not matching:**
- Verify latest deployment is active
- Check for caching issues
- Force refresh with Ctrl+F5

**Performance issues:**
- Monitor Netlify analytics
- Check CDN configuration
- Optimize images if needed

---

## 📊 **SUCCESS METRICS**

### **Technical Verification**
- [ ] DNS resolves correctly (A and CNAME records)
- [ ] SSL certificate active and secure (A+ rating)
- [ ] All pages load correctly on custom domain
- [ ] Performance metrics maintained
- [ ] Mobile responsiveness preserved

### **Content Verification**
- [ ] Luxury black/gold theme displays correctly
- [ ] All 9 phases of development features functional
- [ ] "Washington, DC" formatting preserved
- [ ] Vehicle catalogs and booking system operational
- [ ] Contact forms and communication working

### **SEO and Analytics**
- [ ] Google Search Console configured
- [ ] Analytics tracking updated
- [ ] Sitemap submitted and indexed
- [ ] Social media meta tags updated

---

## 🎯 **FINAL RESULT**

Upon completion, https://midasthelifestyle.com will serve as the primary production URL with:

✅ **Complete Content Parity**: Identical to Netlify staging URL
✅ **Luxury Styling**: Full black/gold theme preserved
✅ **Professional Formatting**: "Washington, DC" throughout
✅ **SSL Security**: A+ rated security certificate
✅ **Performance**: Fast loading times maintained
✅ **SEO Optimization**: Search engine ready
✅ **Mobile Responsive**: Perfect on all devices

**The luxury rental platform will be ready to serve elite clientele on the professional midasthelifestyle.com domain.** ✨
