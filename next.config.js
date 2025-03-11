/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
      domains: ['ndiqnzxplopcbcxzondp.supabase.co'],
    },
    // Make sure PostCSS is properly configured for production
    webpack: (config) => {
      return config;
    },
  }
  
  module.exports = nextConfig