/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  // Skip ESLint during builds (can be slow)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Skip TypeScript errors during builds (if needed)
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig
