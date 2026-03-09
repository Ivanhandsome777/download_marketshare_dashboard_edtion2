# Bybit Market Dashboard

Bybit 地区本地市占分析看板 + Claude AI 智能问答，基于 App Store 下载量数据。

## 项目结构

```
bybit-market-dashboard/
├── server.js          # Express 后端（代理 Claude API）
├── package.json       # 依赖配置
├── .env.example       # 环境变量模板（复制为 .env 本地使用）
├── .gitignore
└── public/
    ├── index.html     # 前端主页面（看板 + 聊天界面）
    └── data.js        # 数据文件（7312条记录，自动生成）
```

## 本地运行

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，填入你的 ANTHROPIC_API_KEY

# 3. 启动服务
npm start
# 访问 http://localhost:3000
```

---

## 部署到 Render

### Step 1 — 推送代码到 GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/bybit-dashboard.git
git push -u origin main
```

> **注意**：`.env` 已被 `.gitignore` 排除，API Key 不会提交到 GitHub。

### Step 2 — 在 Render 创建 Web Service

1. 登录 [render.com](https://render.com)，点击 **New → Web Service**
2. 连接你的 GitHub 仓库
3. 填写配置：

| 字段 | 值 |
|------|-----|
| **Name** | `bybit-dashboard`（随意） |
| **Region** | 选离你最近的区域 |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free（免费套餐即可） |

### Step 3 — 配置环境变量

在 Render 控制台，进入你的 Web Service → **Environment** 标签页，添加：

| Key | Value |
|-----|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-你的实际API Key` |
| `ALLOWED_ORIGIN` | `https://你的应用名.onrender.com`（可选，留空允许所有来源） |

> Render 会自动注入 `PORT` 变量，无需手动设置。

### Step 4 — 部署

点击 **Deploy Web Service**，等待 2-3 分钟完成构建。

部署成功后，访问 Render 给你分配的域名（如 `https://bybit-dashboard-xxxx.onrender.com`）即可使用。

---

## 环境变量说明

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `ANTHROPIC_API_KEY` | ✅ 必填 | Anthropic API Key，在 [console.anthropic.com](https://console.anthropic.com/api-keys) 获取 |
| `PORT` | ❌ 可选 | 服务端口，Render 自动注入，本地默认 3000 |
| `ALLOWED_ORIGIN` | ❌ 可选 | CORS 允许来源，留空则允许所有 |

---

## 技术架构

```
浏览器
  │
  ├── GET /           → public/index.html（看板 + 聊天 UI）
  ├── GET /data.js    → public/data.js（7312条市场数据）
  ├── GET /api/config → 检查 API Key 是否已配置（不暴露 Key 本身）
  └── POST /api/chat  → server.js 代理 → Anthropic Claude API
                        （API Key 始终保存在服务端）
```

**安全说明**：API Key 通过环境变量配置在服务端，前端页面无法读取，不会泄露给用户浏览器。
