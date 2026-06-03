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
  buildRebookFlex,
  buildFaqFlex,
} from '@/lib/line'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://moolah-platform.vercel.app'

// ── FAQ 條目（關鍵字 → 答覆）─────────────────────────────────────────────
// 順序：先比對的優先；複合關鍵字寫在前面避免被單字搶走
type FaqEntry = {
  keywords: string[]
  build: () => object
}

const FAQ_ENTRIES: FaqEntry[] = [
  // 改期 / 改時間
  {
    keywords: ['改期', '改時間', '改預約', '改一下', 'reschedule'],
    build: () => buildFaqFlex({
      eyebrow: 'FAQ',
      title: '怎麼改期？',
      bodyLines: [
        '系統目前無法直接改期，請以下列方式處理：',
        '① 進「我的預約」取消原本的預約',
        '② 重新選擇新的時段下單',
        '※ 若距離原預約 < 2 小時，請直接聯絡設計師',
      ],
      primaryAction: { label: '進入我的預約', uri: `${BASE_URL}/my-bookings` },
      secondaryAction: { label: '聯絡 MooLah 客服', text: '聯絡客服' },
    }),
  },
  // 付款方式
  {
    keywords: ['付款', '怎麼付', '怎麼收費', '收費方式', '可以刷卡嗎', '現金'],
    build: () => buildFaqFlex({
      eyebrow: 'FAQ',
      title: '怎麼付款？',
      bodyLines: [
        'MooLah 不收任何預付金或手續費。',
        '所有服務費用「到店後」由設計師直接收取（現金 / LINE Pay / 設計師接受的方式）。',
        '價格在預約頁與「我的預約」均可查看。',
      ],
      primaryAction: { label: '我的預約', uri: `${BASE_URL}/my-bookings` },
    }),
  },
  // 找設計師 / 怎麼找
  {
    keywords: ['找設計師', '怎麼找', '找職人', '推薦設計師', '推薦職人', '哪位'],
    build: () => buildFaqFlex({
      eyebrow: 'FAQ',
      title: '怎麼找設計師？',
      bodyLines: [
        '點下方「探索職人」，依「類別 → 縣市」三步驟即可看到合作職人列表。',
        '每位職人都有完整作品集、評價與服務項目可供參考。',
      ],
      primaryAction: { label: '探索職人', uri: `${BASE_URL}/discover` },
    }),
  },
  // 發票
  {
    keywords: ['發票', '收據', '報帳', 'invoice'],
    build: () => buildFaqFlex({
      eyebrow: 'FAQ',
      title: '可以開發票嗎？',
      bodyLines: [
        '若需要服務費發票或收據，請直接向設計師索取（每位設計師營業狀態不同）。',
        'MooLah 平台月費（限合作設計師）由永翔數位有限公司開立電子發票。',
      ],
      secondaryAction: { label: '聯絡 MooLah 客服', text: '聯絡客服' },
    }),
  },
  // 客服 / 聯絡
  {
    keywords: ['客服', '聯絡客服', '聯絡', '人工', '客訴', '不滿意'],
    build: () => buildFaqFlex({
      eyebrow: 'SUPPORT',
      title: '聯絡 MooLah',
      bodyLines: [
        '✉️  moolah118@gmail.com',
        '🕐 客服時間：每日 09:00 – 21:00',
        '若是「預約 / 設計師相關問題」，請先點下方按鈕加入合作 LINE 客服。',
      ],
      primaryAction: { label: '加入客服 LINE', uri: 'https://line.me/R/ti/p/@492ejbwx' },
    }),
  },
  // 我的後台（設計師）
  {
    keywords: ['我的後台', 'dashboard'],
    build: () => buildFaqFlex({
      eyebrow: 'PROVIDER',
      title: '進入設計師後台',
      bodyLines: [
        '點下方按鈕，系統會自動以您的 LINE 帳號識別並跳轉到您的後台。',
        '若顯示「尚未綁定」，請先完成 /claim 認領流程。',
      ],
      primaryAction: { label: '進入後台', uri: `${BASE_URL}/dashboard` },
    }),
  },
  // 會員 / 注冊
  {
    keywords: ['會員', '註冊', '註冊帳號', 'sign up', 'register'],
    build: () => buildFaqFlex({
      eyebrow: 'FAQ',
      title: '不用註冊',
      bodyLines: [
        'MooLah 不需要註冊帳號 — 加 LINE 好友就能直接預約。',
        '你的 LINE 大頭貼即是你的識別，預約紀錄會自動綁定。',
      ],
      primaryAction: { label: '開始預約', uri: `${BASE_URL}/discover` },
    }),
  },
  // 隱私 / 個資
  {
    keywords: ['隱私', '個資', '個人資料', 'privacy'],
    build: () => buildFaqFlex({
      eyebrow: 'PRIVACY',
      title: '你的資料安全',
      bodyLines: [
        'MooLah 僅收集預約必要資料（姓名 / 聯絡方式 / LINE userId）。',
        '不出售、不外流給第三方。完整政策請見下方連結。',
      ],
      primaryAction: { label: '閱讀隱私政策', uri: `${BASE_URL}/privacy` },
    }),
  },
]

function matchFaq(lower: string, raw: string): FaqEntry | null {
  for (const entry of FAQ_ENTRIES) {
    if (entry.keywords.some(kw => lower.includes(kw) || raw.includes(kw))) {
      return entry
    }
  }
  return null
}
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

async function getLastBookingForCustomer(lineUserId: string) {
  const [bookingRows, serviceRows, providerRows] = await Promise.all([
    getSheetData('bookings!A2:M'),
    getSheetData('services!A2:F'),
    getSheetData('providers!A2:H'),  // need storeName at index 6
  ])

  // 最新一筆「非取消」的預約（不管未來或過去都可重訂）
  const sorted = bookingRows
    .filter(r => r[4] === lineUserId && (r[12] ?? '') !== 'cancelled')
    .sort((a, b) => (b[5] + b[6]).localeCompare(a[5] + a[6]))

  if (sorted.length === 0) return { hasLast: false as const }

  const last = sorted[0]
  const providerId = last[1] as string
  const serviceId = last[2] as string
  const provider = providerRows.find(p => p[0] === providerId)
  const service = serviceRows.find(s => s[0] === providerId && s[1] === serviceId)

  return {
    hasLast: true as const,
    providerId,
    providerName: (provider?.[1] as string) ?? '設計師',
    storeName: (provider?.[6] as string) ?? '',
    serviceId,
    serviceName: (service?.[2] as string) ?? '服務',
    servicePrice: service ? Number(service[3]) : undefined,
    lastDate: last[5] as string,
  }
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
      // 快速再預約（#1）— 一鍵帶入上次同款設計師 + 同款服務
      if (
        lower.includes('再約') ||
        lower.includes('再次預約') ||
        lower.includes('上次') ||
        lower.includes('rebook') ||
        lower === '再一次'
      ) {
        const lastBooking = await getLastBookingForCustomer(userId)
        await pushFlexMessage(userId, '再次預約', buildRebookFlex(lastBooking))
        continue
      }

      // 我的預約 — 用 push 避免 replyToken 超時（需查 Sheets）
      if (lower.includes('我的預約') || lower.includes('my booking')) {
        const bookings = await getUpcomingBookings(userId)
        await pushFlexMessage(userId, '我的預約紀錄', buildMyBookingsFlex(bookings))
        continue
      }

      // FAQ 大擴充（#2）— 在「取消」/「預約」廣義關鍵字之前比對，避免被誤捕
      const faqMatch = matchFaq(lower, userText)
      if (faqMatch) {
        await replyMessage(replyToken, [
          { type: 'flex', altText: 'MooLah 常見問題', contents: faqMatch.build() },
        ])
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
