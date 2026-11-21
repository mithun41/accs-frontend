'use client';

import Link from 'next/link';
import { Logo } from '@/components/layout/SiteHeader';
import FloatingActions from '@/components/layout/FloatingActions';
import { useT } from '@/i18n/LanguageProvider';
import LanguageToggle from '@/i18n/LanguageToggle';

export default function LandingLayout({ children }) {
  const t = useT();
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link href="/" className="text-sm font-medium text-slate-500 hover:text-brand-600">{t('Visit full store')} →</Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        {t('Cash on delivery')} · {t('Delivered by Pathao Courier')} · © {new Date().getFullYear()} ACCS
      </footer>
      {/* The landing page has its own order bar at the bottom on phones */}
      <FloatingActions cart={false} whatsappClassName="bottom-24 lg:bottom-5" />
    </div>
  );
}
