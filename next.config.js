/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
      domains: ['ndiqnzxplopcbcxzondp.supabase.co'], // Add your Supabase domain
    },
    // Default output directory that Vercel expects
    distDir: '.next',
  }
  
  module.exports = nextConfig