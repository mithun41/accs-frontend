'use client';

import { use } from 'react';
import { marketingApi } from '@/lib/services';
import { useFetch } from '@/hooks/useFetch';
import { PageHeader } from '@/components/ui/Layout';
import { ErrorState, PageLoader } from '@/components/ui/Feedback';
import Badge from '@/components/ui/Badge';
import LandingPageEditor from '@/components/marketing/LandingPageEditor';

export default function EditLandingPage({ params }) {
  const { id } = use(params);
  const { data, loading, error, reload } = useFetch(() => marketingApi.landingPage(id), [id]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader
        back={{ href: '/admin/landing-pages', label: 'Landing pages' }}
        title={data.title}
        description={`/offer/${data.slug}`}
        actions={data.is_active ? <Badge tone="green" dot>Live</Badge> : <Badge dot>Draft</Badge>}
      />
      <LandingPageEditor key={data.updated_at} page={data} onSaved={reload} />
    </>
  );
}
