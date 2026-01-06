'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  async function handleLogout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
        console.error('Logout failed', e);
    }
    window.location.href = '/admin/login';
  }

  // Helper to determine active state
  const isActive = (path: string, exact = false) => {
    const active = exact ? pathname === path : pathname.startsWith(path);
    return active 
        ? 'bg-blue-50 text-blue-700 font-bold border-r-4 border-blue-600' 
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      <aside className="w-72 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0 bottom-0 overflow-y-auto z-20 shadow-sm flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            P
          </div>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">Pressell<span className="text-blue-600">Ads</span></h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          
          {/* INTELLIGENCE */}
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-2">INTELLIGENCE</p>
          
          <Link href="/admin/trends" className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${isActive('/admin/trends')}`}>
            <svg className="w-5 h-5 mr-3 opacity-75 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Market Trends
          </Link>

          <Link href="/admin/ad-spy" className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${isActive('/admin/ad-spy')}`}>
            <svg className="w-5 h-5 mr-3 opacity-75 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Ad Spy
          </Link>

          {/* OPERATIONS */}
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6">OPERATIONS</p>

          <Link href="/admin/products" className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${isActive('/admin/products')}`}>
            <svg className="w-5 h-5 mr-3 opacity-75 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            My Products
          </Link>

          <Link href="/admin/ads-manager" className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${isActive('/admin/ads-manager')}`}>
            <svg className="w-5 h-5 mr-3 opacity-75 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            Ads Manager
          </Link>

          {/* SYSTEM */}
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6">SYSTEM</p>

          <Link href="/admin/settings" className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${isActive('/admin/settings')}`}>
            <svg className="w-5 h-5 mr-3 opacity-75 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            API Connections
          </Link>

          <Link href="/admin/diagnostics" className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${isActive('/admin/diagnostics')}`}>
            <svg className="w-5 h-5 mr-3 opacity-75 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Diagnostics
          </Link>
          
          <Link href="/admin" className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${isActive('/admin', true)}`}>
             <svg className="w-5 h-5 mr-3 opacity-75 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
             </svg>
             Dashboard
           </Link>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout} 
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>
      
      <main className="flex-1 ml-72 p-8 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
