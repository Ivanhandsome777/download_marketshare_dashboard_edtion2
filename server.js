/**
 * server.js — Bybit Market Dashboard 后端
 *
 * 职责：
 *  1. 托管 public/ 目录下的静态文件（HTML / JS / CSS）
 *  2. 提供 /api/config 端点，向前端暴露安全的配置信息
 *  3. 提供 /api/chat 端点，代理 Anthropic Claude API 调用
 *     （API Key 始终保存在服务端，不暴露给浏览器）
 */

require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ── 中间件 ────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));

// CORS
app.use((req, res, next) => {
  const allowed = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// 静态文件
app.use(express.static(path.join(__dirname, 'public')));

// ── /api/config ──────────────────────────────────────────
// 前端通过此接口判断后端是否已配置 API Key，
// 不返回 Key 本身，只返回一个 ready 标志
app.get('/api/config', (req, res) => {
  res.json({
    apiReady: !!process.env.ANTHROPIC_API_KEY,
    model: 'claude-sonnet-4-20250514',
  });
});

// ── /api/chat ─────────────────────────────────────────────
// 接收前端的对话历史 + 系统提示，代理转发给 Claude，返回回复文本
app.post('/api/chat', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: '服务端未配置 ANTHROPIC_API_KEY，请联系管理员。' });
  }

  const { messages, system } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: '请求格式错误：缺少 messages 字段' });
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: system || '',
        messages,
      }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: data?.error?.message || `Anthropic API 错误 ${upstream.status}`,
      });
    }

    const reply = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    res.json({ reply });
  } catch (err) {
    console.error('[/api/chat]', err);
    res.status(500).json({ error: '服务端请求异常，请稍后重试。' });
  }
});

// ── 兜底：所有未匹配路由返回 index.html ──────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── 启动 ──────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`  API Key configured: ${!!process.env.ANTHROPIC_API_KEY}`);
});
