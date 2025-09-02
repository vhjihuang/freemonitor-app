/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true,
  },
  output: 'standalone', // 生成独立部署包
  poweredByHeader: false, // 安全加固
  images: {
    domains: ['localhost'], // 根据实际需求扩展
    unoptimized: process.env.NODE_ENV === 'development', // 开发环境不压缩
  },
};

module.exports = nextConfig;