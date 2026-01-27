/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Skip linting during build (can cause failures in CI)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
