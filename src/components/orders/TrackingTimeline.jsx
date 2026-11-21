'use client';

import { humanize } from '@/lib/utils';
import { useT } from '@/i18n/LanguageProvider';

export default function TrackingTimeline({ data }) {
  const t = useT();
  const info = data?.data || data || {};
  const history = info.history || info.timeline || [];
  return (
    <div>
      <p className="text-sm text-slate-600">
        {t('Current status')}: <strong className="text-slate-900">{info.order_status ? humanize(info.order_status) : t('Unknown')}</strong>
      </p>
      {history.length > 0 && (
        <ol className="mt-4 space-y-4 border-l-2 border-slate-200 pl-5">
          {history.map((h, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[27px] top-1 size-3 rounded-full border-2 border-white bg-brand-500 ring-2 ring-brand-100" />
              <p className="text-sm font-medium text-slate-900">{humanize(h.status || h.order_status || '')}</p>
              <p className="text-xs text-slate-500">{h.time || h.updated_at || ''}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
