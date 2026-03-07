import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Top Product Official',
  description: 'Terms of Service for Top Product Official.',
};

export default function TermsPage() {
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
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Terms of Service</h1>
        <div className="prose prose-lg text-gray-600">
          <p className="text-sm text-gray-500 mb-6">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <h3 className="text-xl font-bold mt-8 mb-4">1. Acceptance of Terms</h3>
          <p>
            By accessing or using Top Product Official (the "Platform"), you agree to be bound by these Terms of Service. This Platform is intended solely for authorized internal personnel.
          </p>

          <h3 className="text-xl font-bold mt-8 mb-4">2. Internal Use Only</h3>
          <p>
            This Platform is a proprietary internal tool developed for Top Product Official's operational use. Unauthorized access, distribution, or use of this Platform by external parties is strictly prohibited.
          </p>

          <h3 className="text-xl font-bold mt-8 mb-4">3. Google Ads Compliance</h3>
          <p>
            All advertising campaigns managed through this Platform must adhere to Google Ads policies and guidelines. Users are responsible for ensuring that all ad content and configurations remain compliant with applicable regulations.
          </p>

          <h3 className="text-xl font-bold mt-8 mb-4">4. Limitation of Liability</h3>
          <p>
            Top Product Official provides this Platform "as is" for internal efficiency. We make no warranties regarding the continuous availability or error-free operation of the Platform.
          </p>
        </div>
      </main>
      
      <footer className="py-12 bg-gray-50 border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Top Product Official. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/privacy-policy" className="hover:text-gray-900 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-gray-900 font-medium">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
