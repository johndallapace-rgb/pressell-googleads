import Link from 'next/link';
import { logout, verifyToken } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export const metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side authentication check (Hardening)
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (!token || !(await verifyToken(token))) {
    redirect('/admin/login');
  }

  async function handleLogout() {
    'use server';
    await logout();
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0 bottom-0 overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
        </div>
        <nav className="p-4 space-y-2">
          <Link href="/admin" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md">
            Dashboard
          </Link>
          <Link href="/admin/settings" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md">
            Settings
          </Link>
          <Link href="/admin/diagnostics" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md">
            Diagnostics
          </Link>
          <Link href="/admin/ads" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
            Ads Manager
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-200 absolute bottom-0 w-full">
          <form action={handleLogout}>
            <button type="submit" className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-md">
              Logout
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
