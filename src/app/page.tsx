import { redirect } from 'next/navigation';
import { getCampaignConfig } from '@/lib/campaignConfig';
import { headers } from 'next/headers';
import { getVerticalFromHost } from '@/lib/host';
import Link from 'next/link';
import { Metadata } from 'next';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.topproductofficial.com'),
  title: 'Advertising Automation Platform | Top Product Official',
  description: 'Top Product Official is an internal advertising management platform used to create, manage and optimize Google Search campaigns for affiliate product promotions.',
  openGraph: {
    title: 'Advertising Automation Platform | Top Product Official',
    description: 'Internal advertising management platform for Google Search campaigns.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Advertising Automation Platform | Top Product Official',
    description: 'Internal advertising management platform for Google Search campaigns.',
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default async function HomePage() {
  // 1. Detect Host Vertical
  const headerList = await headers();
  const host = headerList.get('host');
  const detectedVertical = getVerticalFromHost(host);

  // 2. If Subdomain Vertical detected, keep existing logic (redirect to product)
  // This preserves existing subdomains logic (e.g. health.topproductofficial.com)
  if (detectedVertical) {
      const config = await getCampaignConfig();
      const products = config.products || {};
      const verticalProduct = Object.values(products).find(p => p.status === 'active' && p.vertical === detectedVertical);
      
      if (verticalProduct) {
          redirect(`/${verticalProduct.slug}`);
      }
      // If no product found for this vertical, show specific error
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-600 p-4">
             <div className="max-w-md text-center">
                <h1 className="text-2xl font-bold mb-2 text-gray-800">No {detectedVertical.toUpperCase()} Offers</h1>
                <p>We couldn't find any active offers in this category right now.</p>
             </div>
        </div>
      );
  }

  // 3. Default Logic (Root Domain) -> RENDER INSTITUTIONAL HOMEPAGE
  // Removed fallback redirect logic for root domain to ensure "No Active Campaign" never shows on www/root
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">T</div>
            <span className="font-semibold text-lg tracking-tight">Top Product Official</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <Link href="/" className="text-blue-600">Home</Link>
            <Link href="/about" className="hover:text-blue-600 transition-colors">About</Link>
            <Link href="/contact" className="hover:text-blue-600 transition-colors">Contact</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wide mb-6">Internal Platform</span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6 max-w-4xl mx-auto">
            Advertising Automation Platform
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Top Product Official is an internal advertising management platform used to create, manage and optimize Google Search campaigns for affiliate product promotions.
          </p>
        </div>
      </section>

      {/* Key Information Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            {/* Google Ads API Usage */}
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-2xl">⚡</div>
              <h3 className="text-xl font-bold mb-4">Google Ads API Usage</h3>
              <p className="text-gray-600 leading-relaxed">
                We use the Google Ads API for internal campaign creation, management, reporting, keyword organization, ad copy support, and workflow automation.
              </p>
            </div>

            {/* Internal Use Only */}
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6 text-2xl">🔒</div>
              <h3 className="text-xl font-bold mb-4">Internal Use Only</h3>
              <p className="text-gray-600 leading-relaxed">
                This platform is used exclusively for internal operational purposes by our team and is not offered as a public self-serve advertising platform.
              </p>
            </div>

            {/* Compliance */}
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6 text-2xl">Cw</div>
              <h3 className="text-xl font-bold mb-4">Compliance & Transparency</h3>
              <p className="text-gray-600 leading-relaxed">
                Our workflows are designed to support internal advertising operations with transparency, structured account management, and policy-aware processes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-8">Contact Information</h2>
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16 text-gray-300">
            <div className="text-center">
              <p className="text-sm uppercase tracking-widest text-gray-500 mb-2">Company</p>
              <p className="font-medium text-lg text-white">Top Product Official</p>
            </div>
            <div className="text-center">
              <p className="text-sm uppercase tracking-widest text-gray-500 mb-2">Location</p>
              <p className="font-medium text-lg text-white">Brazil</p>
            </div>
            <div className="text-center">
              <p className="text-sm uppercase tracking-widest text-gray-500 mb-2">Email</p>
              <a href="mailto:google-ads-api@topproductofficial.com" className="font-medium text-lg text-white hover:text-blue-400 transition-colors">
                google-ads-api@topproductofficial.com
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Top Product Official. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/privacy-policy" className="hover:text-gray-900 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
