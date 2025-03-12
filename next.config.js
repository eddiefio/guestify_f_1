/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['ndiqnzxplopcbcxzondp.supabase.co'],
  },
  // Add CSP headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com;
              font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com;
              img-src 'self' data: blob: https://ndiqnzxplopcbcxzondp.supabase.co;
              connect-src 'self' https://ndiqnzxplopcbcxzondp.supabase.co;
              frame-src 'self';
              object-src 'none';
              base-uri 'self';
            `.replace(/\s+/g, ' ').trim()
          },
        ],
      },
    ];
  },
  // Use a custom webpack configuration to provide fallbacks
  webpack: (config) => {
    // Provide polyfills for certain Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    
    return config;
  },
}

module.exports = nextConfig