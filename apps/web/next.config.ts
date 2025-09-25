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
    // Explicitly expose environment variables to client-side
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // Log environment variables during build for debugging
  webpack: (config, { dev }) => {
    if (!dev) {
      console.log('🔧 Build-time environment check:')
      console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET')
      console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET')
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