import { Metadata } from 'next';
import { ProductConfig } from '@/lib/config';

type PageType = 'landing' | 'quiz' | 'review' | 'legal';

interface SeoProps {
  product?: ProductConfig;
  title?: string;
  description?: string;
  path?: string; 
}

export function generateSeoMetadata({ product, title, description, path }: SeoProps, pageType: PageType = 'landing'): Metadata {
  let finalTitle = title || 'SmartHealthChoices';
  let finalDescription = description || 'Independent product reviews.';

  if (product) {
    switch (pageType) {
      case 'landing':
        finalTitle = product.headline;
        break;
      default:
        finalTitle = `${product.name} - Info`;
    }
    finalDescription = product.subheadline || product.headline;
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const cleanPath = path?.startsWith('/') ? path : `/${path || ''}`;
  
  return {
    title: finalTitle,
    description: finalDescription,
    applicationName: 'SmartHealthChoices',
    openGraph: {
      type: 'website',
      title: finalTitle,
      description: finalDescription,
      siteName: 'SmartHealthChoices',
    },
    twitter: {
      card: 'summary_large_image',
      title: finalTitle,
      description: finalDescription,
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `${baseUrl}${cleanPath}`,
    },
  };
}
