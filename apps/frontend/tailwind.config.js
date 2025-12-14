module.exports = {
    darkMode: ['class'],
    content: [
    './src/app/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}',
  ],
  // Tailwind CSS 优化配置
  future: {
    hoverOnlyWhenSupported: true, // 仅在支持的浏览器上启用hover效果
  },
  theme: {
  	extend: {
      // 优化字体配置
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      // 优化圆角配置
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
      // 优化颜色配置（保持不变但添加性能优化）
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
      },
      // 优化动画配置
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
  	}
  },
  plugins: [
    require("tailwindcss-animate"),
    // 添加CSS清理插件以移除未使用的样式
    function({ addBase, addComponents, addUtilities, theme }) {
      // 自定义工具类优化
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        },
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
          '&::-webkit-scrollbar': {
            width: '6px',
            height: '6px'
          }
        }
      })
    }
  ],
  // 优化配置
  corePlugins: {
    // 禁用一些不常用的功能以减少CSS大小
    preflight: true, // 保持基础样式重置
  },
  // 清理未使用的CSS（仅在生产环境）
  purge: process.env.NODE_ENV === 'production' ? {
    content: [
      './src/app/**/*.{js,jsx,ts,tsx}',
      './src/components/**/*.{js,jsx,ts,tsx}',
      './src/lib/**/*.{js,jsx,ts,tsx}',
      './public/**/*.html',
    ],
    options: {
      safelist: [
        'dark',
        'light',
        'bg-background',
        'text-foreground',
        'h-screen',
        'flex',
        'items-center',
        'justify-center',
        'text-center',
        'min-h-screen',
        'p-4',
        'font-bold',
        'text-lg',
        'md:text-2xl',
        'lg:text-3xl',
        'animate-spin',
        'rounded-full',
        'h-12',
        'w-12',
        'border-b-2',
        'border-gray-900',
      ]
    }
  } : false,
}