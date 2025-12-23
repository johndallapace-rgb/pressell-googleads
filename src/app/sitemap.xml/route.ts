import { products } from '@/data/products';
import { i18n } from '@/i18n/i18n-config';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const urls: string[] = [];

  // Home pages per locale
  i18n.locales.forEach(locale => {
    urls.push(`
    <url>
      <loc>${baseUrl}/${locale}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>daily</changefreq>
      <priority>1.0</priority>
    </url>
    `);
  });

  // Product pages per locale
  products.forEach(p => {
    i18n.locales.forEach(locale => {
      urls.push(`
        <url>
          <loc>${baseUrl}/${locale}/p/${p.slug}</loc>
          <lastmod>${new Date().toISOString()}</lastmod>
          <changefreq>daily</changefreq>
          <priority>0.8</priority>
        </url>
        <url>
          <loc>${baseUrl}/${locale}/p/${p.slug}/quiz</loc>
          <lastmod>${new Date().toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.7</priority>
        </url>
        <url>
          <loc>${baseUrl}/${locale}/p/${p.slug}/review</loc>
          <lastmod>${new Date().toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.9</priority>
        </url>
      `);
    });
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.join('')}
  </urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
