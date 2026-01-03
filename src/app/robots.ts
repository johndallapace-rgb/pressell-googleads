import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/admin/', '/admin/login'],
    },
    sitemap: 'https://www.topproductofficial.com/sitemap.xml',
  };
}
