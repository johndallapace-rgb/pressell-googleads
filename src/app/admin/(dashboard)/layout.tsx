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

  const isActive = (path: string) => {
    return pathname.startsWith(path) 
        ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600' 
        : 'text-gray-700 hover:bg-gray-50';
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0 bottom-0 overflow-y-auto z-10">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
        </div>
        <nav className="p-4 space-y-2">
          <Link href="/admin" className={`block px-4 py-2 rounded-md transition-colors ${isActive('/admin') === 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600' && pathname === '/admin' ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600' : (pathname === '/admin' ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600' : 'text-gray-700 hover:bg-gray-50')}`}>
            Dashboard
          </Link>
          <Link href="/admin/settings" className={`block px-4 py-2 rounded-md transition-colors ${isActive('/admin/settings')}`}>
            API Connection
          </Link>
          <Link href="/admin/products" className={`block px-4 py-2 rounded-md flex items-center transition-colors ${isActive('/admin/products')}`}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            Products
          </Link>
          <Link href="/admin/diagnostics" className={`block px-4 py-2 rounded-md transition-colors ${isActive('/admin/diagnostics')}`}>
            Diagnostics
          </Link>
          <Link href="/admin/ads-manager" className={`block px-4 py-2 rounded-md flex items-center transition-colors ${isActive('/admin/ads-manager')}`}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Ads Manager
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-200 absolute bottom-0 w-full">
          <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-md">
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
