/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,      // Rust压缩
  compress: true,       // 启用压缩
  output: process.env.RENDER_STATIC ? 'export' : undefined, // Render静态部署时使用export
  poweredByHeader: false, // 安全加固
  
  images: {
    domains: ['localhost', 'freemonitor.local'],
    unoptimized: true, // 静态导出需要
    formats: ['image/avif', 'image/webp'], // 现代图片格式
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  trailingSlash: false, // 禁用尾部斜杠以支持静态资产正确加载
  distDir: process.env.RENDER_STATIC ? 'out' : '.next',
  
  // 高级性能优化配置
  experimental: {
    optimizeCss: true,     // 启用CSS优化
    optimizePackageImports: [
      '@radix-ui/react-icons', 
      'lucide-react',
      'recharts',
      'date-fns'
    ], // 优化包导入
    optimizeServerReact: true, // 服务端React优化
    scrollRestoration: true,   // 滚动恢复
  },
  
  // 编译器优化
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    styledComponents: false, // 不使用styled-components
  },
  
  // Webpack优化
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Bundle大小警告阈值
    config.performance = {
      maxAssetSize: 500000, // 500KB
      maxEntrypointSize: 1000000, // 1MB
      hints: process.env.NODE_ENV === 'production' ? 'warning' : false,
    };
    
    return config;
  },
  
  // 缓存和性能头配置
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // PWA支持（如果需要）
  // async rewrites() {
  //   return [
  //     {
  //       source: '/sw.js',
  //       destination: '/_next/static/sw.js',
  //     },
  //   ];
  // },
};

module.exports = nextConfig;