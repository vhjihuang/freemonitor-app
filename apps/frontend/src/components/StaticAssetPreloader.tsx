import { useEffect } from 'react';

/**
 * 静态资源预加载器（简化版）
 * 仅添加link标签，不进行主动预加载，避免增加额外网络请求
 */
interface PreloadResource {
  href: string;
  as: 'style' | 'script' | 'image' | 'font' | 'fetch';
  type?: string;
  crossorigin?: boolean;
  priority?: 'high' | 'low';
  onLoad?: () => void;
  onError?: () => void;
}

interface PreloadOptions {
  criticalCss?: string[];
  criticalImages?: string[];
  criticalFonts?: string[];
  criticalScripts?: string[];
}

/**
 * 静态资源预加载Hook
 */
export function usePreloadAssets(options: PreloadOptions = {}) {
  const {
    criticalCss = [],
    criticalImages = [],
    criticalFonts = [],
    criticalScripts = [],
  } = options;

  // 动态生成资源列表
  const getResources = (): PreloadResource[] => {
    const resources: PreloadResource[] = [];

    // CSS文件预加载
    criticalCss.forEach(css => {
      resources.push({
        href: css,
        as: 'style',
        type: 'text/css',
        priority: 'low',
      });
    });

    // 图片预加载
    criticalImages.forEach(image => {
      resources.push({
        href: image,
        as: 'image',
        priority: 'low',
      });
    });

    // 字体预加载
    criticalFonts.forEach(font => {
      resources.push({
        href: font,
        as: 'font',
        type: 'font/woff2',
        crossorigin: true,
        priority: 'low',
      });
    });

    // 脚本预加载
    criticalScripts.forEach(script => {
      resources.push({
        href: script,
        as: 'script',
        type: 'application/javascript',
        priority: 'low',
      });
    });

    return resources;
  };

  // 添加link标签（但不主动预加载）
  const addResourceLinks = (resources: PreloadResource[]) => {
    resources.forEach(resource => {
      // 检查是否已存在该资源的link标签
      const existingLink = document.querySelector(`link[href="${resource.href}"]`);
      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = resource.href;
        link.as = resource.as;
        
        if (resource.type) link.type = resource.type;
        if (resource.crossorigin) link.crossOrigin = 'anonymous';
        if (resource.priority) link.setAttribute('fetchpriority', resource.priority);

        // 添加load和error事件监听
        if (resource.onLoad) {
          link.addEventListener('load', resource.onLoad);
        }
        if (resource.onError) {
          link.addEventListener('error', resource.onError);
        }

        document.head.appendChild(link);
      }
    });
  };

  // 初始化预加载
  useEffect(() => {
    const resources = getResources();
    
    // 使用requestIdleCallback在浏览器空闲时添加资源链接
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      requestIdleCallback(() => {
        addResourceLinks(resources);
      });
    } else {
      // 降级处理
      setTimeout(() => {
        addResourceLinks(resources);
      }, 100);
    }
  }, []);

  return {
    addResourceLinks
  };
}

/**
 * 静态资源预加载组件
 */
export function AssetPreloader({ 
  options = {}
}: { 
  options?: PreloadOptions;
}) {
  const { addResourceLinks } = usePreloadAssets(options);
  
  // 组件不渲染任何内容，只是提供功能
  return null;
}

/**
 * 关键CSS预加载组件（简化版）
 */
export function CriticalCSSPreloader() {
  useEffect(() => {
    // 检查是否已存在critical CSS的预加载链接
    const criticalCssLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"][data-critical="true"]'));
    
    if (criticalCssLinks.length === 0) {
      // 查找所有CSS链接
      const cssLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      
      if (cssLinks.length > 0) {
        // 获取第一个CSS链接（通常是布局CSS）
        const firstCssLink = cssLinks[0] as HTMLLinkElement;
        
        // 为第一个CSS链接添加prefetch属性，但不主动预加载
        firstCssLink.setAttribute('data-critical', 'true');
      }
    }
  }, []);

  return null;
}

/**
 * 图像预加载组件（简化版）
 */
export function ImagePreloader({ 
  images = [], 
  priority = 'low',
  className = '' 
}: { 
  images: string[];
  priority?: 'high' | 'low';
  className?: string;
}) {
  useEffect(() => {
    // 仅添加预取链接，不主动加载图像
    images.forEach(image => {
      // 检查是否已存在该图像的预取链接
      const existingLink = document.querySelector(`link[href="${image}"][rel="prefetch"]`);
      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = image;
        link.as = 'image';
        link.setAttribute('data-lazy', 'true');
        document.head.appendChild(link);
      }
    });
  }, [images, priority]);

  return null;
}

/**
 * 字体预加载组件（简化版）
 */
export function FontPreloader({ 
  fonts = []
}: { 
  fonts?: string[];
}) {
  useEffect(() => {
    // 仅添加预取链接，不主动加载字体
    fonts.forEach(fontUrl => {
      // 检查是否已存在该字体的预取链接
      const existingLink = document.querySelector(`link[href="${fontUrl}"][rel="prefetch"][as="font"]`);
      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = fontUrl;
        link.as = 'font';
        link.type = 'font/woff2';
        link.setAttribute('data-font', 'true');
        document.head.appendChild(link);
      }
    });
  }, [fonts]);

  return null;
}

/**
 * 完整的静态资源预加载系统（简化版）
 */
export function StaticAssetOptimization({ 
  options = {},
  enableImagePreload = true,
  enableFontPreload = true,
  enableCSSPreload = true
}: {
  options?: PreloadOptions;
  enableImagePreload?: boolean;
  enableFontPreload?: boolean;
  enableCSSPreload?: boolean;
}) {
  return (
    <>
      {/* CSS预加载 */}
      {enableCSSPreload && <CriticalCSSPreloader />}
      
      {/* 字体预加载 */}
      {enableFontPreload && <FontPreloader fonts={options.criticalFonts || []} />}
      
      {/* 图像预加载 */}
      {enableImagePreload && (
        <ImagePreloader 
          images={options.criticalImages || []}
          priority="low"
        />
      )}
    </>
  );
}

/**
 * 使用示例
 */
export const preloadUsageExample = `
/**
 * 静态资源预加载的最佳实践
 */

// 1. 在页面组件中使用
import { StaticAssetOptimization } from '@/components/StaticAssetPreloader';

function MyPage() {
  return (
    <>
      <StaticAssetOptimization 
        options={{
          criticalCss: ['/css/critical.css'],
          criticalImages: ['/images/logo.png', '/images/hero.jpg'],
          criticalFonts: ['/fonts/main.woff2']
        }}
        enableImagePreload={true}
        enableFontPreload={true}
        enableCSSPreload={true}
      />
      {/* 页面内容 */}
    </>
  );
}

// 2. 使用usePreloadAssets hook
import { usePreloadAssets } from '@/components/StaticAssetPreloader';

function CustomComponent() {
  const { addResourceLinks } = usePreloadAssets();
  
  // 使用方法
  const handleUserAction = () => {
    // 添加资源链接（但不主动预加载）
    addResourceLinks([{
      href: '/api/user-data',
      as: 'fetch',
      priority: 'low'
    }]);
  };
  
  return (
    <button onClick={handleUserAction}>
      加载用户数据
    </button>
  );
}
`;