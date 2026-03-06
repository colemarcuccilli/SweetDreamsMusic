import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fweeyjnqwxywmpmnqpts.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'customer-w6h9o08eg118alny.cloudflarestream.com',
      },
    ],
  },
};

export default nextConfig;
