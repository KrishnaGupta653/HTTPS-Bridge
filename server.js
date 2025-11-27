// server.js
const express = require('express');
const app = express();

// Render automatically assigns PORT - must use this for web services
const PORT = process.env.PORT || 10000;

// Trust proxy for proper HTTPS detection on Render
app.set('trust proxy', true);

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Parse environment variables for site redirects
function getSiteRedirects() {
  const redirects = {};
  let i = 1;
  
  while (process.env[`SITE${i}`]) {
    redirects[`site${i}`] = process.env[`SITE${i}`];
    i++;
  }
  
  return redirects;
}

const siteRedirects = getSiteRedirects();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    sites: Object.keys(siteRedirects).length 
  });
});

// Root endpoint - show available sites
app.get('/', (req, res) => {
  const sites = Object.keys(siteRedirects).map(key => ({
    path: `/${key}`,
    target: siteRedirects[key]
  }));
  
  res.json({
    message: 'Redirect Service',
    availableSites: sites,
    usage: 'Visit /{site1|site2|...} to redirect'
  });
});

// Dynamic redirect routes
Object.keys(siteRedirects).forEach(key => {
  // Exact path redirect
  app.get(`/${key}`, (req, res) => {
    const targetUrl = siteRedirects[key];
    console.log(`Redirecting ${key} to ${targetUrl}`);
    res.redirect(301, targetUrl);
  });
  
  // Catch all subpaths - use simple wildcard
  app.use(`/${key}`, (req, res) => {
    const targetUrl = siteRedirects[key];
    const path = req.path;
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    const fullUrl = targetUrl + path + queryString;
    console.log(`Redirecting ${key}${path} to ${fullUrl}`);
    res.redirect(301, fullUrl);
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    availableSites: Object.keys(siteRedirects)
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Redirect service running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('📍 Available redirects:');
  Object.entries(siteRedirects).forEach(([key, url]) => {
    console.log(`  /${key} -> ${url}`);
  });
  
  if (Object.keys(siteRedirects).length === 0) {
    console.log('⚠️  No redirect sites configured. Add SITE1, SITE2, etc. to environment variables.');
  }
});

