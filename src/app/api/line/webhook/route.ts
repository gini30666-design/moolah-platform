import { NextRequest, NextResponse } from 'next/server'
import { verifySignature, replyMessage, pushFlexMessage, buildWelcomeFlex } from '@/lib/line'
import { getSheetData } from '@/lib/sheets'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://moolah-platform.vercel.app'

const STATIC_REPLIES: Record<string, string> = {
  '取消預約': `如需取消預約，請聯絡您的設計師，或在設計師頁面點選取消。\n\n設計師確認後將為您處理，感謝配合 🙏`,
  '預約': `感謝您想要預約！\n\n請點選以下連結進入預約頁面：\n${BASE_URL}\n\n或透過設計師的 LINE 官方帳號選單點選「立即預約」。`,
  '客服': `您好！如有任何問題，請描述您的狀況，我們將盡快為您服務。\n\n服務時間：週一至週六 10:00–19:00`,
  '你好': `您好！歡迎使用 MooLah 預約系統 🌿\n\n有什麼可以幫您的嗎？\n• 輸入「預約」開始預約\n• 輸入「我的預約」查看紀錄`,
  'hi':    `Hi！歡迎使用 MooLah 🌿\n\n輸入「預約」開始預約`,
  'hello': `Hello！歡迎使用 MooLah 🌿\n\n輸入「預約」開始預約`,
  '價格': `服務定價因設計師而異，請前往設計師主頁查看詳細項目與價格：\n${BASE_URL}`,
  '費用': `服務定價因設計師而異，請前往設計師主頁查看詳細項目與價格：\n${BASE_URL}`,
}

const DEFAULT_REPLY = `感謝您的訊息！\n\n您可以：\n• 輸入「預約」開始預約\n• 輸入「我的預約」查看預約\n• 輸入「取消預約」申請取消\n• 輸入「客服」聯繫我們`

async function getUpcomingBookings(lineUserId: string): Promise<string> {
  const today = new Date().toISOString().split('T')[0]

  const [bookingRows, serviceRows, providerRows] = await Promise.all([
    getSheetData('bookings!A2:L'),
    getSheetData('services!A2:F'),
    getSheetData('providers!A2:B'),
  ])

  const upcoming = bookingRows
    .filter(r => r[4] === lineUserId && (r[5] ?? '') >= today && (r[11] ?? '') !== 'cancelled')
    .slice(0, 3)

  if (upcoming.length === 0) {
    return `目前沒有待服務的預約紀錄。\n\n想要預約嗎？請點選：\n${BASE_URL}`
  }

  const lines = upcoming.map(r => {
    const providerRow = providerRows.find(p => p[0] === r[1])
    const serviceRow = serviceRows.find(s => s[0] === r[1] && s[1] === r[2])
    const providerName = providerRow?.[1] ?? '設計師'
    const serviceName = serviceRow?.[2] ?? '服務'
    return `📌 ${r[5]} ${r[6]}\n   ${providerName}・${serviceName}\n   編號：${r[0]}`
  }).join('\n\n')

  return `您目前的預約：\n\n${lines}\n\n如需取消，請聯絡您的設計師。`
}

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
      await pushFlexMessage(
        event.source.userId,
        '歡迎使用 MooLah 預約系統！',
        buildWelcomeFlex()
      )
    }

    if (event.type === 'message' && event.message.type === 'text') {
      const userText: string = event.message.text.trim()

      // 我的預約：real-time lookup
      if (userText.includes('我的預約')) {
        const replyText = await getUpcomingBookings(event.source.userId)
        await replyMessage(event.replyToken, [{ type: 'text', text: replyText }])
        continue
      }

      // Static keyword replies
      const matchedKey = Object.keys(STATIC_REPLIES).find(k =>
        userText.toLowerCase().includes(k.toLowerCase())
      )
      await replyMessage(event.replyToken, [
        { type: 'text', text: matchedKey ? STATIC_REPLIES[matchedKey] : DEFAULT_REPLY },
      ])
    }
  }

  return NextResponse.json({ ok: true })
}
