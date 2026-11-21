import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import FloatingActions from '@/components/layout/FloatingActions';
import MobileTabBar from '@/components/layout/MobileTabBar';

export default function ShopLayout({ children }) {
  return (
    // Phones: leave room for the bottom tab bar
    <div className="flex min-h-screen flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      {/* WhatsApp sits just above the tab bar on phones */}
      <FloatingActions whatsappClassName="bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-5" />
      <MobileTabBar />
    </div>
  );
}
