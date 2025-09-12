'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Monitor, Server, Shield, Zap } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Monitor className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">FreeMonitor</span>
          </div>
          <div className="flex space-x-4">
            <Button variant="ghost" onClick={() => router.push('/login')}>
              登录
            </Button>
            <Button onClick={() => router.push('/register')}>
              注册
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            现代设备监控平台
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            FreeMonitor 帮助您实时监控服务器、网络设备和 IoT 设备的状态，
            确保您的基础设施稳定运行。
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" onClick={() => router.push('/register')} className="text-lg px-8 py-6">
              立即开始
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push('/login')} className="text-lg px-8 py-6">
              登录账户
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16 text-gray-900">
            核心功能
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Server className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">设备监控</h3>
              <p className="text-gray-600">
                实时监控服务器、路由器、IoT设备等各类设备的运行状态和性能指标。
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">实时告警</h3>
              <p className="text-gray-600">
                当设备出现异常时立即发送告警通知，帮助您快速响应问题。
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">安全保障</h3>
              <p className="text-gray-600">
                采用JWT认证和加密传输，确保您的数据安全和隐私保护。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
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
            className="text-lg px-8 py-6 bg-white text-blue-600 hover:bg-gray-100"
          >
            免费注册
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-gray-400">
        <div className="container mx-auto px-4 text-center">
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
  );
}