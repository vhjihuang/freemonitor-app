# SMTP邮件服务配置指南

## 问题描述
密码重置功能失败，错误信息：`getaddrinfo ENOTFOUND smtp.example.com`

## 解决方案

### 方案1：配置真实SMTP服务（推荐）

#### Gmail配置示例
```bash
# 在 apps/backend/.env 文件中配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # 注意：不是邮箱密码，是应用专用密码
FROM_EMAIL=your-email@gmail.com
APP_URL=http://localhost:3000
```

#### QQ邮箱配置示例
```bash
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@qq.com
SMTP_PASS=your-authorization-code  # QQ邮箱授权码
FROM_EMAIL=your-email@qq.com
APP_URL=http://localhost:3000
```

#### 163邮箱配置示例
```bash
SMTP_HOST=smtp.163.com
SMTP_PORT=25  # 或 465(SSL)/587(TLS)
SMTP_SECURE=false
SMTP_USER=your-email@163.com
SMTP_PASS=your-authorization-code  # 163邮箱授权码
FROM_EMAIL=your-email@163.com
APP_URL=http://localhost:3000
```

### 方案2：开发环境临时方案

当前已配置开发模式回退，当SMTP未正确配置时：
- 密码重置请求会在控制台显示重置链接和令牌
- 不会抛出错误，用户可以继续使用密码重置功能

### 如何获取应用专用密码/授权码

#### Gmail
1. 登录Gmail账户
2. 进入[Google账户安全设置](https://myaccount.google.com/security)
3. 启用"两步验证"（如果未启用）
4. 在"应用专用密码"部分生成新密码

#### QQ邮箱
1. 登录QQ邮箱
2. 进入"设置" → "账户"
3. 开启"POP3/SMTP服务"
4. 根据提示获取授权码

#### 163邮箱
1. 登录163邮箱
2. 进入"设置" → "POP3/SMTP/IMAP"
3. 开启"SMTP服务"
4. 根据提示获取授权码

### 验证配置

配置完成后，重启后端服务：
```bash
cd apps/backend
pnpm dev
```

然后尝试密码重置功能，如果配置正确，应该能正常发送邮件。

## 注意事项

1. **安全第一**：不要在代码中硬编码邮箱密码，使用环境变量
2. **测试环境**：开发阶段可以使用开发模式，生产环境必须配置真实SMTP
3. **邮件限制**：注意各邮箱服务商的发送频率限制
4. **域名验证**：生产环境建议使用企业邮箱或邮件服务商（如SendGrid、Mailgun）