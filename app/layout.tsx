import type { Metadata, Viewport } from 'next';
import { Archivo, IBM_Plex_Mono } from 'next/font/google';
import { site } from '@/lib/site';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { EvidenceThresholdProvider } from '@/components/providers/EvidenceThresholdProvider';
import { ChatDock } from '@/components/chat/ChatDock';
import './globals.css';

/* Interface and display. Variable, with a width axis available for display
   sizes — wide technical type reads futurist without reaching for neon. */
const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
  axes: ['wdth'],
});

/* Every accession, coordinate, measurement and control on the site. */
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-plex-mono',
  display: 'swap',
  weight: ['400', '500', '600'],
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
};

export const viewport: Viewport = {
  themeColor: '#090b0e',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${plexMono.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only-focusable bg-acid text-on-acid label fixed top-3 left-3 z-100 rounded-md px-4 py-3"
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
