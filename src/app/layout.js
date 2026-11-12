import { Geist, Geist_Mono } from 'next/font/google';
import Providers from '@/components/layout/Providers';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata = {
  title: {
    default: 'ACCS Book Shop — Class 1 to 12 books online in Bangladesh',
    template: '%s · ACCS Book Shop',
  },
  description:
    'Buy Class 1 to 12 textbooks, guide books and model tests online from trusted book sellers across Bangladesh. Cash on delivery with Pathao.',
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
