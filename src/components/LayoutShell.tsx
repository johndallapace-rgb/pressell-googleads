import { ReactNode } from 'react';
import { BrandHeader } from '@/components/public/BrandHeader';
import { BrandFooter } from '@/components/public/BrandFooter';

interface LayoutShellProps {
  children: ReactNode;
  vertical?: string;
  supportEmail?: string;
}

export default function LayoutShell({ children, vertical = 'general', supportEmail }: LayoutShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
      <BrandHeader />

      <main className="flex-grow">
        {children}
      </main>

      <BrandFooter vertical={vertical} supportEmail={supportEmail} />
    </div>
  );
}
