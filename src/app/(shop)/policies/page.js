'use client';

import { FileText } from 'lucide-react';
import { coreApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { formatDate, toList } from '@/lib/utils';
import { EmptyState, PageLoader } from '@/components/ui/Feedback';

export default function PoliciesPage() {
  const { data, loading } = useFetch(() => coreApi.policies(), []);
  const policies = toList(data);

  return (
    <div className="container-page max-w-4xl py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Policies</h1>
      <p className="mt-2 text-slate-500">The rules that keep ACCS fair and safe for buyers and sellers.</p>
      {loading ? (
        <PageLoader />
      ) : policies.length === 0 ? (
        <div className="card mt-8"><EmptyState icon={FileText} title="No policies published yet" /></div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-[200px_minmax(0,1fr)]">
          <nav className="hidden md:block">
            <ul className="sticky top-36 space-y-1 text-sm">
              {policies.map((p) => (
                <li key={p.id}><a href={`#policy-${p.id}`} className="block rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900">{p.title}</a></li>
              ))}
            </ul>
          </nav>
          <div className="space-y-6">
            {policies.map((p) => (
              <article key={p.id} id={`policy-${p.id}`} className="card scroll-mt-36 p-8">
                <h2 className="text-xl font-semibold text-slate-900">{p.title}</h2>
                <p className="mt-1 text-xs text-slate-400">Last updated {formatDate(p.updated_at)}</p>
                <p className="mt-4 whitespace-pre-line leading-relaxed text-slate-600">{p.description}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
