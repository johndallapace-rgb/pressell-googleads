import Link from 'next/link';
import { Inter } from 'next/font/google';
import brandSettings from '@/data/brand-settings.json';

const inter = Inter({ subsets: ['latin'] });

interface BrandHeaderProps {
  locale?: string;
}

export function BrandHeader({ locale = 'en' }: BrandHeaderProps) {
  const isDe = locale === 'de';
  const isFr = locale === 'fr';

  const t = {
      privacy: isDe ? 'Datenschutz' : isFr ? 'Confidentialité' : 'Privacy',
      terms: isDe ? 'AGB' : isFr ? 'CGV' : 'Terms',
      disclaimer: isDe ? 'Haftungsausschluss' : isFr ? 'Avis' : 'Disclaimer',
      advertorial: isDe ? 'Werbeanzeige' : isFr ? 'Publicité' : 'Advertorial'
  };

  return (
    <header className="bg-white border-b border-gray-200 py-4 shadow-sm">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className={`text-xl md:text-2xl font-bold text-gray-900 tracking-tight ${inter.className}`}>
          {brandSettings.logo_text.replace('Official', '')}<span className="text-blue-700">Official</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6 text-xs text-gray-500 font-medium uppercase tracking-wider">
          <Link href="/legal/privacy" className="hover:text-blue-600 transition-colors">{t.privacy}</Link>
          <Link href="/legal/terms" className="hover:text-blue-600 transition-colors">{t.terms}</Link>
          <Link href="/legal/disclaimer" className="hover:text-blue-600 transition-colors">{t.disclaimer}</Link>
        </nav>

        {/* Mobile menu placeholder or simple text */}
        <div className="md:hidden text-xs text-gray-400 font-medium uppercase tracking-wide">
          {t.advertorial}
        </div>
      </div>
    </header>
  );
}
