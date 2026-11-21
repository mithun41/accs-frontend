'use client';

import Link from 'next/link';
import { Mail, MapPin, Phone, PencilRuler, Truck, Wallet, Headphones } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useCategoryTree } from '@/hooks/useCategoryTree';
import { findStationery } from '@/lib/catalog';
import { FacebookIcon, WhatsAppIcon } from '@/components/ui/BrandIcons';
import { useT } from '@/i18n/LanguageProvider';
import { Logo } from './SiteHeader';

const perks = [
  { icon: Truck, title: 'Nationwide delivery', text: 'Pathao courier to all 64 districts' },
  { icon: Wallet, title: 'Cash on delivery', text: 'Pay when your parcel arrives' },
  { icon: PencilRuler, title: 'School stationery', text: 'Pens, khata & supplies too' },
  { icon: Headphones, title: 'Friendly support', text: 'We are here 7 days a week' },
];

function footerColumns(stationeryHref) {
  return [
    {
      title: 'Shop',
      links: [
        ['/products', 'All books'],
        [stationeryHref, 'Stationery'],
        ['/products?discounted=1', 'Offers'],
        ['/products?ordering=-created_at', 'New arrivals'],
      ],
    },
    {
      title: 'My account',
      links: [
        ['/account/orders', 'Track orders'],
        ['/account/wishlist', 'Wishlist'],
        ['/cart', 'My cart'],
      ],
    },
    {
      title: 'Company',
      links: [
        ['/about', 'About us'],
        ['/policies', 'Policies'],
        ['/register/vendor', 'Become a seller'],
        ['/admin/login', 'Staff login'],
      ],
    },
  ];
}

function Contact() {
  const t = useT();
  const { hotline, support_email: email, address, facebook_url: facebook, whatsapp_url: whatsapp } = useSiteSettings();
  const hasAny = hotline || email || address;
  return (
    <div>
      <p className="text-sm font-bold text-white">{t('Get in touch')}</p>
      <ul className="mt-4 space-y-2.5 text-sm">
        {hotline && (
          <li><a href={`tel:${hotline}`} className="flex items-center gap-2.5 hover:text-white"><Phone className="size-4 text-accent-300" /> {hotline}</a></li>
        )}
        {email && (
          <li><a href={`mailto:${email}`} className="flex items-center gap-2.5 break-all hover:text-white"><Mail className="size-4 shrink-0 text-accent-300" /> {email}</a></li>
        )}
        {address && <li className="flex items-start gap-2.5"><MapPin className="mt-0.5 size-4 shrink-0 text-accent-300" /> {address}</li>}
        {!hasAny && <li className="text-brand-200/70">{t('Questions about an order? We are happy to help.')}</li>}
      </ul>
      {(whatsapp || facebook) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {whatsapp && (
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-3.5 py-1.5 text-xs font-semibold text-white hover:brightness-110">
              <WhatsAppIcon className="size-4" /> WhatsApp
            </a>
          )}
          {facebook && (
            <a href={facebook} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-white/20">
              <FacebookIcon className="size-4" /> Facebook
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function SiteFooter() {
  const t = useT();
  const stationery = findStationery(useCategoryTree());
  const columns = footerColumns(stationery ? `/products?in=${stationery.id}` : '/products');
  return (
    <footer className="mt-16 bg-brand-950 text-brand-100/80">
      <div className="border-b border-white/10">
        <div className="container-page grid grid-cols-2 gap-6 py-7 lg:grid-cols-4">
          {perks.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.07] text-accent-300">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{t(title)}</p>
                <p className="mt-0.5 text-xs">{t(text)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container-page grid grid-cols-2 gap-8 py-12 md:grid-cols-[1.4fr_repeat(3,minmax(0,0.8fr))_1.3fr]">
        <div className="col-span-2 md:col-span-1">
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            {t('Your online school book shop — textbooks, guides, model tests and stationery for Class 1 to 12, delivered across Bangladesh.')}
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <p className="text-sm font-bold text-white">{t(col.title)}</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {col.links.map(([href, label]) => (
                <li key={label}><Link href={href} className="transition-colors hover:text-accent-300">{t(label)}</Link></li>
              ))}
            </ul>
          </div>
        ))}
        <div className="col-span-2 md:col-span-1">
          <Contact />
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 pb-24 pt-5 text-xs sm:flex-row md:pb-5">
          <p>{t('© {year} ACCS Book Shop. All rights reserved.', { year: new Date().getFullYear() })}</p>
          <p className="flex items-center gap-2">
            {t('Prices in BDT (৳) · Delivery by Pathao')}
            <span className="rounded-full bg-accent-400/15 px-2 py-0.5 font-semibold text-accent-300">{t('Cash on delivery')}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
