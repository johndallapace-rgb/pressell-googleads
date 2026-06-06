import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/legal/privacy', destination: '/privacy-policy', permanent: true },
      { source: '/legal/terms', destination: '/terms-of-service', permanent: true },
      { source: '/legal/disclaimer', destination: '/disclaimer', permanent: true },
      { source: '/terms', destination: '/terms-of-service', permanent: true },
    ];
  },
  reactCompiler: true,
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
