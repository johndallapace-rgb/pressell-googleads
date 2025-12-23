'use client';

import { usePathname, useRouter } from 'next/navigation';
import { i18n, Locale } from '@/i18n/i18n-config';
import { useState } from 'react';

function setLocaleCookie(locale: Locale) {
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Extract current locale from pathname
  const currentLocale = i18n.locales.find(locale => pathname.startsWith(`/${locale}`)) || i18n.defaultLocale;

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === currentLocale) {
      setIsOpen(false);
      return;
    }

    // Replace locale in path
    const segments = pathname.split('/');
    // segments[0] is empty, segments[1] is locale
    segments[1] = newLocale;
    const newPath = segments.join('/');

    // Persist preference
    setLocaleCookie(newLocale);
    
    router.push(newPath);
    setIsOpen(false);
  };

  const labels: Record<Locale, string> = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    it: 'Italiano',
    pt: 'Português',
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="uppercase">{currentLocale}</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-20 border border-gray-100 py-1">
            {i18n.locales.map((locale) => (
              <button
                key={locale}
                onClick={() => handleLocaleChange(locale)}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                  currentLocale === locale ? 'font-bold text-blue-600 bg-blue-50' : 'text-gray-700'
                }`}
              >
                {labels[locale]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
