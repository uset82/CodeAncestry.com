import type { JsonLd as JsonLdValue } from '@/lib/seo/jsonld';

/**
 * Emits one JSON-LD script. The payload is built on the server from live
 * registry records so a crawler sees the same accessions the page does.
 */
export function JsonLd({ data }: { data: JsonLdValue }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
