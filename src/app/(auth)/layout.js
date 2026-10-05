import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/layout/SiteHeader';

const points = [
  'Thousands of products from verified sellers',
  'Cash on delivery across all 64 districts',
  'Track every parcel with Pathao Courier',
];

export default function AuthLayout({ children }) {
  return (
    <div className="grid grid-cols-1 min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 lg:flex lg:flex-col lg:justify-between p-12">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '22px 22px' }} />
        <div className="absolute -left-20 -bottom-32 size-[28rem] rounded-full bg-brand-400/25 blur-3xl" />
        <div className="relative">
          <Logo light />
        </div>
        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight text-white">Bangladesh&apos;s marketplace for buyers, retailers & wholesalers.</h2>
          <ul className="mt-8 space-y-4">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-3 text-brand-50">
                <CheckCircle2 className="size-5 text-brand-300" /> {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-brand-200/80">© {new Date().getFullYear()} ACCS Marketplace</p>
      </aside>
      <main className="flex flex-col bg-white">
        <div className="flex items-center justify-between px-6 py-5 lg:px-10">
          <div className="lg:hidden"><Logo /></div>
          <Link href="/" className="ml-auto text-sm font-medium text-slate-500 hover:text-slate-800">← Back to store</Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-12 lg:px-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}
