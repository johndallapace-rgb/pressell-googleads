import Link from 'next/link';
import brandSettings from '../../../../brand-settings.json';

interface BrandFooterProps {
  vertical?: string;
  supportEmail?: string;
  locale?: string;
}

export function BrandFooter({ vertical = 'general', supportEmail, locale = 'en' }: BrandFooterProps) {
  const year = new Date().getFullYear();
  const isDe = locale === 'de';
  const isFr = locale === 'fr';

  // Translations
  const t = {
      privacy: isDe ? 'Datenschutz' : isFr ? 'Confidentialité' : 'Privacy Policy',
      terms: isDe ? 'AGB' : isFr ? 'CGV' : 'Terms of Use',
      disclaimer: isDe ? 'Haftungsausschluss' : isFr ? 'Avis de non-responsabilité' : 'Disclaimer',
      impressum: 'Impressum', // DE only
      contact: isDe ? 'Kontakt' : isFr ? 'Contact' : 'Contact Support',
      rights: isDe ? 'Alle Rechte vorbehalten.' : isFr ? 'Tous droits réservés.' : 'All rights reserved.'
  };

  const getDisclaimer = () => {
    if (locale === 'de') {
        return "Medizinischer Haftungsausschluss: Die Informationen auf dieser Website dienen nur zu Bildungszwecken und ersetzen keine professionelle medizinische Beratung. Konsultieren Sie immer Ihren Arzt.";
    }
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
      <div className="container mx-auto px-4 text-center space-y-8 max-w-4xl">
        
        {/* Affiliate Disclosure - Unified */}
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 text-left md:text-center">
          <p className="font-semibold text-gray-300 mb-2 uppercase tracking-wider text-xs">
              {isDe ? 'Werbehinweis' : 'Advertorial Disclosure'}
          </p>
          <p className="text-xs leading-relaxed text-gray-400">
            {isDe 
              ? "Diese Seite ist ein Advertorial. Wir erhalten eine Provision für Produkte, die über unsere Links gekauft werden. Dies beeinflusst nicht den Preis, den Sie zahlen."
              : "This site is an advertorial, not a news article, blog, or consumer protection update. We are a marketing website for the products listed. We receive a commission when you purchase products through our links. This does not affect the price you pay."}
          </p>
        </div>

        {/* Dynamic Disclaimer */}
        <div className="text-xs text-gray-500 leading-relaxed max-w-3xl mx-auto">
           <strong className="text-gray-400 block mb-1">{t.disclaimer}</strong>
           {getDisclaimer()}
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-6 pt-6 border-t border-gray-800 text-xs font-medium uppercase tracking-wide">
           <Link href="/legal/privacy" className="hover:text-white transition-colors">{t.privacy}</Link>
           <Link href="/legal/terms" className="hover:text-white transition-colors">{t.terms}</Link>
           <Link href="/legal/disclaimer" className="hover:text-white transition-colors">{t.disclaimer}</Link>
           
           {/* Impressum for Germany */}
           {isDe && (
               <Link href="/legal/impressum" className="hover:text-white transition-colors">{t.impressum}</Link>
           )}

           {supportEmail && (
               <a href={`mailto:${supportEmail}`} className="hover:text-white transition-colors">{t.contact}</a>
           )}
        </div>

        {/* Copyright */}
        <p className="pt-2 text-xs text-gray-600">
          © {year} {brandSettings.logo_text}. {t.rights}
        </p>
      </div>
    </footer>
  );
}
