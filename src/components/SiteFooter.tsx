import Link from 'next/link';

interface SiteFooterProps {
  vertical?: string;
}

export function SiteFooter({ vertical = 'general' }: SiteFooterProps) {
  const year = new Date().getFullYear();

  const getDisclaimer = () => {
    return "Disclaimer: This website provides information about an internal advertising operations platform. Content is provided for transparency and general informational purposes and does not constitute professional advice.";
  };

  return (
    <footer className="bg-gray-900 text-gray-400 py-12 text-sm font-sans border-t border-gray-800 mt-auto">
      <div className="container mx-auto px-4 text-center space-y-6 max-w-4xl">
        
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
          <p className="font-semibold text-gray-300 mb-2 uppercase tracking-wider text-xs">Disclosure</p>
          <p className="text-xs leading-relaxed">
            Top Product Official is an internal advertising operations platform used by our team to support compliant campaign workflows, reporting, and diagnostics. This page is provided for transparency and compliance context.
          </p>
        </div>

        {/* Dynamic Disclaimer */}
        <div className="text-xs text-gray-500 leading-relaxed">
           <strong className="text-gray-400">Disclaimer:</strong> {getDisclaimer()}
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-6 pt-4 border-t border-gray-800">
           <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
           <Link href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
           <Link href="/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link>
           {/* Admin link removed for security */}
        </div>

        {/* Copyright */}
        <p className="pt-4 text-xs text-gray-600">
          © {year} Top Product Official. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
