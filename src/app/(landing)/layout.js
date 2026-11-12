import Link from 'next/link';
import { Logo } from '@/components/layout/SiteHeader';

export default function LandingLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f6f9fc]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Logo />
          <Link href="/" className="text-sm font-medium text-slate-500 hover:text-brand-600">Visit full store →</Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        Cash on delivery · Delivered by Pathao Courier · © {new Date().getFullYear()} ACCS Book Shop
      </footer>
    </div>
  );
}
