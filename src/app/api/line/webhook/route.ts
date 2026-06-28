import { NextRequest, NextResponse } from 'next/server'
import {
  verifySignature,
  replyMessage,
  pushMessage,
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
  buildMapFlex,
  CUSTOMER_QUICK_REPLY,
  PROVIDER_QUICK_REPLY,
} from '@/lib/line'
import { answerProviderQuery } from '@/lib/aiAssistant'

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
import { getSheetData, updateBookingStatus, appendRow } from '@/lib/sheets'
import { sb } from '@/lib/supabase'
import { autoBlacklistIfThresholdReached } from '@/lib/blacklist'

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

// ── #19 黑名單 helpers ─────────────────────────────────────────────────────
async function findBlacklistEntry(providerId: string, customerName: string) {
  const norm = (s: string) => (s ?? '').replace(/\s+/g, '').toLowerCase()
  const needle = norm(customerName)
  try {
    const rows = await getSheetData('blacklist!A2:E')
    return rows.findIndex(r => r[0] === providerId && norm(r[2] as string).includes(needle))
  } catch {
    return -1
  }
}

async function getCustomerLineUserId(providerId: string, customerName: string): Promise<string> {
  // 從歷史預約找出該客人的 lineUserId（最近一筆）
  const rows = await getSheetData('bookings!A2:M')
  const norm = (s: string) => (s ?? '').replace(/\s+/g, '').toLowerCase()
  const needle = norm(customerName)
  const found = rows
    .filter(r => r[1] === providerId && norm(r[3] as string).includes(needle) && (r[4] as string))
    .sort((a, b) => (b[5] + b[6]).localeCompare(a[5] + a[6]))
  return (found[0]?.[4] as string) ?? ''
}

// ── #8 休假快速設定 helpers ────────────────────────────────────────────────
function pad2(n: number): string { return String(n).padStart(2, '0') }

function resolveDate(month: number, day: number): string {
  const today = todayTW()
  const todayObj = new Date(today + 'T12:00:00+08:00')
  const year = todayObj.getFullYear()
  const candidate = `${year}-${pad2(month)}-${pad2(day)}`
  // 若已過：假設是明年
  if (candidate < today) return `${year + 1}-${pad2(month)}-${pad2(day)}`
  return candidate
}

function generateDateRange(fromDate: string, toDate: string): string[] {
  const dates: string[] = []
  let cur = fromDate
  let safety = 0
  while (cur <= toDate && safety < 90) {
    dates.push(cur)
    cur = addDays(cur, 1)
    safety++
  }
  return dates
}

function parseHolidayDates(text: string): string[] {
  if (!/休假|請假|不上班|休息/.test(text)) return []

  // 1. 相對日：今天/明天/後天/大後天
  if (/今天|今日/.test(text)) return [todayTW()]
  if (/明天|明日/.test(text)) return [addDays(todayTW(), 1)]
  if (/後天/.test(text)) return [addDays(todayTW(), 2)]
  if (/大後天/.test(text)) return [addDays(todayTW(), 3)]

  // 2. 區間：M/D - M/D 或 M月D日 - M月D日
  const range = text.match(/(\d{1,2})[\/月](\d{1,2})日?\s*[-~–至到]\s*(\d{1,2})[\/月](\d{1,2})日?/)
  if (range) {
    const from = resolveDate(parseInt(range[1]), parseInt(range[2]))
    const to = resolveDate(parseInt(range[3]), parseInt(range[4]))
    return generateDateRange(from, to)
  }

  // 3. 單日：M/D 或 M月D日
  const single = text.match(/(\d{1,2})[\/月](\d{1,2})日?/)
  if (single) {
    return [resolveDate(parseInt(single[1]), parseInt(single[2]))]
  }

  return []
}

async function blockDatesForProvider(providerId: string, dates: string[]) {
  for (const d of dates) {
    await appendRow('availability!A:F', [providerId, 'block', d, '', '', ''])
  }
}

async function findAffectedBookings(providerId: string, dates: string[]) {
  const dateSet = new Set(dates)
  const rows = await getSheetData('bookings!A2:M')
  return rows
    .filter(r => r[1] === providerId && dateSet.has(r[5] as string) && (r[12] ?? '') !== 'cancelled')
    .map(r => ({
      bookingId: r[0] as string,
      customerName: r[3] as string,
      customerLineUserId: r[4] as string,
      date: r[5] as string,
      time: r[6] as string,
    }))
}

async function notifyAffectedAndCancel(providerName: string, affected: Awaited<ReturnType<typeof findAffectedBookings>>) {
  for (const b of affected) {
    // 自動取消預約（設計師既然休假，原預約無效）
    await updateBookingStatus(b.bookingId, 'cancelled')
    if (b.customerLineUserId) {
      try {
        await pushMessage(
          b.customerLineUserId,
          `🙏 設計師臨時休假通知\n\n您原本 ${b.date} ${b.time} 預約 ${providerName} 的預約已取消。\n造成不便深感抱歉，歡迎重新預約其他時段。`
        )
      } catch (e) {
        console.error('[holiday notify failed]', b.bookingId, e)
      }
    }
  }
}

// 找最近一筆「該客人對該設計師」的 booking 用於 no-show 標記
// 優先：今日 → 昨日 → 前 3 天範圍內最近的一筆 confirmed
async function findRecentBookingForNoShow(providerId: string, customerName: string) {
  const today = todayTW()
  const threeDaysAgo = addDays(today, -3)

  const rows = await getSheetData('bookings!A2:M')
  const norm = (s: string) => (s ?? '').replace(/\s+/g, '').toLowerCase()
  const needle = norm(customerName)

  const candidates = rows
    .filter(r =>
      r[1] === providerId &&
      norm(r[3] as string).includes(needle) &&
      (r[5] as string) >= threeDaysAgo &&
      (r[5] as string) <= today &&
      (r[12] ?? '') === 'confirmed'
    )
    .sort((a, b) => (b[5] + b[6]).localeCompare(a[5] + a[6])) // 最新優先

  if (candidates.length === 0) return null

  const c = candidates[0]
  return {
    bookingId: c[0] as string,
    customerName: c[3] as string,
    date: c[5] as string,
    time: c[6] as string,
  }
}

async function getNextBookingWithAddress(lineUserId: string) {
  const today = todayTW()
  const [bookingRows, providerRows] = await Promise.all([
    getSheetData('bookings!A2:M'),
    getSheetData('providers!A2:H'),  // need address (H) and storeName (G)
  ])

  const upcoming = bookingRows
    .filter(r => r[4] === lineUserId && r[5] >= today && (r[12] ?? '') !== 'cancelled')
    .sort((a, b) => (a[5] + a[6]).localeCompare(b[5] + b[6]))

  if (upcoming.length === 0) return { found: false as const }

  const b = upcoming[0]
  const provider = providerRows.find(p => p[0] === b[1])
  const address = (provider?.[7] as string) ?? ''

  if (!address) return { found: false as const }

  return {
    found: true as const,
    providerName: (provider?.[1] as string) ?? '',
    storeName: (provider?.[6] as string) ?? '',
    address,
    date: b[5] as string,
    time: b[6] as string,
  }
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
        await pushMessage(
          event.source.userId,
          '🌿 歡迎加入 MooLah！\n\n' +
          'MooLah 是為美業職人打造的質感預約系統。在這裡，你可以線上預約、瀏覽職人的作品與服務，預約後也會在這收到確認與提醒。\n\n' +
          '・點下方選單「探索職人」開始探索\n' +
          '・「我的預約」隨時查看或管理你的預約\n' +
          '・有任何問題，直接在這裡留言，我們會盡快協助你 😊\n\n' +
          '讓 MooLah 陪你，把美好的時間留給自己 ✨'
        )
        await pushFlexMessage(
          event.source.userId,
          '歡迎使用 MooLah 預約系統！',
          buildWelcomeFlex(),
          CUSTOMER_QUICK_REPLY
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
          }), PROVIDER_QUICK_REPLY)
          continue
        }

        // 明日預約
        if (lower.includes('明日') || lower === 'tomorrow' || userText === '明天') {
          const t = addDays(todayTW(), 1)
          const bookings = await getProviderBookingsForRange(provider.providerId, t, t)
          await pushFlexMessage(userId, '明日預約', buildProviderScheduleFlex({
            providerName: provider.name, providerId: provider.providerId,
            rangeLabel: '明日', dateRangeText: t, bookings,
          }), PROVIDER_QUICK_REPLY)
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
          }), PROVIDER_QUICK_REPLY)
          continue
        }

        // 休假快速設定（#8）
        // 格式：「今天休假」「明天休假」「6/15 休假」「6月15日休假」「6/15-6/17 休假」
        if (/休假|請假|不上班/.test(userText)) {
          const dates = parseHolidayDates(userText)
          if (dates.length === 0) {
            await replyMessage(replyToken, [{
              type: 'text',
              text: '無法解析休假日期。請用以下格式：\n\n• 今天休假\n• 明天休假\n• 6/15 休假\n• 6月15日休假\n• 6/15-6/17 休假（區間）',
            }])
            continue
          }

          const affected = await findAffectedBookings(provider.providerId, dates)
          await blockDatesForProvider(provider.providerId, dates)

          if (affected.length > 0) {
            await notifyAffectedAndCancel(provider.name, affected)
          }

          const dateText = dates.length === 1
            ? dates[0]
            : `${dates[0]} – ${dates[dates.length - 1]}（共 ${dates.length} 天）`

          await replyMessage(replyToken, [{
            type: 'text',
            text: `✓ 休假已設定\n\n日期：${dateText}\n受影響預約：${affected.length} 筆${affected.length > 0 ? '\n\n已自動取消並推播通知所有客人' : ''}`,
          }])
          continue
        }

        // 黑名單 加入 / 移除（#19）
        // 加入：「黑名單 @客名」「拉黑 @客名 原因說明」
        // 移除：「移除黑名單 @客名」「解封 @客名」
        const removeMatch = userText.match(/^(?:移除黑名單|解封|移出黑名單|解除黑名單)\s*@?(.+)$/)
        const addMatch = userText.match(/^(?:黑名單|拉黑|封鎖)\s+@?(.+?)(?:\s+(.+))?$/)

        if (removeMatch) {
          const customerName = removeMatch[1].trim()
          const norm = (s: string) => (s ?? '').replace(/\s+/g, '').toLowerCase()
          const needle = norm(customerName)
          const blRows = await getSheetData('blacklist!A2:E')
          const match = blRows.find(r => r[0] === provider.providerId && norm(r[2] as string).includes(needle))
          if (!match) {
            await replyMessage(replyToken, [{ type: 'text', text: `「${customerName}」不在黑名單中` }])
          } else {
            // 從黑名單刪除該筆（by provider + 比對到的精確客名）
            await sb.from('blacklist').delete().eq('provider_id', provider.providerId).eq('customer_name', match[2])
            await replyMessage(replyToken, [{ type: 'text', text: `✓ 已將「${customerName}」從黑名單移除` }])
          }
          continue
        }

        if (addMatch) {
          const customerName = addMatch[1].trim()
          const reason = (addMatch[2] ?? '').trim() || '（未填寫原因）'
          const existing = await findBlacklistEntry(provider.providerId, customerName)
          if (existing !== -1) {
            await replyMessage(replyToken, [{ type: 'text', text: `「${customerName}」已在黑名單中` }])
          } else {
            const lineId = await getCustomerLineUserId(provider.providerId, customerName)
            try {
              await appendRow('blacklist!A:E', [
                provider.providerId, lineId, customerName, reason, new Date().toISOString(),
              ])
              await replyMessage(replyToken, [{
                type: 'text',
                text: `✓ 已加入黑名單\n\n客人：${customerName}\n原因：${reason}\n\n該客戶將無法再預約你的服務。`,
              }])
            } catch (err) {
              console.error('[blacklist add]', err)
              await replyMessage(replyToken, [{ type: 'text', text: '系統錯誤，請至 Google Sheets 確認 blacklist 分頁是否存在' }])
            }
          }
          continue
        }

        // No-show 一鍵標記（#9）
        // 格式：「@客名 noshow」「@客名 no-show」「@客名 沒來」「客名 noshow」
        // 支援 @ 開頭或無 @ 但含 noshow 關鍵字
        const noShowMatch =
          userText.match(/^@?(.+?)\s+(?:no[-\s]?show|沒來|缺席)$/i) ||
          userText.match(/^(?:no[-\s]?show|沒來|缺席)\s+@?(.+)$/i)

        if (noShowMatch) {
          const customerName = noShowMatch[1].trim()
          const booking = await findRecentBookingForNoShow(provider.providerId, customerName)

          if (!booking) {
            await replyMessage(replyToken, [{
              type: 'text',
              text: `找不到「${customerName}」近 3 天內的預約。\n如需標記較舊紀錄，請至後台「預約管理」處理。`,
            }])
          } else {
            const ok = await updateBookingStatus(booking.bookingId, 'no_show')
            if (ok) {
              await replyMessage(replyToken, [{
                type: 'text',
                text: `✓ 已標記 no-show\n\n客人：${booking.customerName}\n時段：${booking.date} ${booking.time}\n\n該時段已釋出，新的預約可進來。`,
              }])
              // 觸發自動拉黑檢查（達 3 次 no-show 會自動進黑名單 + push 通知）
              try {
                const bRows = await getSheetData('bookings!A2:M')
                const bRow = bRows.find(r => r[0] === booking.bookingId)
                const customerLineUserId = ((bRow?.[4] as string) ?? '').trim()
                await autoBlacklistIfThresholdReached({
                  providerId: provider.providerId,
                  providerLineUserId: userId,
                  providerName: provider.name,
                  customerLineUserId,
                  customerName: booking.customerName,
                })
              } catch (err) {
                console.error('[webhook noshow → blacklist check]', err)
              }
            } else {
              await replyMessage(replyToken, [{ type: 'text', text: '系統錯誤，請至後台手動標記' }])
            }
          }
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
      // 地圖一鍵導航（#18）
      if (
        lower.includes('地圖') ||
        lower.includes('怎麼去') ||
        lower.includes('店在哪') ||
        lower.includes('地址') ||
        lower.includes('位置') ||
        lower === 'map' ||
        lower === 'location'
      ) {
        const next = await getNextBookingWithAddress(userId)
        await pushFlexMessage(userId, '前往店家', buildMapFlex(next))
        continue
      }

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
        await pushFlexMessage(userId, '我的預約紀錄', buildMyBookingsFlex(bookings), CUSTOMER_QUICK_REPLY)
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

      // 預設兜底：設計師 → AI 自然語言資料查詢（push）；消費者 → 預設卡
      if (provider) {
        try {
          const answer = await answerProviderQuery(provider.providerId, provider.name, userText)
          await pushMessage(userId, answer)
        } catch (err) {
          console.error('[webhook AI fallback error]', err)
          await replyMessage(replyToken, [
            { type: 'flex', altText: '有什麼可以幫您？', contents: buildDefaultFlex() },
          ])
        }
        continue
      }
      await replyMessage(replyToken, [
        { type: 'flex', altText: '有什麼可以幫您？', contents: buildDefaultFlex() },
      ])
    } catch (err) {
      console.error('[webhook event error]', err)
    }
  }

  return NextResponse.json({ ok: true })
}
