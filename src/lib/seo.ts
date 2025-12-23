import { Metadata } from 'next';
import { Product } from '@/data/products';
import { i18n, Locale } from '@/i18n/i18n-config';

type PageType = 'landing' | 'quiz' | 'review' | 'legal';

interface SeoProps {
  product?: Product;
  title?: string;
  description?: string;
  path?: string; // Relative path, e.g., /p/mitolyn
  lang?: Locale;
}

export function generateSeoMetadata({ product, title, description, path, lang = 'en' }: SeoProps, pageType: PageType = 'landing'): Metadata {
  let finalTitle = title || 'Presell Offer';
  let finalDescription = description || 'Special offer available now.';

  if (product) {
    const t = product.translations[lang] || product.translations['en'];
    
    // We should ideally use translated templates for titles too, but for now we keep structure
    // Or we could fetch from dict if passed. 
    // To keep it simple and safe for Google Ads, we use the translated heroHeadline which is usually the H1.
    
    switch (pageType) {
      case 'landing':
        finalTitle = t.heroHeadline;
        break;
      case 'quiz':
        // A generic fallback if not perfectly translated in code
        finalTitle = `${t.name} - Quiz`;
        break;
      case 'review':
        finalTitle = `${t.name} - Review`;
        break;
      default:
        finalTitle = `${t.name} - Info`;
    }
    finalDescription = t.subHeadline || t.heroHeadline;
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  // Clean path to ensure no double slashes
  const cleanPath = path?.startsWith('/') ? path : `/${path}`;
  
  // Generate hreflangs
  const languages: Record<string, string> = {};
  i18n.locales.forEach(locale => {
    // If path is provided (e.g. /p/mitolyn), append to locale
    // If not, it's homepage or static
    if (path) {
      languages[locale] = `${baseUrl}/${locale}${cleanPath}`;
    }
  });

  return {
    title: finalTitle,
    description: finalDescription,
    applicationName: 'Presell App',
    authors: [{ name: 'Editorial Team' }],
    openGraph: {
      type: 'website',
      title: finalTitle,
      description: finalDescription,
      siteName: 'Health Information',
    },
    twitter: {
      card: 'summary_large_image',
      title: finalTitle,
      description: finalDescription,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    alternates: {
      canonical: `${baseUrl}/${lang}${cleanPath || ''}`,
      languages: languages,
    },
  };
}
