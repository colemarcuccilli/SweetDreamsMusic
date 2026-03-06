import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { SEO, SITE_URL, GEO, BRAND } from '@/lib/constants';
import './globals.css';

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: {
    default: SEO.defaultTitle,
    template: SEO.titleTemplate,
  },
  description: SEO.defaultDescription,
  keywords: SEO.keywords.join(', '),
  authors: [{ name: BRAND.legalName }],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: SITE_URL,
  },
  other: {
    'geo.region': GEO.region,
    'geo.placename': GEO.placeName,
  },
  openGraph: {
    type: 'website',
    title: SEO.defaultTitle,
    description: SEO.defaultDescription,
    url: SITE_URL,
    siteName: BRAND.name,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO.defaultTitle,
    description: SEO.defaultDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={ibmPlexMono.className}>
        <Header />
        <main className="min-h-screen pt-16 sm:pt-20">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
