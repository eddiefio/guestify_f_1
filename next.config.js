/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Change to false to reduce duplicate auth calls
  images: {
    domains: ['ndiqnzxplopcbcxzondp.supabase.co'],
  },
  // Make sure PostCSS is properly configured for production
  webpack: (config) => {
    return config;
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
}

module.exports = nextConfig