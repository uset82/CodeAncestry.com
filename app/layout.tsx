import type { Metadata, Viewport } from 'next';
import { Bodoni_Moda, IBM_Plex_Mono, Newsreader } from 'next/font/google';
import { site } from '@/lib/site';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { EvidenceThresholdProvider } from '@/components/providers/EvidenceThresholdProvider';
import { ChatDock } from '@/components/chat/ChatDock';
import { PressLayer } from '@/components/ui/PressLayer';
import './globals.css';

/* Display: the plate-caption voice. Variable optical size, so the hairlines
   thicken as the headline shrinks instead of disappearing. */
const bodoni = Bodoni_Moda({
  subsets: ['latin'],
  variable: '--font-bodoni',
  display: 'swap',
  style: ['normal', 'italic'],
  axes: ['opsz'],
});

/* Prose: warm, optical, built for paragraphs rather than product copy. */
const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  display: 'swap',
  style: ['normal', 'italic'],
  axes: ['opsz'],
});

/* Data: every label, accession, measurement and control on the site. */
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-plex-mono',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
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
  themeColor: '#e7e2d5',
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${bodoni.variable} ${newsreader.variable} ${plexMono.variable}`}
    >
      <body>
        <a
          href="#main"
          className="sr-only-focusable bg-press-vermilion runhead fixed top-3 left-3 z-100 px-4 py-2 text-paper"
        >
          Skip to content
        </a>
        <PressLayer />
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
