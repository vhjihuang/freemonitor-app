# CSRF生产环境部署检查清单

## 🚨 高风险问题 - 必须解决

### 1. 环境变量配置
**问题**: 生产环境缺少强随机`CSRF_SECRET`
**解决方案**: 在Render后台设置环境变量

```bash
# 生成强随机密钥（32字节）
openssl rand -base64 32

# 在Render环境变量中设置
CSRF_SECRET=生成的强随机密钥
```

**检查项**:
- [ ] Render环境变量中已设置`CSRF_SECRET`
- [ ] 密钥长度至少32字节
- [ ] 密钥为随机生成，非默认值

### 2. CORS配置一致性
**问题**: 前后端CORS策略不一致
**解决方案**: 已修正Vercel配置

**检查项**:
- [ ] Vercel配置中`Access-Control-Allow-Origin`设置为具体域名
- [ ] 已添加`Access-Control-Allow-Credentials: true`
- [ ] 后端CORS配置允许前端域名

## 🔧 配置修正详情

### Vercel配置修正
文件: `apps/frontend/vercel.json`

**修正前**:
```json
"Access-Control-Allow-Origin": "*",
```

**修正后**:
```json
"Access-Control-Allow-Origin": "https://freemonitor-app.vercel.app",
"Access-Control-Allow-Credentials": "true"
```

### CSRF中间件配置
文件: `apps/backend/src/common/middleware/csrf.middleware.ts`

**当前安全配置**:
- Cookie `sameSite: 'none'` (支持跨域)
- 生产环境启用`secure: true`
- 令牌验证严格

## 📋 部署前测试清单

### 环境检查
- [ ] Render环境变量`CSRF_SECRET`已设置
- [ ] Render环境变量`NODE_ENV=production`
- [ ] Vercel部署配置已更新

### 功能测试
- [ ] 前端能正常获取CSRF令牌
- [ ] POST/PUT/PATCH/DELETE请求能正常通过CSRF验证
- [ ] 跨域Cookie传递正常
- [ ] 错误处理机制正常

### 安全测试
- [ ] 缺少CSRF令牌的请求被正确拒绝
- [ ] 无效CSRF令牌的请求被正确拒绝
- [ ] 生产环境调试日志已禁用

## 🚀 部署步骤

1. **设置环境变量**
   ```bash
   # 在Render后台设置
   CSRF_SECRET=<生成的强随机密钥>
   NODE_ENV=production
   ```

2. **部署后端**
   - 确保代码包含最新的CSRF中间件修正
   - 触发Render自动部署

3. **部署前端**
   - 确保`vercel.json`配置已更新
   - 部署到Vercel

4. **验证功能**
   - 访问生产环境前端
   - 测试关键功能（登录、设备操作等）
   - 检查控制台无CSRF相关错误

## 📞 故障排除

### 常见问题

**问题**: CSRF验证失败，错误403
**解决**: 检查环境变量`CSRF_SECRET`是否正确设置

**问题**: Cookie无法跨域传递
**解决**: 确认Vercel配置中`Access-Control-Allow-Credentials: true`

**问题**: 生产环境调试信息泄露
**解决**: 确保`NODE_ENV=production`，禁用详细日志

## 🔒 安全建议

1. **定期轮换密钥**: 每3-6个月更换`CSRF_SECRET`
2. **监控告警**: 设置CSRF验证失败监控
3. **安全审计**: 定期进行安全扫描
4. **备份恢复**: 备份环境变量配置

---

**最后更新**: 2024年
**负责人**: 部署团队
**状态**: ✅ 高风险问题已解决