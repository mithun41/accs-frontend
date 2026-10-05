import { Geist, Geist_Mono } from 'next/font/google';
import Providers from '@/components/layout/Providers';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata = {
  title: {
    default: 'ACCS Marketplace — Shop from trusted sellers across Bangladesh',
    template: '%s · ACCS Marketplace',
  },
  description:
    'ACCS is a multi-vendor marketplace connecting buyers with verified retailers and wholesalers across Bangladesh, with fast Pathao delivery and cash on delivery.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
