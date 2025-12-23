import Link from 'next/link';
import { Product } from '@/data/products';
import { Locale } from '@/i18n/i18n-config';
import { Dictionary } from '@/i18n/getDictionary';

interface Props {
  product: Product;
  lang: Locale;
  dict: Dictionary;
}

export default function ProductCard({ product, lang, dict }: Props) {
  const t = product.translations[lang] || product.translations['en'];

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden flex flex-col">
      <div className="h-48 bg-gray-100 flex items-center justify-center relative">
        <span className="text-gray-400 font-bold uppercase tracking-widest">{t.name}</span>
      </div>
      <div className="p-6 flex-grow flex flex-col">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{t.name}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {t.heroHeadline}
        </p>
        <div className="mt-auto space-y-3">
          <Link 
            href={`/${lang}/p/${product.slug}`}
            className="block w-full text-center bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {dict.common.readReview}
          </Link>
          <Link 
            href={`/${lang}/p/${product.slug}/quiz`}
            className="block w-full text-center bg-white border border-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {dict.common.takeQuiz}
          </Link>
        </div>
      </div>
    </div>
  );
}
