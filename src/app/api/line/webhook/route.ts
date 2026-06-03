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
  buildProviderScheduleFlex,
  buildCustomerHistoryFlex,
} from '@/lib/line'
import { getSheetData } from '@/lib/sheets'

async function getUpcomingBookings(lineUserId: string) {
  const today = new Date().toISOString().split('T')[0]

  const [bookingRows, serviceRows, providerRows] = await Promise.all([
    getSheetData('bookings!A2:M'),
    getSheetData('services!A2:F'),
    getSheetData('providers!A2:B'),
  ])

  return bookingRows
    .filter(r => r[4] === lineUserId && (r[5] ?? '') >= today && (r[12] ?? '') !== 'cancelled')
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

// ── Provider helpers ──────────────────────────────────────────────────────
function todayTW(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00+08:00')
  d.setDate(d.getDate() + n)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

async function findProviderByLineUserId(userId: string) {
  const rows = await getSheetData('providers!A2:E')
  const match = rows.find(r => (r[4] ?? '').trim() === userId)
  if (!match) return null
  return { providerId: match[0] as string, name: match[1] as string }
}

async function getProviderBookingsForRange(providerId: string, fromDate: string, toDate: string) {
  const [bookingRows, serviceRows] = await Promise.all([
    getSheetData('bookings!A2:M'),
    getSheetData('services!A2:F'),
  ])

  return bookingRows
    .filter(r => r[1] === providerId && r[5] >= fromDate && r[5] <= toDate && (r[12] ?? '') !== 'cancelled')
    .sort((a, b) => (a[5] + a[6]).localeCompare(b[5] + b[6]))
    .map(r => {
      const service = serviceRows.find(s => s[0] === providerId && s[1] === r[2])
      return {
        date: r[5] as string,
        time: r[6] as string,
        customerName: (r[3] as string) ?? '客人',
        serviceName: (service?.[2] as string) ?? '服務',
        customerPhone: (r[11] as string) ?? '',
      }
    })
}

async function getCustomerHistory(providerId: string, customerName: string) {
  const [bookingRows, serviceRows] = await Promise.all([
    getSheetData('bookings!A2:M'),
    getSheetData('services!A2:F'),
  ])

  const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase()
  const needle = norm(customerName)

  const matched = bookingRows
    .filter(r => r[1] === providerId && norm((r[3] ?? '') as string).includes(needle))
    .sort((a, b) => (b[5] + b[6]).localeCompare(a[5] + a[6]))

  if (matched.length === 0) return { found: false as const, customerName }

  const recentBookings = matched.slice(0, 5).map(r => {
    const service = serviceRows.find(s => s[0] === providerId && s[1] === r[2])
    return {
      date: r[5] as string,
      time: r[6] as string,
      serviceName: (service?.[2] as string) ?? '服務',
      status: (r[12] as string) ?? 'confirmed',
    }
  })

  return {
    found: true as const,
    customerName: (matched[0][3] as string) ?? customerName,
    totalVisits: matched.filter(r => r[12] !== 'cancelled').length,
    lastVisitDate: matched[0][5] as string,
    recentBookings,
  }
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

      // ── 設計師端：先檢查 userId 是否為合作設計師 ─────────────────────────
      const provider = await findProviderByLineUserId(userId)

      if (provider) {
        // 今日預約
        if (lower.includes('今日') || lower === 'today' || userText === '今天') {
          const t = todayTW()
          const bookings = await getProviderBookingsForRange(provider.providerId, t, t)
          await pushFlexMessage(userId, '今日預約', buildProviderScheduleFlex({
            providerName: provider.name, providerId: provider.providerId,
            rangeLabel: '今日', dateRangeText: t, bookings,
          }))
          continue
        }

        // 明日預約
        if (lower.includes('明日') || lower === 'tomorrow' || userText === '明天') {
          const t = addDays(todayTW(), 1)
          const bookings = await getProviderBookingsForRange(provider.providerId, t, t)
          await pushFlexMessage(userId, '明日預約', buildProviderScheduleFlex({
            providerName: provider.name, providerId: provider.providerId,
            rangeLabel: '明日', dateRangeText: t, bookings,
          }))
          continue
        }

        // 本週預約
        if (lower.includes('本週') || lower === 'week' || userText === '這週') {
          const from = todayTW()
          const to = addDays(from, 6)
          const bookings = await getProviderBookingsForRange(provider.providerId, from, to)
          await pushFlexMessage(userId, '本週預約', buildProviderScheduleFlex({
            providerName: provider.name, providerId: provider.providerId,
            rangeLabel: '本週', dateRangeText: `${from.slice(5)} – ${to.slice(5)}`, bookings,
          }))
          continue
        }

        // @客名 查詢客人歷史
        if (userText.startsWith('@') && userText.length >= 2) {
          const customerName = userText.slice(1).trim()
          if (customerName.length > 0) {
            const history = await getCustomerHistory(provider.providerId, customerName)
            await pushFlexMessage(userId, `${customerName} 的歷史紀錄`, buildCustomerHistoryFlex(history))
            continue
          }
        }
      }

      // ── 顧客端關鍵字 ────────────────────────────────────────────────────
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
