import Link from 'next/link';

interface SiteFooterProps {
  vertical?: string;
}

export function SiteFooter({ vertical = 'general' }: SiteFooterProps) {
  const year = new Date().getFullYear();

  const getDisclaimer = () => {
    if (vertical === 'health') {
      return "Medical Disclaimer: The information provided on this site is for educational purposes only and is not intended to replace professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read on this website.";
    }
    if (vertical === 'finance') {
      return "Financial Disclaimer: The content on this site is for informational purposes only and does not constitute financial advice. We are not financial advisors. Please consult with a certified financial professional before making any investment decisions.";
    }
    return "General Disclaimer: The information provided on this website is for general informational purposes only. All information is provided in good faith, however we make no representation or warranty of any kind regarding the accuracy, adequacy, validity, reliability, availability or completeness of any information on the site.";
  };

  return (
    <footer className="bg-gray-900 text-gray-400 py-12 text-sm font-sans border-t border-gray-800 mt-auto">
      <div className="container mx-auto px-4 text-center space-y-6 max-w-4xl">
        
        {/* Affiliate Disclosure - Unified */}
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
          <p className="font-semibold text-gray-300 mb-2 uppercase tracking-wider text-xs">Advertorial Disclosure</p>
          <p className="text-xs leading-relaxed">
            This site is an advertorial, not a news article, blog, or consumer protection update. 
            We are a marketing website for the products listed. We receive a commission when you purchase products through our links. 
            This does not affect the price you pay. Our reviews are based on our research and analysis, but we have a financial interest in the outcome.
          </p>
        </div>

        {/* Dynamic Disclaimer */}
        <div className="text-xs text-gray-500 leading-relaxed">
           <strong className="text-gray-400">Disclaimer:</strong> {getDisclaimer()}
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-6 pt-4 border-t border-gray-800">
           <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
           <Link href="/legal/terms" className="hover:text-white transition-colors">Terms of Use</Link>
           <Link href="/legal/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link>
           <Link href="/admin/login" className="hover:text-white transition-colors opacity-50">Admin</Link>
        </div>

        {/* Copyright */}
        <p className="pt-4 text-xs text-gray-600">
          © {year} TopProductDigest. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
