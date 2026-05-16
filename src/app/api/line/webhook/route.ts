import { NextRequest, NextResponse } from 'next/server'
import {
  verifySignature,
  replyMessage,
  pushFlexMessage,
  buildWelcomeFlex,
  buildStartBookingFlex,
  buildMyBookingsFlex,
  buildCancelFlex,
  buildAdminFlex,
  buildDefaultFlex,
} from '@/lib/line'
import { getSheetData } from '@/lib/sheets'

async function getUpcomingBookings(lineUserId: string) {
  const today = new Date().toISOString().split('T')[0]

  const [bookingRows, serviceRows, providerRows] = await Promise.all([
    getSheetData('bookings!A2:L'),
    getSheetData('services!A2:F'),
    getSheetData('providers!A2:B'),
  ])

  return bookingRows
    .filter(r => r[4] === lineUserId && (r[5] ?? '') >= today && (r[11] ?? '') !== 'cancelled')
    .slice(0, 3)
    .map(r => {
      const provider = providerRows.find(p => p[0] === r[1])
      const service = serviceRows.find(s => s[0] === r[1] && s[1] === r[2])
      return {
        bookingId: r[0] as string,
        date: r[5] as string,
        time: r[6] as string,
        providerName: (provider?.[1] as string) ?? '設計師',
        serviceName: (service?.[2] as string) ?? '服務',
      }
    })
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
    try {
      if (event.type === 'follow') {
        await pushFlexMessage(
          event.source.userId,
          '歡迎使用 MooLah 預約系統！',
          buildWelcomeFlex()
        )
        continue
      }

      if (event.type !== 'message' || event.message.type !== 'text') continue

      const userText: string = event.message.text.trim()
      const lower = userText.toLowerCase()
      const userId: string = event.source.userId
      const replyToken: string = event.replyToken

      // 我的預約 — 用 push 避免 replyToken 超時（需查 Sheets）
      if (lower.includes('我的預約') || lower.includes('my booking')) {
        const bookings = await getUpcomingBookings(userId)
        await pushFlexMessage(userId, '我的預約紀錄', buildMyBookingsFlex(bookings))
        continue
      }

      // 取消預約
      if (lower.includes('取消') || lower.includes('cancel')) {
        await replyMessage(replyToken, [
          { type: 'flex', altText: '取消預約說明', contents: buildCancelFlex() },
        ])
        continue
      }

      // 設計師後台
      if (
        lower.includes('後台') ||
        lower.includes('管理') ||
        lower.includes('設計師') ||
        lower.includes('admin')
      ) {
        await replyMessage(replyToken, [
          { type: 'flex', altText: '設計師後台管理', contents: buildAdminFlex() },
        ])
        continue
      }

      // 預約
      if (
        lower.includes('預約') ||
        lower.includes('book') ||
        lower.includes('開始') ||
        lower.includes('立即')
      ) {
        await replyMessage(replyToken, [
          { type: 'flex', altText: '立即預約職人', contents: buildStartBookingFlex() },
        ])
        continue
      }

      // 打招呼
      if (lower.includes('你好') || lower === 'hi' || lower === 'hello' || lower.includes('哈囉')) {
        await replyMessage(replyToken, [
          { type: 'flex', altText: '歡迎使用 MooLah', contents: buildWelcomeFlex() },
        ])
        continue
      }

      // 查詢自己的 LINE ID（設計師綁定用）
      if (lower.includes('我的id') || lower.includes('my id') || lower.includes('lineid')) {
        await replyMessage(replyToken, [
          { type: 'text', text: `您的 LINE User ID：\n${userId}\n\n請截圖傳給 MooLah 管理員` },
        ])
        continue
      }

      // 預設
      await replyMessage(replyToken, [
        { type: 'flex', altText: '有什麼可以幫您？', contents: buildDefaultFlex() },
      ])
    } catch (err) {
      console.error('[webhook event error]', err)
    }
  }

  return NextResponse.json({ ok: true })
}
