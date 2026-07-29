import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://moolah-platform.vercel.app'

// 後台／漏斗頁不進索引；其餘全開
const DISALLOW = ['/api/', '/dashboard', '/*/admin', '/*/book', '/go/', '/my-bookings']

// AEO：明確允許主流 AI 檢索與回答引擎抓取（通配規則已涵蓋，
// 明列可讓爬蟲與 AEO 檢測工具直接確認授權，不必推論）
const AI_AGENTS = [
  'GPTBot',            // OpenAI 訓練與檢索
  'OAI-SearchBot',     // ChatGPT 搜尋
  'ChatGPT-User',      // ChatGPT 使用者即時瀏覽
  'ClaudeBot',         // Anthropic
  'Claude-Web',
  'anthropic-ai',
  'PerplexityBot',     // Perplexity
  'Perplexity-User',
  'Google-Extended',   // Google Gemini / AI Overviews
  'Applebot-Extended', // Apple Intelligence
  'CCBot',             // Common Crawl（多數 LLM 語料來源）
  'Bingbot',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOW },
      ...AI_AGENTS.map(userAgent => ({ userAgent, allow: '/', disallow: DISALLOW })),
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
