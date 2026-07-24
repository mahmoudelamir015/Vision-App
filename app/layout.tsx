import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';

const cairo = Cairo({ 
  subsets: ['arabic'], 
  variable: '--font-cairo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Vision Educational Center',
  description: 'Smart Auth System for Vision Educational Center',
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
