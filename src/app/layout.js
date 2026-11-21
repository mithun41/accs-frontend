import { Noto_Sans_Bengali, Plus_Jakarta_Sans } from 'next/font/google';
import { cookies } from 'next/headers';
import Providers from '@/components/layout/Providers';
import { DEFAULT_LANG, LANG_COOKIE, LanguageProvider } from '@/i18n/LanguageProvider';
import './globals.css';

// Latin text uses Plus Jakarta Sans; Bangla uses Noto Sans Bengali (clear, standard Bangla digits)
const jakarta = Plus_Jakarta_Sans({ variable: '--font-jakarta', subsets: ['latin'] });
const hind = Noto_Sans_Bengali({ variable: '--font-hind', subsets: ['bengali', 'latin'], weight: ['400', '500', '600', '700', '800'] });

export const metadata = {
  title: {
    default: 'ACCS Book Shop — Class 1 to 12 books online in Bangladesh',
    template: '%s · ACCS Book Shop',
  },
  description:
    'Buy Class 1 to 12 textbooks, guide books, model tests and school stationery online. Delivery across Bangladesh with cash on delivery.',
};

export default async function RootLayout({ children }) {
  // Bangla by default; the header toggle stores the visitor's choice in a cookie
  const lang = (await cookies()).get(LANG_COOKIE)?.value === 'en' ? 'en' : DEFAULT_LANG;
  return (
    <html lang={lang} className={`${jakarta.variable} ${hind.variable}`}>
      <body className="min-h-screen font-sans">
        <LanguageProvider initialLang={lang}>
          <Providers>{children}</Providers>
        </LanguageProvider>
      </body>
    </html>
  );
}
