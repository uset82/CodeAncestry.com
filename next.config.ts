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
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei', 'mermaid'],

  experimental: {
    // Only packages actually imported by source belong here. The previous list
    // named 'd3' and 'motion', neither of which appears in any import in this
    // repo, which made the whole option a no-op.
    optimizePackageImports: ['d3-hierarchy', 'd3-sankey', 'cytoscape'],
  },

  // First-load JS budgets (production, route-level). `three` stays behind
  // HelixHero's dynamic import; `cytoscape` and `d3-sankey` stay behind
  // CodeTree layout switches. `npm run analyze` is the check.
  //   /            ≤ 180 kB
  //   /family/*    ≤ 250 kB before a force/sankey layout is chosen
  //   /docs/*      mermaid loads only when a diagram mounts

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

  /* www always folds onto the apex. Reserved ecosystem hosts land on the
     surfaces that already exist, so a parked CNAME never 404s. */
  async redirects() {
    const apex = 'https://codeancestry.com';
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.codeancestry.com' }],
        destination: `${apex}/:path*`,
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'docs.codeancestry.com' }],
        destination: `${apex}/docs/:path*`,
        permanent: false,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'research.codeancestry.com' }],
        destination: `${apex}/research`,
        permanent: false,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'registry.codeancestry.com' }],
        destination: `${apex}/explore`,
        permanent: false,
      },
      ...(['app', 'api', 'lab'] as const).map((sub) => ({
        source: '/:path*',
        has: [{ type: 'host' as const, value: `${sub}.codeancestry.com` }],
        destination: `${apex}/`,
        permanent: false,
      })),
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
