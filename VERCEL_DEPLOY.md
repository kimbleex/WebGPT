# Vercel 部署指南

## 问题原因
Vercel 部署后数据库连接失败的主要原因：
1. Prisma 7 需要在构建时正确生成客户端
2. 环境变量在 Vercel 中未正确配置
3. Serverless 环境下数据库连接池配置不当

## 已修复的问题

### 1. 优化了数据库连接 (`lib/db.ts`)
- 添加了连接超时和池大小配置
- 改进了 SSL 配置逻辑
- 添加了更详细的错误提示
- 添加了连接字符串验证

### 2. 更新了构建脚本 (`package.json`)
```json
"build": "prisma generate && next build"
```
确保在构建前生成 Prisma 客户端。

### 3. 更新了 Next.js 配置 (`next.config.ts`)
添加了 Prisma 的 serverless 支持：
```typescript
experimental: {
  serverComponentsExternalPackages: ['@prisma/client', '@prisma/adapter-pg'],
}
```

### 4. 优化了 Prisma 配置 (`prisma.config.ts`)
- 移除了调试日志
- 改进了环境变量加载逻辑

## Vercel 环境变量配置

在 Vercel Dashboard 中设置以下环境变量：

### 必需变量
1. **DATABASE_URL** (最重要)
   ```
   postgresql://user:password@host:port/database?sslmode=require
   ```

2. **API_KEY** - 你的 OpenAI 或兼容 API 的密钥

3. **BASE_URL** - API 基础地址

4. **ADMIN_USERNAME** & **ADMIN_PASSWORD** - 管理员登录凭据

5. **JWT_SECRET** - JWT 签名密钥

## 部署步骤

### 1. 在 Vercel 中配置环境变量
进入 **Settings** → **Environment Variables**，添加所有必需变量

### 2. 触发重新部署
推送代码或在 Vercel Dashboard 手动重新部署

### 3. 验证部署
访问应用并尝试登录，确认数据库连接正常

## 常见问题

- **连接失败**: 检查 `DATABASE_URL` 是否正确配置
- **SSL 错误**: 确保 URL 包含 `?sslmode=require`
- **超时**: 确认数据库允许来自 Vercel 的连接
