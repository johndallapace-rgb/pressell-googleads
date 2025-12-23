import LayoutShell from '@/components/LayoutShell';
import { getDictionary } from '@/i18n/getDictionary';
import { PageProps } from '@/types';
import { Locale } from '@/i18n/i18n-config';

export default async function OfflinePage({ params }: PageProps) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  return (
    <LayoutShell lang={locale} dict={dict}>
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">{dict.common.offlineTitle}</h1>
        <p className="text-gray-600 text-lg">
          {dict.common.offlineMessage}
        </p>
      </div>
    </LayoutShell>
  );
}
