export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  const txt = `User-agent: *
Allow: /
Sitemap: ${baseUrl}/sitemap.xml`;

  return new Response(txt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
