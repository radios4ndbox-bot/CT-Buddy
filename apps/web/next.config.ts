import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // i pacchetti del monorepo sono distribuiti come sorgenti TypeScript
  transpilePackages: ['@ct-buddy/core', '@ct-buddy/db'],
};

export default nextConfig;
