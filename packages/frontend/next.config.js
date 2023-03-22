/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/markets',
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
};

module.exports = nextConfig;
