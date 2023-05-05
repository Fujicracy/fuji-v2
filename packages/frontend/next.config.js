/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  // TODO: remove when ready for prod
  async redirects() {
    return [
      {
        source: '/markets',
        destination: '/',
        permanent: true,
      },
    ];
  },
  reactStrictMode: true,
  swcMinify: true,
  rewrites: () => [
    {
      source: '/proxy/defillama/:path',
      destination: 'https://yields.llama.fi/:path',
    },
  ],
  // fix "Module not found: Can't resolve 'fs'" thrown by @connext/nxtp-sdk
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback, // if you miss it, all the other options in fallback, specified
      // by next.js will be dropped. Doesn't make much sense, but how it is
      fs: false, // the solution
    };

    return config;
  },
  // this enables running "yarn build && yarn next export" when deploying in prod
  images: {
    unoptimized: true,
  }
};

module.exports = nextConfig;
