import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#07090d',
        }}
      >
        <svg width="118" height="118" viewBox="0 0 24 24" fill="none">
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
      </div>
    ),
    { ...size },
  );
}
