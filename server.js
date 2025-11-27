// server.js
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for proper HTTPS detection
app.set("trust proxy", 1);

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
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    sites: Object.keys(siteRedirects).length,
  });
});

// Root endpoint - show available sites
app.get("/", (req, res) => {
  const sites = Object.keys(siteRedirects).map((key) => ({
    path: `/${key}`,
    target: siteRedirects[key],
  }));

  res.json({
    message: "Redirect Service",
    availableSites: sites,
    usage: "Visit /{site1|site2|...} to redirect",
  });
});

// Dynamic redirect routes
Object.keys(siteRedirects).forEach((key) => {
  app.get(`/${key}`, (req, res) => {
    const targetUrl = siteRedirects[key];
    console.log(`Redirecting ${key} to ${targetUrl}`);
    res.redirect(301, targetUrl);
  });

  // Also handle with trailing slash
  app.get(`/${key}/*`, (req, res) => {
    const targetUrl = siteRedirects[key];
    const path = req.params[0] ? `/${req.params[0]}` : "";
    const fullUrl =
      targetUrl +
      path +
      (req.url.includes("?") ? req.url.substring(req.url.indexOf("?")) : "");
    console.log(`Redirecting ${key}${path} to ${fullUrl}`);
    res.redirect(301, fullUrl);
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    availableSites: Object.keys(siteRedirects),
  });
});

app.listen(PORT, () => {
  console.log(`Redirect service running on port ${PORT}`);
  console.log("Available redirects:");
  Object.entries(siteRedirects).forEach(([key, url]) => {
    console.log(`  /${key} -> ${url}`);
  });
});
