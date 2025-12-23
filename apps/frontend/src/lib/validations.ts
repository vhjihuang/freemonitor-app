import { z } from 'zod';

// 共享的表单验证模式

// 基础邮箱验证模式
export const emailSchema = z
  .email({ message: '请输入有效的邮箱地址' })
  .min(1, '邮箱地址不能为空');

// 基础密码验证模式
export const passwordSchema = z.string()
  .min(6, '密码长度至少6位')
  .refine((val) => {
    // 至少包含一个大写字母、一个小写字母、一个数字和一个特殊字符
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(val);
  }, {
    message: '密码必须包含大小写字母、数字和特殊字符'
  });

// 登录表单验证模式
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema, // 使用与后端一致的密码验证规则
});

// 注册表单验证模式
export const registerSchema = z.object({
  name: z.string()
    .min(2, '姓名至少2个字符')
    .max(50, '姓名不能超过50个字符'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, '请确认密码'),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

// 密码重置表单验证模式
export const resetPasswordSchema = z.object({
  email: emailSchema,
});

// 设备表单验证模式
export const deviceSchema = z.object({
  name: z.string()
    .min(1, '设备名称不能为空')
    .max(100, '设备名称不能超过100个字符'),
  hostname: z.string().optional(),
  ipAddress: z.string()
    .min(1, 'IP地址不能为空')
    .refine((val) => {
      // 简单的IP地址验证
      const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      return ipv4Regex.test(val);
    }, {
      message: '请输入有效的IP地址'
    }),
  description: z.string().optional(),
  type: z.enum(['SERVER', 'ROUTER', 'IOT']).optional(),
  status: z.enum(['ONLINE', 'OFFLINE', 'DEGRADED', 'UNKNOWN', 'MAINTENANCE']).optional(),
  location: z.string().optional(),
  tags: z.array(z.string()).optional(),
  deviceGroupId: z.string().optional().nullable(),
});

// 类型推断
export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
export type DeviceFormValues = z.infer<typeof deviceSchema>;