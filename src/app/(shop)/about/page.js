'use client';

import { PencilRuler, Truck, ShieldCheck, Users } from 'lucide-react';
import { coreApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { toList } from '@/lib/utils';
import { PageLoader } from '@/components/ui/Feedback';
import Button from '@/components/ui/Button';
import { useT } from '@/i18n/LanguageProvider';

export default function AboutPage() {
  const t = useT();
  const { data, loading } = useFetch(() => coreApi.about(), []);
  const sections = toList(data);

  return (
    <div>
      <section className="bg-gradient-to-br from-brand-900 to-brand-700 py-16 text-center">
        <div className="container-page max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-white">{t('About ACCS')}</h1>
          <p className="mt-4 text-lg text-brand-100/90">
            {t('An online book shop for Bangladeshi students — Class 1 to 12 textbooks, guides, model tests and school stationery, delivered nationwide.')}
          </p>
        </div>
      </section>
      <div className="container-page max-w-4xl py-12">
        {loading ? (
          <PageLoader />
        ) : (
          <div className="space-y-6">
            {sections.map((s) => (
              <div key={s.id} className="card p-8">
                <h2 className="text-xl font-semibold text-slate-900">{s.title}</h2>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-600">{s.description}</p>
              </div>
            ))}
          </div>
        )}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Users, title: 'For students', text: 'Every class book in one place, with cash on delivery.' },
            { icon: PencilRuler, title: 'Stationery', text: 'Pens, khata, geometry boxes and other school supplies.' },
            { icon: Truck, title: 'Delivery', text: 'Pathao courier to all 64 districts.' },
            { icon: ShieldCheck, title: 'Checked orders', text: 'Our team confirms every order before it ships.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-5">
              <Icon className="size-6 text-brand-600" />
              <p className="mt-3 font-semibold text-slate-900">{t(title)}</p>
              <p className="mt-1 text-sm text-slate-500">{t(text)}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button href="/products" size="lg">{t('Start shopping')}</Button>
        </div>
      </div>
    </div>
  );
}
