import { notFound } from 'next/navigation';
import { getProduct } from '@/data/products';
import CTAButton from '@/components/CTAButton';
import { generateSeoMetadata } from '@/lib/seo';
import { getDictionary } from '@/i18n/getDictionary';
import VideoReview from '@/components/VideoReview';
import { PageProps } from '@/types';
import { Locale } from '@/i18n/i18n-config';

export async function generateMetadata({ params }: PageProps) {
  const { lang, slug } = await params;
  if (!slug) return {};
  const product = getProduct(slug);
  const locale = lang as Locale;
  if (!product) return {};
  return generateSeoMetadata({ product, lang: locale }, 'review');
}

export async function generateStaticParams() {
  return []; 
}

export default async function ReviewPage({ params }: PageProps) {
  const { lang, slug } = await params;
  if (!slug) notFound();
  
  const product = getProduct(slug);
  if (!product) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const t = product.translations[locale] || product.translations['en'];

  // Default fallback result if quiz not taken/no params
  const defaultResult = t.quiz.resultMap[0]; 

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl text-center">
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 mb-8">
        <h1 className="text-3xl font-bold text-green-800 mb-4">{dict.common.goodNews}</h1>
        <p className="text-xl text-green-700 mb-6">
          {dict.common.matchMessage}
        </p>

        {t.videoReview && (
          <VideoReview video={t.videoReview} disclaimer={dict.common.videoDisclaimer} />
        )}

        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
           <h2 className="text-lg font-bold mb-2 text-gray-900">{dict.common.recommendation}</h2>
           <p className="text-gray-600">
             {defaultResult?.text || dict.common.recommendationSub}
           </p>
        </div>
        <CTAButton 
          href={product.officialUrl} 
          label={t.ctaLabel} 
          fullWidth 
          trackingData={{ product: product.slug, variant: 'default', lang }}
        />
      </div>
      
      <p className="text-gray-500 text-sm">
        {dict.common.limitedAvailability}
      </p>
    </div>
  );
}
