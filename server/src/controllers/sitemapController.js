import App from '../models/App.js';
import Category from '../models/Category.js';
import User from '../models/User.js';

/**
 * Sitemap & Robots Controller (Phase 9 SEO)
 * Dynamically produces XML sitemaps and crawler directives.
 */
export const getSitemapXml = async (req, res, next) => {
  try {
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    // 1. Fetch all published applications
    const apps = await App.find({
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
    })
      .select('slug updatedAt publishedAt')
      .lean();

    // 2. Fetch all categories
    const categories = await Category.find().select('slug updatedAt').lean();

    // 3. Fetch public developers
    const developers = await User.find({
      role: { $in: ['DEVELOPER', 'ADMIN'] },
      accountStatus: 'ACTIVE',
    })
      .select('_id updatedAt')
      .lean();

    // Build XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static pages
    const staticPages = [
      { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
      { loc: `${baseUrl}/explore`, priority: '0.9', changefreq: 'daily' },
      { loc: `${baseUrl}/categories`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${baseUrl}/search`, priority: '0.7', changefreq: 'daily' },
    ];

    staticPages.forEach((p) => {
      xml += `  <url>\n    <loc>${p.loc}</loc>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>\n`;
    });

    // Dynamic application detail pages
    apps.forEach((a) => {
      const lastMod = (a.updatedAt || a.publishedAt || new Date()).toISOString().split('T')[0];
      xml += `  <url>\n    <loc>${baseUrl}/apps/${a.slug}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    });

    // Dynamic categories
    categories.forEach((c) => {
      xml += `  <url>\n    <loc>${baseUrl}/explore?category=${c.slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    });

    // Public developer profiles
    developers.forEach((d) => {
      xml += `  <url>\n    <loc>${baseUrl}/developers/${d._id}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
    });

    xml += `</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    next(error);
  }
};

export const getRobotsTxt = (req, res) => {
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const content = `User-agent: *
Allow: /
Allow: /explore
Allow: /categories
Allow: /apps/
Allow: /developers/
Allow: /search

Disallow: /admin/
Disallow: /developer/
Disallow: /api/
Disallow: /profile
Disallow: /my-downloads
Disallow: /login
Disallow: /signup
Disallow: /reset-password
Disallow: /verify-email

Sitemap: ${baseUrl}/sitemap.xml
`;

  res.setHeader('Content-Type', 'text/plain');
  res.send(content);
};
