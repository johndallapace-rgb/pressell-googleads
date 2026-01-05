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
    // Priority: Explicit SEO config -> Template Logic -> Fallbacks
    if (product.seo?.title) {
        finalTitle = product.seo.title;
    } else {
        // Fallback logic
        switch (pageType) {
            case 'landing':
                finalTitle = product.headline;
                break;
            default:
                finalTitle = `${product.name} - Info`;
        }
    }

    if (product.seo?.description) {
        finalDescription = product.seo.description;
    } else {
        finalDescription = product.subheadline || product.headline;
    }
  }

  // Handle Multi-language Canonical
  // If we are in a subfolder (e.g. /de/amino), the path passed in should reflect that.
  // The caller (page.tsx) is responsible for passing the public path, not the internal rewritten one.
  
  const baseUrl = 'https://health.topproductofficial.com'; // Enforce production domain for SEO consistency
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
