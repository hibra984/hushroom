import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: [
    '@hushroom/shared-types',
    '@hushroom/shared-validators',
    '@hushroom/shared-constants',
  ],
};

export default nextConfig;
