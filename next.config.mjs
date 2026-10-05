/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Product / shop media is served by the Django backend; rendered with plain <img>.
    unoptimized: true,
  },
};

export default nextConfig;
