// Django backend that /api and /media are proxied to (read at build time).
// Override with BACKEND_ORIGIN, e.g. when port 8000 is taken: BACKEND_ORIGIN=http://127.0.0.1:8001
const BACKEND = (process.env.BACKEND_ORIGIN || 'http://127.0.0.1:8000').replace(/\/$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  skipTrailingSlashRedirect: true,
  allowedDevOrigins: ['192.168.0.166', '192.168.*', '127.0.0.1', 'localhost'],
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*/',
        destination: `${BACKEND}/api/:path*/`,
      },
      {
        source: '/api/:path*',
        destination: `${BACKEND}/api/:path*`,
      },
      {
        source: '/media/:path*',
        destination: `${BACKEND}/media/:path*`,
      },
    ];
  },
};

export default nextConfig;
