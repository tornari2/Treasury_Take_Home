/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Disable webpack persistent cache in dev to avoid missing pack/chunk files
      config.cache = false;
    }
    return config;
  },
  // Skip ESLint during builds (can be slow)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Skip TypeScript errors during builds (if needed)
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
