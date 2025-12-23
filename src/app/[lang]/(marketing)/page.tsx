import { products } from '@/data/products';
import ProductCard from '@/components/ProductCard';
import { getDictionary } from '@/i18n/getDictionary';
import { PageProps } from '@/types';
import { Locale } from '@/i18n/i18n-config';

export default async function HomePage({ params }: PageProps) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-4 text-gray-900">{dict.common.whyRecommend}</h1>
      <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
        {dict.common.recommendationSub}
      </p>
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {products.map(p => (
          <ProductCard key={p.slug} product={p} lang={locale} dict={dict} />
        ))}
      </div>
    </div>
  );
}
