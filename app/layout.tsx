import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';

const cairo = Cairo({ 
  subsets: ['arabic'], 
  variable: '--font-cairo',
  display: 'swap',
});

const metadataBase = process.env.APP_URL?.startsWith('http') ? new URL(process.env.APP_URL) : undefined;

export const metadata: Metadata = {
  title: 'Vision Educational Center',
  description: 'Smart Auth System for Vision Educational Center',
  metadataBase,
  openGraph: {
    title: 'Vision Educational Center',
    description: 'Smart Auth System for Vision Educational Center',
    type: 'website',
    locale: 'ar_EG',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vision Educational Center',
    description: 'Smart Auth System for Vision Educational Center',
    images: ['/og.png'],
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="font-cairo selection:bg-vision-gold selection:text-vision-navy" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
