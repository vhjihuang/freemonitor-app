/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,      // Rust压缩
  compress: true,       // 启用压缩
  // 移除styledComponents配置，因为项目使用Tailwind CSS而不是styled-components
  output: process.env.RENDER_STATIC ? 'export' : undefined, // Render静态部署时使用export
  poweredByHeader: false, // 安全加固
  images: {
    domains: ['localhost', 'freemonitor.local'], // 根据实际需求扩展
    unoptimized: true, // 静态导出需要
  },
  trailingSlash: true, // 静态导出推荐
  distDir: process.env.RENDER_STATIC ? 'out' : '.next',
  // 明确禁用standalone模式以避免Turbo工作区冲突
  // 注意：Next.js 14.0.0中standalone配置已移除
  // experimental: {
  //   standalone: false,
  // },
  // 简化CSS优化配置
  experimental: {
    optimizeCss: true,     // 启用CSS优化
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'], // 优化包导入
  },
  // 优化构建输出
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // 生产环境移除console
  },
  // 添加CSS预加载提示
  async headers() {
    return [
      {
        source: '/_next/static/css/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // 1年缓存
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;