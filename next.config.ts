import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Explicitly disable service workers - we use Firebase Firestore
  reactStrictMode: true,
};

export default nextConfig;
