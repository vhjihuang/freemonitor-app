'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import Link from 'next/link';
import { loginSchema, LoginFormValues } from '@/lib/validations';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => void;
  error: string | null;
}

export function LoginForm({ onSubmit, error }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onFormSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      await onSubmit(values.email, values.password);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem fieldName="email">
              <FormLabel>邮箱地址</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="请输入邮箱地址"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem fieldName="password">
              <FormLabel>密码</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder="请输入密码"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link href="/auth/forgot-password" className="text-blue-600 hover:text-blue-800">
              忘记密码？
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? '登录中...' : '登录'}
        </Button>
      </form>
    </Form>
  );
}