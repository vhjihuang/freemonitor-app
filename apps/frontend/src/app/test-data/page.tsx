'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateTestData } from '@/lib/generateTestData';
import { createTestDevices } from './create-test-devices';

export default function TestDataPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleCreateDevices = async () => {
    setLoading(true);
    setMessage('正在创建测试设备...');
    
    try {
      await createTestDevices();
      setMessage('测试设备创建成功！');
    } catch (error) {
      console.error('创建测试设备失败:', error);
      setMessage('创建测试设备失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateData = async () => {
    setLoading(true);
    setMessage('正在生成测试数据...');
    
    try {
      await generateTestData();
      setMessage('测试数据生成成功！');
    } catch (error) {
      console.error('生成测试数据失败:', error);
      setMessage('生成测试数据失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>生成测试数据</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">步骤1: 创建测试设备</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                首先需要创建一些测试设备，然后才能为这些设备生成指标数据。
              </p>
              <Button 
                onClick={handleCreateDevices} 
                disabled={loading}
              >
                {loading ? '创建中...' : '创建测试设备'}
              </Button>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">步骤2: 生成测试数据</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                为所有设备生成测试指标数据，以便在实时数据图表中显示。
              </p>
              <Button 
                onClick={handleGenerateData} 
                disabled={loading}
              >
                {loading ? '生成中...' : '生成测试数据'}
              </Button>
            </div>

            {message && (
              <div className={`p-4 rounded ${message.includes('成功') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}