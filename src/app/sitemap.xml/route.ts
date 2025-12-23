import { product } from '@/data/products';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const urls: string[] = [];

  // Home (redirects to product, but good to index)
  urls.push(`
    <url>
      <loc>${baseUrl}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>daily</changefreq>
      <priority>1.0</priority>
    </url>
  `);

  // Product Page
  urls.push(`
    <url>
      <loc>${baseUrl}/${product.slug}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.9</priority>
    </url>
  `);

  // Legal pages
  ['legal/privacy', 'legal/terms', 'legal/disclaimer'].forEach(path => {
    urls.push(`
      <url>
        <loc>${baseUrl}/${path}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.5</priority>
      </url>
    `);
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
