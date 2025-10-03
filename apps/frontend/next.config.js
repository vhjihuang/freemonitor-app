/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: process.env.RENDER_STATIC ? 'export' : 'standalone', // Render静态部署时使用export
  poweredByHeader: false, // 安全加固
  images: {
    domains: ['localhost'], // 根据实际需求扩展
    unoptimized: true, // 静态导出需要
  },
  trailingSlash: true, // 静态导出推荐
  distDir: process.env.RENDER_STATIC ? 'out' : '.next',
};

module.exports = nextConfig;