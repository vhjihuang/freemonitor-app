'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface ThemeToggleProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ThemeToggle({ 
  className, 
  variant = 'ghost', 
  size = 'icon' 
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [icons, setIcons] = useState<{
    Moon: React.ComponentType<any>;
    Sun: React.ComponentType<any>;
    Monitor: React.ComponentType<any>;
  } | null>(null);

  // 组件挂载后设置mounted状态，并动态加载图标
  useEffect(() => {
    setMounted(true);
    
    // 动态导入图标，确保只在客户端加载
    import('lucide-react').then((lucideIcons) => {
      setIcons({
        Moon: lucideIcons.Moon,
        Sun: lucideIcons.Sun,
        Monitor: lucideIcons.Monitor,
      });
    });
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getIcon = () => {
    // 服务器端渲染或图标未加载时返回空div
    if (!mounted || !icons) {
      return <div className="h-4 w-4" aria-hidden="true" />;
    }
    
    if (theme === 'dark') {
      return <icons.Moon className="h-4 w-4" />;
    } else if (theme === 'system') {
      return <icons.Monitor className="h-4 w-4" />;
    } else {
      return <icons.Sun className="h-4 w-4" />;
    }
  };

  const getTooltip = () => {
    // 服务器端渲染时返回默认提示，避免hydration错误
    if (!mounted) {
      return '切换主题';
    }
    
    if (theme === 'dark') {
      return '切换到浅色模式';
    } else if (theme === 'system') {
      return '切换到浅色模式';
    } else {
      return '切换到深色模式';
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={cn("relative", className)}
      title={getTooltip()}
      aria-label="切换主题"
      // 确保按钮在服务器端和客户端渲染一致
      suppressHydrationWarning={true}
    >
      {getIcon()}
    </Button>
  );
}