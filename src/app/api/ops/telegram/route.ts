import { NextRequest, NextResponse } from 'next/server'
import { sendTelegram } from '@/lib/telegram'
import { runOps } from '@/lib/opsAgent'

export const maxDuration = 60

const OK = NextResponse.json({ ok: true })

export async function POST(req: NextRequest) {
  // 缺任一機密 → 視為未啟用，直接 200（部署不會出錯，啟用時再補環境變數）
  const token = process.env.TELEGRAM_BOT_TOKEN
  const ownerId = process.env.OPS_TELEGRAM_USER_ID
  if (!token || !ownerId || !process.env.ANTHROPIC_API_KEY) return OK

  // 驗證請求確實來自 Telegram（secret_token），擋掉偽造 webhook 請求
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (secret && req.headers.get('x-telegram-bot-api-secret-token') !== secret) return OK

  let update: { message?: { text?: string; chat?: { id: number }; from?: { id: number } } }
  try {
    update = await req.json()
  } catch {
    return OK
  }

  const msg = update.message
  if (!msg || !msg.chat) return OK

  // 只有 Gini 本人（OPS_TELEGRAM_USER_ID）能下指令，其餘一律忽略
  if (String(msg.from?.id ?? '') !== String(ownerId)) return OK

  const chatId = msg.chat.id
  const text = (msg.text ?? '').trim()

  if (!text) {
    await sendTelegram(chatId, '目前只支援文字指令喔。')
    return OK
  }
  if (text === '/start' || text === '/help') {
    await sendTelegram(chatId, [
      '👋 MooLah 指揮中心已上線。可以這樣跟我說：',
      '・新增職人 emily，髮型設計師，店名 Studio X，高雄市',
      '・幫 emily 加服務 招牌剪髮 1200 元 60 分鐘',
      '・列出目前所有職人',
      '・給我 emily 的認領連結',
    ].join('\n'))
    return OK
  }

  try {
    const reply = await runOps(text)
    await sendTelegram(chatId, reply)
  } catch (e) {
    console.error('[ops/telegram]', e)
    await sendTelegram(chatId, '⚠️ 處理時發生錯誤，請再試一次。')
  }
  return OK
}
