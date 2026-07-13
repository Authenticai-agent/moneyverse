import type { Metadata } from 'next';
import { Inter, Fredoka } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const fredoka = Fredoka({ subsets: ['latin'], variable: '--font-fredoka', weight: ['400', '600', '700'] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://moneyverse.example.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'MoneyVerse', template: '%s | MoneyVerse' },
  description: 'A safe financial learning world for kids and families.',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    siteName: 'MoneyVerse',
    images: ['/api/og'],
  },
  twitter: {
    card: 'summary_large_image',
  },
  themeColor: '#87CEEB',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${fredoka.variable}`}>
      <body className="font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
