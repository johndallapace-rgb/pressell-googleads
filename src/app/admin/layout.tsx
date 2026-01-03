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
