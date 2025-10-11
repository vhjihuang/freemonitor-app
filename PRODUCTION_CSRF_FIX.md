# 生产环境CSRF问题解决方案

## 问题描述
生产环境部署后，前端登录时出现"Invalid CSRF token provided"错误，但本地开发环境正常。

## 根本原因分析
1. **API代理配置错误** - 前端Vercel配置将API请求代理到前端域名而不是后端服务器
2. **跨域Cookie问题** - 生产环境前后端域名不同，Cookie设置需要特殊处理
3. **环境变量配置** - 生产环境的环境变量可能未正确设置

## 已实施的修复

### 1. 后端CSRF中间件修复
- ✅ 修改了CSRF令牌生成逻辑，重用现有有效令牌
- ✅ 添加了cookie-parser中间件支持
- ✅ 调整Cookie设置：`sameSite: 'lax'` 支持跨域

### 2. 前端Vercel配置修复
- ✅ 更新了`apps/frontend/vercel.json`，将API请求正确代理到后端服务器
- ✅ 添加了`X-CSRF-Token`到允许的请求头

## 生产环境部署检查清单

### 后端环境变量（Railway/Render）
```bash
# 必须设置
DATABASE_URL=你的PostgreSQL数据库连接字符串
PORT=3001
NODE_ENV=production

# CORS配置（必须修改为实际的前端域名）
FRONTEND_URL=https://你的前端域名.vercel.app

# 安全密钥（必须修改为强随机字符串）
JWT_SECRET=你的JWT密钥（至少32位随机字符串）
CSRF_SECRET=你的CSRF密钥（至少32位随机字符串）

# 可选配置
API_RATE_LIMIT=100
```

### 前端环境变量（Vercel）
```bash
# 必须设置
NEXT_PUBLIC_API_URL=https://你的后端域名.railway.app
NEXT_PUBLIC_APP_URL=https://你的前端域名.vercel.app
```

### 验证步骤

1. **后端部署验证**
   ```bash
   # 检查后端是否正常运行
   curl https://你的后端域名.railway.app/api/health
   
   # 检查CSRF令牌接口
   curl -c cookies.txt https://你的后端域名.railway.app/api/csrf/token
   ```

2. **前端部署验证**
   - 访问前端应用
   - 打开浏览器开发者工具，检查Network标签
   - 登录时观察API请求是否发送到正确后端域名
   - 检查请求头是否包含`X-CSRF-Token`

3. **CSRF功能验证**
   - 首次访问应用时，前端应自动获取CSRF令牌
   - 登录请求应包含有效的CSRF令牌
   - Cookie中应有`XSRF-TOKEN`设置

## 常见问题排查

### 问题1：仍然出现CSRF错误
**解决方案：**
1. 检查后端`FRONTEND_URL`环境变量是否正确设置
2. 验证前端`NEXT_PUBLIC_API_URL`环境变量
3. 检查浏览器Cookie设置，确保允许第三方Cookie

### 问题2：跨域请求被阻止
**解决方案：**
1. 确保后端CORS配置允许前端域名
2. 检查Vercel代理配置是否正确
3. 验证请求头是否包含必要的CORS头信息

### 问题3：生产环境与本地行为不一致
**解决方案：**
1. 使用相同的环境变量配置本地和生产环境
2. 确保依赖版本一致
3. 检查构建配置是否针对生产环境优化

## 部署流程

1. **后端部署**
   - 推送代码到GitHub
   - Railway/Render自动部署
   - 验证环境变量设置

2. **前端部署**
   - 推送代码到GitHub
   - Vercel自动部署
   - 验证环境变量设置

3. **功能验证**
   - 测试登录功能
   - 验证CSRF令牌流程
   - 检查所有API端点

## 监控和日志

- 后端日志：检查CSRF相关的错误日志
- 前端监控：使用浏览器开发者工具监控网络请求
- 错误追踪：配置Sentry或其他错误监控工具

## 总结

通过修复Vercel配置和后端CSRF中间件，生产环境的CSRF问题应该得到解决。关键是要确保：

1. ✅ API请求正确代理到后端服务器
2. ✅ 前后端环境变量正确配置
3. ✅ CSRF令牌生成和验证逻辑正确
4. ✅ 跨域Cookie设置合理

如果问题仍然存在，请按照排查步骤逐一检查配置。