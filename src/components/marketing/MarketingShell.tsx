import { ReactNode } from 'react';
import { MarketingFooter } from './MarketingFooter';
import { MarketingHeader } from './MarketingHeader';

type MarketingShellProps = {
  active?: 'home' | 'platform' | 'google-ads-api-use-case' | 'compliance' | 'about' | 'contact';
  children: ReactNode;
};

export function MarketingShell({ active, children }: MarketingShellProps) {
  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans flex flex-col">
      <MarketingHeader active={active} />
      <div className="flex-1">{children}</div>
      <MarketingFooter />
    </div>
  );
}

