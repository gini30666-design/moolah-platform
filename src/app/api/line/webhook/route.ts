import { NextRequest, NextResponse } from 'next/server'
import { verifySignature, replyMessage, pushFlexMessage, buildWelcomeFlex } from '@/lib/line'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://moolah-platform.vercel.app'

// 關鍵字 → 回覆對照表
const KEYWORD_REPLIES: Record<string, string> = {
  '我的預約': `您好！若要查看您的預約紀錄，請前往設計師預約頁面確認。\n\n如需取消，請聯絡您的設計師或輸入「取消預約」。`,
  '取消預約': `如需取消預約，請提供以下資訊：\n\n• 您的姓名\n• 預約日期與時間\n\n設計師收到後將為您處理，感謝您的配合 🙏`,
  '預約': `感謝您想要預約！\n\n請點選以下連結進入預約頁面：\n${BASE_URL}\n\n或透過設計師的 LINE 官方帳號選單點選「立即預約」。`,
  '客服': `您好！如有任何問題，請描述您的狀況，我們將盡快為您服務。\n\n服務時間：週一至週六 10:00–19:00`,
  '你好': `您好！歡迎使用 MooLah 預約系統 🌿\n\n有什麼可以幫您的嗎？\n輸入「預約」開始預約\n輸入「我的預約」查看紀錄`,
  'hi': `Hi！歡迎使用 MooLah 🌿\n\n請問有什麼可以幫您？\n• 輸入「預約」開始預約\n• 輸入「我的預約」查看紀錄`,
  'hello': `Hello！歡迎使用 MooLah 🌿\n\n請問有什麼可以幫您？`,
  '價格': `我們的服務定價因設計師而異，請前往設計師主頁查看詳細服務項目與價格：\n${BASE_URL}`,
  '費用': `我們的服務定價因設計師而異，請前往設計師主頁查看詳細服務項目與價格：\n${BASE_URL}`,
}

const DEFAULT_REPLY = `感謝您的訊息！\n\n您可以：\n• 輸入「預約」開始預約\n• 輸入「我的預約」查看預約\n• 輸入「取消預約」申請取消\n• 輸入「客服」聯繫我們`

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-line-signature') ?? ''

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const body = JSON.parse(rawBody)
  const events = body.events ?? []

  for (const event of events) {
    if (event.type === 'follow') {
      // 加好友 → 發送歡迎 Flex Message
      await pushFlexMessage(
        event.source.userId,
        '歡迎使用 MooLah 預約系統！',
        buildWelcomeFlex()
      )
    }

    if (event.type === 'message' && event.message.type === 'text') {
      const userText: string = event.message.text.trim()

      // 尋找匹配的關鍵字（不分大小寫）
      const matchedKey = Object.keys(KEYWORD_REPLIES).find(k =>
        userText.toLowerCase().includes(k.toLowerCase())
      )

      const replyText = matchedKey ? KEYWORD_REPLIES[matchedKey] : DEFAULT_REPLY

      await replyMessage(event.replyToken, [
        { type: 'text', text: replyText },
      ])
    }
  }

  return NextResponse.json({ ok: true })
}
