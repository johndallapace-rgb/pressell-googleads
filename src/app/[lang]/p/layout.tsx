import LayoutShell from '@/components/LayoutShell';
import { getDictionary } from '@/i18n/getDictionary';
import { LayoutProps } from '@/types';
import { Locale } from '@/i18n/i18n-config';

export default async function ProductLayout({ children, params }: LayoutProps) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  return (
    <LayoutShell lang={locale} dict={dict}>
      {children}
    </LayoutShell>
  );
}
