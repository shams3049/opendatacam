/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  
  // Webpack configuration for legacy packages
  webpack: (config, { isServer }) => {
    // Fixes for Node.js modules in client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
      };
    }
    return config;
  },
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  
  // Environment variables
  env: {
    OPENDATACAM_VERSION: '3.1.0',
  },
};

module.exports = nextConfig;
