'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/icons'
import Link from 'next/link'
import { apiClient } from '@/lib/api'
import { SuccessResponse } from '@freemonitor/types'

// 将使用useSearchParams的组件提取为独立的客户端组件
function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [isLoading, setIsLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('无效的重置链接')
    }
  }, [token])

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault()
    
    if (!token) {
      setError('无效的重置链接')
      return
    }
    
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }
    
    if (password.length < 6) {
      setError('密码长度至少6位')
      return
    }

    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      const data = await apiClient.post<SuccessResponse<{ message: string }>>('/auth/reset-password', { 
        token, 
        password 
      })
      setMessage(data.message)
      
      // 重置成功后3秒跳转到登录页
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err: any) {
      console.error('Reset password error:', err)
      setError(err.message || '密码重置失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">无效的重置链接</CardTitle>
            <CardDescription>
              重置链接无效或已过期
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Icons.alertCircle className="h-5 w-5 text-red-400 dark:text-red-300" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    无效的重置链接，请重新申请密码重置
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter>
            <Link href="/auth/forgot-password" className="w-full">
              <Button className="w-full">
                重新申请重置
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Link
        href="/login"
        className="absolute left-4 top-4 md:left-8 md:top-8"
      >
        <Button variant="ghost" size="sm">
          <Icons.chevronLeft className="mr-2 h-4 w-4" />
          返回登录
        </Button>
      </Link>
      
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">重置密码</CardTitle>
          <CardDescription>
            请输入新密码
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={onSubmit}>
          <CardContent className="grid gap-4">
            {message ? (
              <div className="rounded-md bg-green-50 dark:bg-green-900/30 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Icons.checkCircle className="h-5 w-5 text-green-400 dark:text-green-300" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      {message}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            
            {error ? (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Icons.alertCircle className="h-5 w-5 text-red-400 dark:text-red-300" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            
            <div className="grid gap-2">
              <Label htmlFor="password">新密码</Label>
              <Input
                id="password"
                type="password"
                autoCapitalize="none"
                autoComplete="new-password"
                autoCorrect="off"
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoCapitalize="none"
                autoComplete="new-password"
                autoCorrect="off"
                disabled={isLoading}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" disabled={isLoading}>
              {isLoading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              重置密码
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

// 加载状态组件
function ResetPasswordFallback() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">重置密码</CardTitle>
          <CardDescription>
            正在加载...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Icons.spinner className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 主页面组件，使用Suspense边界包装动态组件
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  )
}