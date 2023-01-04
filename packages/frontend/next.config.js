/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  rewrites: () => [
    {
      source: "/proxy/defillama/:path",
      destination: "https://yields.llama.fi/:path",
    },
  ],
}

module.exports = nextConfig
