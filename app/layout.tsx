import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Instrument_Sans, Instrument_Serif, Newsreader } from 'next/font/google';
import { ChatDock } from '@/components/chat/ChatDock';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { EvidenceThresholdProvider } from '@/components/providers/EvidenceThresholdProvider';
import { NoiseOverlay } from '@/components/ui/NoiseOverlay';
import { JsonLd } from '@/components/seo/JsonLd';
import { websiteJsonLd } from '@/lib/seo/jsonld';
import { site } from '@/lib/site';
import './globals.css';

/* The narrative voice. A high-contrast editorial serif carries the headline and
   its italic carries the emphasis that used to be a hollow stroke outline. */
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  /* Not `--font-display`: that is the Tailwind theme token, and pointing it at
     itself makes the custom property resolve to nothing. */
  variable: '--font-display-face',
  display: 'swap',
});

/* Reading text. Newsreader is drawn for screens and ships optical sizes, so a
   caption and a lead paragraph are not the same shape scaled. */
const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-reading',
  display: 'swap',
});

/* Accessions, identifiers and every registry label. */
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
});

/* Dense registry UI. Same foundry as the display serif, a grotesque with a
   cut of its own — not Inter, not Roboto, not the system stack. Homepage and
   docs keep the serifs; record lists use this. */
const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ui-face',
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
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${newsreader.variable} ${plexMono.variable} ${instrumentSans.variable}`}
    >
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
