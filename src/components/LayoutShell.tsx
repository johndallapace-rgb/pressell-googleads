import { ReactNode } from 'react';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';

interface LayoutShellProps {
  children: ReactNode;
  vertical?: string;
}

export default function LayoutShell({ children, vertical = 'general' }: LayoutShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
      <SiteHeader />

      <main className="flex-grow">
        {children}
      </main>

      <SiteFooter vertical={vertical} />
    </div>
  );
}
