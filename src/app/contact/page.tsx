import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | Top Product Official',
  description: 'Get in touch with Top Product Official regarding Google Ads API usage or compliance.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans flex flex-col">
      <header className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">T</div>
            <Link href="/" className="font-semibold text-lg tracking-tight hover:text-blue-600 transition-colors">Top Product Official</Link>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <Link href="/about" className="hover:text-blue-600 transition-colors">About</Link>
            <Link href="/contact" className="text-blue-600">Contact</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex-grow">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Contact Us</h1>
        <div className="space-y-8 text-gray-600">
          <p className="text-lg">
            For inquiries regarding our Google Ads API integration or compliance matters, please contact us at:
          </p>
          
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-2">Email</h3>
            <a href="mailto:support@topproductofficial.com" className="text-blue-600 hover:underline text-lg">
              support@topproductofficial.com
            </a>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-2">Operating Region</h3>
            <p className="text-lg">Global</p>
          </div>
        </div>
      </main>
      
      <footer className="py-12 bg-gray-50 border-t border-gray-200 mt-auto">
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
