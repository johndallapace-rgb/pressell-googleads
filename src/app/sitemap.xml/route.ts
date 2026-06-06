export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  const urls: string[] = [];

  const now = new Date().toISOString();

  const canonicalPaths = [
    '/',
    '/about',
    '/contact',
    '/platform',
    '/google-ads-api-use-case',
    '/developers/google-ads-api',
    '/compliance',
    '/privacy-policy',
    '/terms-of-service',
    '/disclaimer',
  ];

  canonicalPaths.forEach((path) => {
    const loc = path === '/' ? baseUrl : `${baseUrl}${path}`;
    urls.push(`
      <url>
        <loc>${loc}</loc>
        <lastmod>${now}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
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
