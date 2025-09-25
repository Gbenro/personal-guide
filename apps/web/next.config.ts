import type { NextConfig } from "next";
// @ts-ignore
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  env: {
    // Railway PostgreSQL configuration
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
  // Log environment variables during build for debugging
  webpack: (config, { dev }) => {
    if (!dev) {
      console.log('🔧 Build-time environment check:')
      console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET')
      console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET')
      console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL ? 'SET' : 'NOT SET')
    }
    return config
  },
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  sw: "sw.js",
  disable: false,
})(nextConfig);