import { ImageResponse } from 'next/og';
import { site } from '@/lib/site';

export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Shared social card. Accession pages inherit this helix motif and override
 * only the title and description in metadata — per-accession image files would
 * prerender with colons in the filename and break Windows builds.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#07090d',
          color: '#f4f7fb',
          padding: '64px 72px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path
              d="M8 2c0 4 8 6 8 10s-8 6-8 10"
              stroke="#b7ff39"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M16 2c0 4-8 6-8 10s8 6 8 10"
              stroke="#b7ff39"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.45"
            />
            <circle cx="12" cy="6.4" r="1.5" fill="#b7ff39" />
            <circle cx="12" cy="12" r="1.5" fill="#b7ff39" />
            <circle cx="12" cy="17.6" r="1.5" fill="#b7ff39" opacity="0.55" />
          </svg>
          <span style={{ fontSize: 28, letterSpacing: '-0.03em', fontWeight: 500 }}>{site.name}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              fontSize: 72,
              lineHeight: 1.02,
              letterSpacing: '-0.04em',
              fontWeight: 500,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span>Every machine</span>
            <span style={{ color: '#b7ff39' }}>has ancestors.</span>
          </div>
          <span style={{ fontSize: 26, color: '#9aa3af', maxWidth: 760, lineHeight: 1.35 }}>
            A living genealogy for software, agents and robots.
          </span>
        </div>

        <span style={{ fontSize: 20, color: '#68717d', letterSpacing: '0.08em' }}>
          {site.domain.toUpperCase()}
        </span>
      </div>
    ),
    { ...size },
  );
}
