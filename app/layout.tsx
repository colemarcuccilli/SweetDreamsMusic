import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono } from 'next/font/google';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import JsonLd from '@/components/seo/JsonLd';
import { AudioPlayerProvider } from '@/components/audio/AudioPlayerContext';
import AudioPlayerBar from '@/components/audio/AudioPlayerBar';
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
  metadataBase: new URL(SITE_URL),
  title: {
    default: SEO.defaultTitle,
    template: SEO.titleTemplate,
  },
  description: SEO.defaultDescription,
  keywords: SEO.keywords.join(', '),
  authors: [{ name: BRAND.legalName, url: SITE_URL }],
  creator: BRAND.name,
  publisher: BRAND.name,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: '/',
  },
  category: 'music',
  classification: 'Recording Studio',
  other: {
    'geo.region': GEO.region,
    'geo.placename': GEO.placeName,
    'format-detection': 'telephone=no',
  },
  openGraph: {
    type: 'website',
    title: SEO.defaultTitle,
    description: 'Professional recording studio in Fort Wayne, IN. Two studios, four engineers, open 24/7. Book sessions starting at $50/hour. Recording, mixing, mastering & production.',
    url: SITE_URL,
    siteName: BRAND.name,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO.defaultTitle,
    description: 'Professional recording studio in Fort Wayne, IN. Two studios, four engineers, open 24/7. Sessions starting at $50/hour.',
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-85S88F3K6K"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-85S88F3K6K');
          `}
        </Script>
        <JsonLd />
      </head>
      <body className={ibmPlexMono.className}>
        <AudioPlayerProvider>
          <Header />
          <main className="min-h-screen pt-16 sm:pt-20 pb-20">{children}</main>
          <Footer />
          <AudioPlayerBar />
        </AudioPlayerProvider>
        <Analytics />
      </body>
    </html>
  );
}
