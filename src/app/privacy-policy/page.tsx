import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Top Product Official',
  description: 'Privacy Policy for Top Product Official.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans flex flex-col">
      <header className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">T</div>
            <Link href="/" className="font-semibold text-lg tracking-tight hover:text-blue-600 transition-colors">Top Product Official</Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex-grow">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Privacy Policy</h1>
        <div className="prose prose-lg text-gray-600">
          <p className="text-sm text-gray-500 mb-6">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <h3 className="text-xl font-bold mt-8 mb-4">1. Introduction</h3>
          <p>
            Top Product Official ("we", "us", or "our") respects your privacy. This Privacy Policy explains how we handle data within our internal advertising platform.
          </p>

          <h3 className="text-xl font-bold mt-8 mb-4">2. Data Collection</h3>
          <p>
            This platform is an internal tool used for managing advertising campaigns. We collect and process data strictly for operational purposes, including campaign performance metrics and ad configuration settings retrieved via the Google Ads API.
          </p>

          <h3 className="text-xl font-bold mt-8 mb-4">3. Google Ads API</h3>
          <p>
            Our application uses the Google Ads API to create, manage, and report on advertising campaigns. Data retrieved from Google services is used solely for internal optimization and reporting. We do not share this data with third parties.
          </p>

          <h3 className="text-xl font-bold mt-8 mb-4">4. Contact</h3>
          <p>
            If you have questions about this policy, please contact us at <a href="mailto:google-ads-api@topproductofficial.com" className="text-blue-600">google-ads-api@topproductofficial.com</a>.
          </p>
        </div>
      </main>
      
      <footer className="py-12 bg-gray-50 border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Top Product Official. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/privacy-policy" className="text-gray-900 font-medium">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
