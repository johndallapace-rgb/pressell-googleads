import { notFound } from 'next/navigation';
import { getProductWithConfig } from '@/lib/product-helper';
import QuizShell from '@/components/Quiz/QuizShell';
import { generateSeoMetadata } from '@/lib/seo';
import { getDictionary } from '@/i18n/getDictionary';
import { PageProps } from '@/types';
import { Locale } from '@/i18n/i18n-config';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps) {
  const { lang, slug } = await params;
  if (!slug) return {};
  const product = await getProductWithConfig(slug);
  const locale = lang as Locale;
  if (!product) return {};
  return generateSeoMetadata({ product, lang: locale }, 'quiz');
}

export default async function QuizPage({ params }: PageProps) {
  const { lang, slug } = await params;
  if (!slug) notFound();
  
  const product = await getProductWithConfig(slug);
  if (!product) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
        {dict.common.notSure}
      </h1>
      <p className="text-center text-gray-600 mb-8">
        {dict.common.takeQuiz}
      </p>
      <QuizShell product={product} lang={locale} dict={dict} />
    </div>
  );
}
