import Link from 'next/link';

type MarketingHeaderProps = {
  active?: 'home' | 'platform' | 'google-ads-api-use-case' | 'compliance' | 'about' | 'contact';
};

export function MarketingHeader({ active }: MarketingHeaderProps) {
  return (
    <header className="border-b border-black/5 sticky top-0 bg-white/80 backdrop-blur-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center text-white font-semibold">
            T
          </div>
          <Link href="/" className="font-semibold text-lg tracking-tight hover:text-neutral-700 transition-colors">
            Top Product Official
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600">
          <Link href="/" className={active === 'home' ? 'text-neutral-900' : 'hover:text-neutral-900 transition-colors'}>
            Home
          </Link>
          <Link
            href="/platform"
            className={active === 'platform' ? 'text-neutral-900' : 'hover:text-neutral-900 transition-colors'}
          >
            Platform
          </Link>
          <Link
            href="/google-ads-api-use-case"
            className={
              active === 'google-ads-api-use-case' ? 'text-neutral-900' : 'hover:text-neutral-900 transition-colors'
            }
          >
            Google Ads API
          </Link>
          <Link
            href="/compliance"
            className={active === 'compliance' ? 'text-neutral-900' : 'hover:text-neutral-900 transition-colors'}
          >
            Compliance
          </Link>
          <Link href="/about" className={active === 'about' ? 'text-neutral-900' : 'hover:text-neutral-900 transition-colors'}>
            About
          </Link>
          <Link
            href="/contact"
            className={active === 'contact' ? 'text-neutral-900' : 'hover:text-neutral-900 transition-colors'}
          >
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
}

