# WebGPT - 安全的 AI 对话助手

这是一个基于 Next.js 构建的、设计精美的 AI 对话应用。它支持自定义模型、流式响应，并具备安全的访问控制功能。

## ✨ 功能特点

- 🔒 **安全访问**：内置密码锁屏，保护你的 API 使用权。
- 🎨 **精美设计**：采用现代化的 Glassmorphism（毛玻璃）设计风格。
- ⚡ **流式响应**：实时打字机效果，响应迅速。
- 💾 **本地记忆**：聊天记录保存在本地浏览器中，无需后端数据库。
- ☁️ **Vercel 部署**：专为 Vercel Serverless 环境优化，一键托管。

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

在项目根目录创建一个 `.env.local` 文件，并填入以下内容：

```env
# 你的访问密码（用户必须输入此密码才能使用）
ACCESS_PASSWORD=your_secure_password

# 你的 OpenAI API Key (或兼容的 API Key)
API_KEY=sk-xxxxxxxxxxxxxxxxxxxx

# API 基础地址 (可选，默认为 https://api.openai.com/v1)
# 如果使用中转服务，请修改此地址，例如：https://api.deepseek.com/v1
BASE_URL=https://api.openai.com/v1

# 用户信息配置 (可选)
NEXT_PUBLIC_USER_NAME=WebGPT User
NEXT_PUBLIC_USER_DESCRIPTION=Pro Plan
NEXT_PUBLIC_USER_AVATAR=AI

# 登录页配置 (可选)
NEXT_PUBLIC_AUTH_TITLE=WebGPT Access
NEXT_PUBLIC_AUTH_SUBTITLE=Enter your credentials to continue

# 超级管理员配置 (用于生成注册 Token)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### 3. 启动开发服务器

```bash
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)。

## 🌐 部署到 Vercel

本项目完全兼容 Vercel 部署。

1. 将代码推送到 GitHub。
2. 在 Vercel 中导入本项目。
3. 在 **Environment Variables** (环境变量) 设置中添加上述变量：
   - `ACCESS_PASSWORD`
   - `API_KEY`
   - `BASE_URL` (可选)
   - `NEXT_PUBLIC_USER_NAME` (可选)
   - `NEXT_PUBLIC_USER_DESCRIPTION` (可选)
   - `NEXT_PUBLIC_USER_AVATAR` (可选)
   - `NEXT_PUBLIC_AUTH_TITLE` (可选)
   - `NEXT_PUBLIC_AUTH_SUBTITLE` (可选)
4. 点击 **Deploy** 等待部署完成。

## 🛡️ 安全说明

- **API Key 安全**：API Key 仅在服务端（Vercel Serverless Function）使用，不会暴露给前端客户端。
- **访问控制**：虽然前端有锁屏，但真正的安全验证发生在 `/api/chat` 接口，只有携带正确密码的请求才会被处理。

---

**注意**：请勿将包含真实 Key 的 `.env.local` 文件提交到代码仓库！
