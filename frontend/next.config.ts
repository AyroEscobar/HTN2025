/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: { root: __dirname },
  eslint: { ignoreDuringBuilds: true },
};
module.exports = nextConfig;
