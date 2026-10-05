import Link from 'next/link';
import { ShieldCheck, Truck, Wallet, Headphones } from 'lucide-react';
import { Logo } from './SiteHeader';

const perks = [
  { icon: Truck, title: 'Nationwide delivery', text: 'Fast Pathao courier to all 64 districts' },
  { icon: Wallet, title: 'Cash on delivery', text: 'Pay when your parcel arrives' },
  { icon: ShieldCheck, title: 'Verified sellers', text: 'Every shop passes KYC checks' },
  { icon: Headphones, title: 'Friendly support', text: 'We are here 7 days a week' },
];

export default function SiteFooter() {
  return (
    <footer className="mt-16 bg-white border-t border-slate-200">
      <div className="container-page grid grid-cols-2 lg:grid-cols-4 gap-6 py-8 border-b border-slate-100">
        {perks.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Icon className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="container-page grid grid-cols-2 md:grid-cols-4 gap-8 py-10">
        <div className="col-span-2 md:col-span-1">
          <Logo />
          <p className="mt-3 text-sm text-slate-500 max-w-xs">
            A trusted multi-vendor marketplace connecting buyers with retailers and wholesalers across Bangladesh.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Shop</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link href="/products" className="hover:text-slate-900">All products</Link></li>
            <li><Link href="/shops" className="hover:text-slate-900">Shops</Link></li>
            <li><Link href="/cart" className="hover:text-slate-900">Cart</Link></li>
            <li><Link href="/account/orders" className="hover:text-slate-900">Track orders</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Sell</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link href="/register/vendor" className="hover:text-slate-900">Become a seller</Link></li>
            <li><Link href="/vendor" className="hover:text-slate-900">Seller dashboard</Link></li>
            <li><Link href="/login" className="hover:text-slate-900">Seller login</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Company</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link href="/about" className="hover:text-slate-900">About us</Link></li>
            <li><Link href="/policies" className="hover:text-slate-900">Policies</Link></li>
            <li><Link href="/admin/login" className="hover:text-slate-900">Staff login</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100">
        <div className="container-page flex flex-col sm:flex-row items-center justify-between gap-2 py-5 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} ACCS Marketplace. All rights reserved.</p>
          <p>Prices in BDT (৳) · Delivery by Pathao Courier</p>
        </div>
      </div>
    </footer>
  );
}
