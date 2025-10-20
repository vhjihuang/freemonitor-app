'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Monitor, Server, Shield, Zap, BarChart3, Bell, Cpu } from 'lucide-react';
import { Navbar } from '@/components/navbar';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6">
                现代设备监控平台
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10">
                实时监控服务器、网络设备和 IoT 设备的状态，确保您的基础设施稳定运行。
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button 
                  size="lg" 
                  onClick={() => router.push('/register')}
                  className="text-lg px-8 py-6"
                >
                  立即开始
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => router.push('/login')}
                  className="text-lg px-8 py-6 text-foreground border-foreground hover:bg-accent dark:border-gray-300 dark:text-gray-300"
                >
                  登录账户
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                为什么选择 FreeMonitor
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                专为现代基础设施设计的监控解决方案
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 hover:shadow-md transition-shadow">
                <div className="bg-blue-100 dark:bg-blue-900/50 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                  <Server className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">全面设备监控</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  实时监控服务器、路由器、IoT设备等各类设备的运行状态和性能指标。
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 hover:shadow-md transition-shadow">
                <div className="bg-green-100 dark:bg-green-900/50 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                  <Bell className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">智能告警</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  当设备出现异常时立即发送告警通知，支持多种通知渠道，帮助您快速响应问题。
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 hover:shadow-md transition-shadow">
                <div className="bg-purple-100 dark:bg-purple-900/50 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                  <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">安全保障</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  采用JWT认证和加密传输，确保您的数据安全和隐私保护。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Preview Section */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                直观的仪表板
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                一目了然地查看所有关键指标和设备状态
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6">
                  <div className="flex items-center">
                    <Cpu className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">CPU 使用率</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">42%</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-6">
                  <div className="flex items-center">
                    <BarChart3 className="h-8 w-8 text-green-600 dark:text-green-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">内存使用</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">6.2 GB</p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-6">
                  <div className="flex items-center">
                    <Zap className="h-8 w-8 text-purple-600 dark:text-purple-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">在线设备</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">24/25</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg h-64 flex items-center justify-center">
                <p className="text-gray-500">图表占位符</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              开始监控您的设备
            </h2>
            <p className="text-xl mb-10 max-w-2xl mx-auto">
              加入数千名使用FreeMonitor的专业用户，提升您的基础设施可靠性
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              onClick={() => router.push('/register')}
              className="text-lg px-8 py-6 bg-white text-blue-600 hover:bg-gray-100 dark:bg-gray-200 dark:text-blue-800 dark:hover:bg-gray-300"
            >
              免费注册
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 bg-gray-900 text-gray-400 dark:bg-gray-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex justify-center mb-6">
              <Monitor className="h-8 w-8 text-blue-400 mr-2" />
              <span className="text-2xl font-bold text-white">FreeMonitor</span>
            </div>
            <p className="mb-4">
              现代设备监控平台，为您的基础设施提供可靠保障
            </p>
            <p className="text-sm">
              © {new Date().getFullYear()} FreeMonitor. 保留所有权利。
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}