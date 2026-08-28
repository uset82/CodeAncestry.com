import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ChatDock } from '@/components/chat/ChatDock';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { EvidenceThresholdProvider } from '@/components/providers/EvidenceThresholdProvider';
import { NoiseOverlay } from '@/components/ui/NoiseOverlay';
import { JsonLd } from '@/components/seo/JsonLd';
import { websiteJsonLd } from '@/lib/seo/jsonld';
import { site } from '@/lib/site';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    'software lineage',
    'software genome',
    'code ancestry',
    'provenance',
    'agent DNA',
    'software evolution',
    'remix',
    'fork',
    'mutation',
  ],
  openGraph: {
    type: 'website',
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    url: site.url,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  robots: { index: true, follow: true },
  alternates: { canonical: site.url },
};

export const viewport: Viewport = {
  themeColor: '#07090d',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <JsonLd data={websiteJsonLd()} />
        <NoiseOverlay />
        <a
          href="#main"
          className="sr-only-focusable bg-acid text-void fixed top-3 left-3 z-100 rounded-sm px-4 py-2 text-sm font-bold"
        >
          Skip to content
        </a>
        <EvidenceThresholdProvider>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
          <ChatDock />
        </EvidenceThresholdProvider>
      </body>
    </html>
  );
}
