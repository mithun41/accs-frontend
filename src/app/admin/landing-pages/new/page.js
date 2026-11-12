'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/Layout';
import LandingPageEditor from '@/components/marketing/LandingPageEditor';

export default function NewLandingPage() {
  const router = useRouter();
  return (
    <>
      <PageHeader back={{ href: '/admin/landing-pages', label: 'Landing pages' }} title="New landing page" description="Pick the books, write a short pitch and share the link." />
      <LandingPageEditor onSaved={(saved) => router.replace(`/admin/landing-pages/${saved.id}`)} />
    </>
  );
}
