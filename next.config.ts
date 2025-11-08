import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Explicitly disable service workers - we use Firebase Firestore
  reactStrictMode: true,
  // Enable static export for Capacitor
  output: 'export',
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  // Trailing slash for better compatibility
  trailingSlash: true,
};

export default nextConfig;
