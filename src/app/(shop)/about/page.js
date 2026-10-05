'use client';

import { Store, Truck, ShieldCheck, Users } from 'lucide-react';
import { coreApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { toList } from '@/lib/utils';
import { PageLoader } from '@/components/ui/Feedback';
import Button from '@/components/ui/Button';

export default function AboutPage() {
  const { data, loading } = useFetch(() => coreApi.about(), []);
  const sections = toList(data);

  return (
    <div>
      <section className="bg-gradient-to-br from-brand-900 to-brand-700 py-16 text-center">
        <div className="container-page max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-white">About ACCS</h1>
          <p className="mt-4 text-lg text-brand-100/90">
            A marketplace built for Bangladesh — connecting buyers with trusted retailers and wholesalers, with nationwide delivery.
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
            { icon: Users, t: 'For buyers', s: 'Shop thousands of products with cash on delivery.' },
            { icon: Store, t: 'For sellers', s: 'Open a shop and reach customers nationwide.' },
            { icon: Truck, t: 'Logistics', s: 'Direct pickup or central-hub consolidation via Pathao.' },
            { icon: ShieldCheck, t: 'Trust', s: 'KYC-verified sellers and reviewed orders.' },
          ].map(({ icon: Icon, t, s }) => (
            <div key={t} className="card p-5">
              <Icon className="size-6 text-brand-600" />
              <p className="mt-3 font-semibold text-slate-900">{t}</p>
              <p className="mt-1 text-sm text-slate-500">{s}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button href="/products" size="lg">Start shopping</Button>
        </div>
      </div>
    </div>
  );
}
