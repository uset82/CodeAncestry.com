import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';

const projectRoot = dirname(fileURLToPath(import.meta.url));

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Pin the workspace root so Turbopack ignores unrelated lockfiles above it.
  turbopack: { root: projectRoot },

  // three/drei ship untranspiled ESM that Turbopack handles, but the webpack
  // production path needs them explicitly listed.
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],

  experimental: {
    optimizePackageImports: ['d3', 'motion'],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
