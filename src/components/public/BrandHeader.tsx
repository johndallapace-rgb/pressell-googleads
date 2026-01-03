import Link from 'next/link';

export function BrandHeader() {
  return (
    <header className="bg-white border-b border-gray-200 py-4 shadow-sm">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight font-serif">
          TopProduct<span className="text-blue-700">Digest</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6 text-xs text-gray-500 font-medium uppercase tracking-wider">
          <Link href="/legal/privacy" className="hover:text-blue-600 transition-colors">Privacy</Link>
          <Link href="/legal/terms" className="hover:text-blue-600 transition-colors">Terms</Link>
          <Link href="/legal/disclaimer" className="hover:text-blue-600 transition-colors">Disclaimer</Link>
        </nav>

        {/* Mobile menu placeholder or simple text */}
        <div className="md:hidden text-xs text-gray-400 font-medium uppercase tracking-wide">
          Advertorial
        </div>
      </div>
    </header>
  );
}
