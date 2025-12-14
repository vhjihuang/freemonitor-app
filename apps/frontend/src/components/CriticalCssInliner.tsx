'use client';

import { useEffect, useState } from 'react';

/**
 * 关键CSS内联组件
 * 
 * 该组件负责将关键CSS内联到页面中，以提高页面加载性能。
 * 关键CSS包含渲染首屏内容所需的最小样式集，
 * 减少了关键渲染路径中的阻塞资源数量。
 */
export default function CriticalCssInliner() {
  const [criticalCss, setCriticalCss] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCriticalCss = async () => {
      try {
        // 尝试从服务器加载关键CSS
        const response = await fetch('/critical.css');
        
        if (!response.ok) {
          // 如果加载失败，尝试加载备用关键CSS
          const fallbackResponse = await fetch('/critical.min.css');
          
          if (!fallbackResponse.ok) {
            throw new Error('Failed to load critical CSS');
          }
          
          const css = await fallbackResponse.text();
          setCriticalCss(css);
          setIsLoaded(true);
          return;
        }
        
        const css = await response.text();
        setCriticalCss(css);
        setIsLoaded(true);
      } catch (err) {
        console.error('Error loading critical CSS:', err);
        setError(err instanceof Error ? err.message : 'Failed to load critical CSS');
        setIsLoaded(false);
      }
    };

    // 只有在生产环境中才加载关键CSS
    if (process.env.NODE_ENV === 'production') {
      loadCriticalCss();
    } else {
      // 开发环境中的轻量级替代方案
      setCriticalCss(`
        :root {
          --background: 0 0% 100%;
          --foreground: 222.2 84% 4.9%;
        }
        
        html, body {
          height: 100%;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: hsl(var(--background));
          color: hsl(var(--foreground));
        }
        
        .h-screen {
          height: 100vh;
        }
        
        .min-h-screen {
          min-height: 100vh;
        }
        
        .flex {
          display: flex;
        }
        
        .items-center {
          align-items: center;
        }
        
        .justify-center {
          justify-content: center;
        }
        
        .text-center {
          text-align: center;
        }
        
        .p-4 {
          padding: 1rem;
        }
        
        .bg-background {
          background-color: hsl(var(--background));
        }
        
        .text-foreground {
          color: hsl(var(--foreground));
        }
      `);
      setIsLoaded(true);
    }
  }, []);

  // 如果加载失败或者正在加载，返回null
  if (!isLoaded && !error) {
    return null;
  }

  // 如果发生错误，返回一个基本的内联样式，以避免页面样式丢失
  if (error) {
    return (
      <style
        dangerouslySetInnerHTML={{
          __html: `
            :root {
              --background: 0 0% 100%;
              --foreground: 222.2 84% 4.9%;
            }
            
            html, body {
              height: 100%;
              margin: 0;
              padding: 0;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background-color: hsl(var(--background));
              color: hsl(var(--foreground));
            }
            
            .h-screen {
              height: 100vh;
            }
            
            .min-h-screen {
              min-height: 100vh;
            }
            
            .flex {
              display: flex;
            }
            
            .items-center {
              align-items: center;
            }
            
            .justify-center {
              justify-content: center;
            }
          `
        }}
      />
    );
  }

  // 返回内联的关键CSS
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: criticalCss
      }}
    />
  );
}