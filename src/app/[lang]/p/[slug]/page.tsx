import { notFound } from 'next/navigation';
import { getProduct } from '@/data/products';
import ProductHero from '@/components/ProductHero';
import FAQAccordion from '@/components/FAQAccordion';
import ReviewList from '@/components/ReviewList';
import StickyCTA from '@/components/StickyCTA';
import { generateSeoMetadata } from '@/lib/seo';
import Link from 'next/link';
import { getDictionary } from '@/i18n/getDictionary';
import { PageProps } from '@/types';
import { Locale } from '@/i18n/i18n-config';

export async function generateMetadata({ params }: PageProps) {
  const { lang, slug } = await params;
  if (!slug) return {};
  const product = getProduct(slug);
  const locale = lang as Locale;
  if (!product) return {};
  return generateSeoMetadata({ product, lang: locale }, 'landing');
}

export async function generateStaticParams() {
  return [];
}

export default async function ProductPage({ params }: PageProps) {
  const { lang, slug } = await params;
  if (!slug) notFound();
  
  const product = getProduct(slug);
  if (!product) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const t = product.translations[locale] || product.translations['en'];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <ProductHero product={product} lang={locale} />

      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-8 text-center">{dict.common.whyRecommend} {t.name}</h2>
        <div className="prose lg:prose-xl mx-auto text-gray-700">
           <p>
             {t.subHeadline}
           </p>
           <div className="my-8 p-6 bg-blue-50 rounded-xl border border-blue-100 text-center">
             <h3 className="text-xl font-bold mb-2">{dict.common.notSure}</h3>
             <p className="mb-4">{dict.common.takeQuiz}</p>
             <Link 
               href={`/${lang}/p/${product.slug}/quiz`}
               className="inline-block bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors"
             >
               {dict.common.takeQuiz}
             </Link>
           </div>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-8 text-center">{dict.common.customerReviews}</h2>
        <ReviewList reviews={t.reviews} />
      </section>

      <section className="mb-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center">{dict.common.faq}</h2>
        <FAQAccordion items={t.faqs} />
      </section>
      
      <StickyCTA 
        href={product.officialUrl} 
        label={t.ctaLabel} 
        trackingData={{ product: product.slug, variant: 'default', lang }}
      />
    </div>
  );
}
