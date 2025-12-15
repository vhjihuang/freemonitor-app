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
import { registerSchema, RegisterFormValues } from '@/lib/validations';

interface RegisterFormProps {
  onSubmit: (email: string, password: string, name: string) => void;
  error: string | null;
}

export function RegisterForm({ onSubmit, error }: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onFormSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    try {
      await onSubmit(values.email, values.password, values.name);
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
          name="name"
          render={({ field }) => (
            <FormItem fieldName="name">
              <FormLabel>姓名</FormLabel>
              <FormControl>
                <Input 
                  type="text" 
                  placeholder="请输入您的姓名"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                  placeholder="请输入密码（至少6位）"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem fieldName="confirmPassword">
              <FormLabel>确认密码</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder="请再次输入密码"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? '注册中...' : '注册'}
        </Button>
      </form>
    </Form>
  );
}