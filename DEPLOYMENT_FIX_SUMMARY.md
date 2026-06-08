# Vercel 部署 Prisma 数据库连接问题修复总结

## 修复时间
2026/06/08

## 问题描述
每次部署到 Vercel 后，应用显示 "Internal server error"，数据库连接失败。这是 Prisma 在 serverless 环境下常见的配置问题。

## 根本原因
1. **Prisma 7 配置问题**：schema.prisma 和客户端初始化不适配 serverless 环境
2. **构建流程问题**：构建时未正确生成 Prisma 客户端
3. **连接池配置**：serverless 环境需要特殊的连接池配置
4. **Next.js 配置**：缺少 Prisma 的 external packages 配置

## 已实施的修复

### 1. 优化数据库客户端 (`lib/db.ts`)

**修改内容：**
- 添加了连接字符串验证，如果缺少则抛出明确错误
- 优化连接池配置：
  - `max: 10` - 最大连接数
  - `idleTimeoutMillis: 30000` - 30秒后关闭空闲连接
  - `connectionTimeoutMillis: 10000` - 10秒连接超时
- 添加开发环境日志（query, error, warn）
- 改进 SSL 配置逻辑

**为什么重要：** Serverless 环境每次请求可能启动新的进程，需要快速建立和释放连接，避免连接泄漏。

### 2. 更新构建脚本 (`package.json`)

**修改前：**
```json
"build": "next build"
```

**修改后：**
```json
"build": "prisma generate && next build"
```

**为什么重要：** 确保在构建时先生成 Prisma 客户端，否则运行时会找不到生成的客户端代码。

### 3. 更新 Next.js 配置 (`next.config.ts`)

**新增配置：**
```typescript
experimental: {
  serverComponentsExternalPackages: ['@prisma/client', '@prisma/adapter-pg'],
}
```

**为什么重要：** 告诉 Next.js 不要尝试打包这些依赖，让它们保持为外部依赖，避免 serverless 环境下的打包问题。

### 4. 清理 Prisma 配置 (`prisma.config.ts`)

**修改内容：**
- 移除了冗余的 console.log
- 简化了环境变量加载逻辑
- 添加了更好的错误提示

### 5. 移除 schema.prisma 中的废弃配置

**确保：**
```prisma
datasource db {
  provider = "postgresql"
  // 不使用 url = env("DATABASE_URL") - 这在 Prisma 7 中已废弃
}
```

**为什么重要：** Prisma 7 改变了配置方式，数据库 URL 现在通过客户端初始化时的 adapter 传递。

### 6. 创建配置文档

创建了以下文件帮助部署：
- `.env.example` - 环境变量模板
- `VERCEL_DEPLOY.md` - 完整的 Vercel 部署指南

## Vercel 环境变量检查清单

确保在 Vercel Dashboard → Settings → Environment Variables 中设置：

- ✅ `DATABASE_URL` - PostgreSQL 连接字符串（**必需**）
- ✅ `API_KEY` - OpenAI API 密钥
- ✅ `BASE_URL` - API 基础地址
- ✅ `ADMIN_USERNAME` - 管理员用户名
- ✅ `ADMIN_PASSWORD` - 管理员密码
- ✅ `JWT_SECRET` - JWT 签名密钥
- ✅ 可选：`NEXT_PUBLIC_AUTH_TITLE`, `WEB_TITLE`, `WEB_DESC`

**重要：** `DATABASE_URL` 必须包含 `?sslmode=require` 参数！

示例：
```
postgresql://user:password@host:5432/database?sslmode=require
```

## 部署步骤

### 1. 本地验证
```bash
# 生成 Prisma 客户端
npm run postinstall

# 本地测试
npm run dev
```

### 2. 提交代码
```bash
git add .
git commit -m "fix: Prisma database connection for Vercel deployment"
git push
```

### 3. Vercel 配置
1. 登录 Vercel Dashboard
2. 进入项目设置
3. 添加/检查所有环境变量
4. 触发重新部署

### 4. 验证部署
- 访问应用 URL
- 尝试登录
- 检查是否能正常使用

## 测试验证

已在本地验证：
```
✅ Prisma 客户端成功生成
✅ 构建脚本正常工作
✅ 数据库连接配置正确
```

## 常见问题排查

### 问题：部署后仍然显示 "Internal server error"

**排查步骤：**
1. 检查 Vercel 部署日志（Deployments → 选择部署 → Logs）
2. 搜索 "DATABASE_URL" 确认环境变量已加载
3. 搜索 "prisma" 确认客户端生成成功
4. 检查 Function Logs 查看运行时错误

### 问题：连接超时

**可能原因：**
1. 数据库服务器未允许 Vercel IP
2. 数据库服务器离线
3. 连接字符串错误

**解决方案：**
- 检查数据库提供商的防火墙设置
- 确认数据库在线
- 验证连接字符串格式

### 问题：SSL 连接错误

**解决方案：**
- 确保 `DATABASE_URL` 包含 `?sslmode=require`
- 某些数据库可能需要 `?ssl=true` 或其他参数

## 技术细节

### Prisma 7 的变化
Prisma 7 引入了新的配置方式：
- 不再在 `schema.prisma` 中使用 `url = env("...")`
- 通过 `prisma.config.ts` 配置数据源
- 通过 PrismaClient 的 adapter 参数传递连接

### Serverless 最佳实践
1. 使用连接池（pg.Pool）
2. 设置合理的超时时间
3. 限制最大连接数
4. 快速释放空闲连接
5. 使用单例模式避免重复创建客户端

## 参考资源

- [Prisma 7 文档](https://www.prisma.io/docs)
- [Vercel 部署指南](https://vercel.com/docs)
- [Next.js Serverless Functions](https://nextjs.org/docs/app/building-your-application/deploying)

## 后续建议

1. **监控数据库连接**：使用数据库提供商的监控工具
2. **设置告警**：在 Vercel 中配置部署失败告警
3. **日志分析**：定期检查 Function Logs 发现潜在问题
4. **性能优化**：考虑使用 Prisma Accelerate 提升查询性能

---

**修复者：** Claude Code  
**日期：** 2026-06-08  
**状态：** ✅ 已修复，等待部署验证
