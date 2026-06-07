export async function GET() {
  const rawBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  let baseUrl = rawBaseUrl;

  try {
    baseUrl = new URL(rawBaseUrl).origin;
  } catch {
    try {
      baseUrl = new URL(`https://${rawBaseUrl}`).origin;
    } catch {
      baseUrl = 'http://localhost:3000';
    }
  }

  try {
    const parsed = new URL(baseUrl);
    if (parsed.hostname === 'topproductofficial.com' || parsed.hostname === 'www.topproductofficial.com') {
      baseUrl = 'https://www.topproductofficial.com';
    }
  } catch {}

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
