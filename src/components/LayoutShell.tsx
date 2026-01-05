import { ReactNode } from 'react';
import { BrandHeader } from '@/components/public/BrandHeader';
import { BrandFooter } from '@/components/public/BrandFooter';

interface LayoutShellProps {
  children: ReactNode;
  vertical?: string;
  supportEmail?: string;
  locale?: string;
}

export default function LayoutShell({ children, vertical = 'general', supportEmail, locale = 'en' }: LayoutShellProps) {
  // Pass locale to children or use context in future if needed
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans" lang={locale}>
      <BrandHeader locale={locale} />

      <main className="flex-grow">
        {children}
      </main>

      <BrandFooter vertical={vertical} supportEmail={supportEmail} locale={locale} />
    </div>
  );
}
