import Link from 'next/link';
import { ReactNode } from 'react';

interface LayoutShellProps {
  children: ReactNode;
}

export default function LayoutShell({ children }: LayoutShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 py-4 shadow-sm">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/mitolyn" className="text-xl font-bold text-gray-800 tracking-tight">
            SmartHealth<span className="text-blue-600">Choices</span>
          </Link>
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex space-x-6 text-sm text-gray-600">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
                Science-Backed
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                Expert Reviewed
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
            <div className="mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} SmartHealthChoices. All Rights Reserved.
            </div>
            <div className="flex space-x-6">
              <Link href="/legal/privacy" className="hover:text-gray-900">Privacy Policy</Link>
              <Link href="/legal/terms" className="hover:text-gray-900">Terms of Service</Link>
              <Link href="/legal/disclaimer" className="hover:text-gray-900">Disclaimer</Link>
            </div>
          </div>
          <div className="mt-8 text-xs text-gray-400 text-center max-w-3xl mx-auto">
            <p className="mb-2 font-semibold">Affiliate Disclosure</p>
            <p className="mb-2">This site may contain affiliate links. If you purchase through links, we may earn a commission at no extra cost to you.</p>
            <p>Content is for informational purposes only and is not intended as medical advice.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
