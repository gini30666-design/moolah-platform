import crypto from 'crypto'

const LINE_API = 'https://api.line.me/v2/bot/message'
const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://moolah-platform.vercel.app'

export async function pushMessage(to: string, text: string): Promise<boolean> {
  if (!to) return false
  const res = await fetch(`${LINE_API}/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      to,
      messages: [{ type: 'text', text }],
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error('[LINE pushMessage error]', res.status, err, { to: to.slice(0, 8) + '...' })
    return false
  }
  return true
}

export async function multicastMessage(userIds: string[], text: string) {
  await fetch(`${LINE_API}/multicast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      to: userIds,
      messages: [{ type: 'text', text }],
    }),
  })
}

// LINE Quick Reply 預設套組 (#16)
type QuickReplyItem = { label: string; text: string; emoji?: string }
function buildQuickReply(items: QuickReplyItem[]) {
  return {
    items: items.slice(0, 13).map(it => ({
      type: 'action' as const,
      action: { type: 'message' as const, label: `${it.emoji ?? ''} ${it.label}`.trim().slice(0, 20), text: it.text },
    })),
  }
}

// 顧客通用 Quick Reply（4 個最常用入口）
export const CUSTOMER_QUICK_REPLY: QuickReplyItem[] = [
  { label: '探索職人', text: '預約' },
  { label: '我的預約', text: '我的預約' },
  { label: '再約一次', text: '再約' },
  { label: '聯絡客服', text: '客服' },
]

// 設計師通用 Quick Reply（5 個常用指令）
export const PROVIDER_QUICK_REPLY: QuickReplyItem[] = [
  { label: '今日', text: '今日' },
  { label: '明日', text: '明日' },
  { label: '本週', text: '本週' },
  { label: '進入後台', text: '我的後台' },
  { label: '聯絡客服', text: '客服' },
]

export async function pushFlexMessage(to: string, altText: string, contents: object, quickReply?: QuickReplyItem[]) {
  const message: Record<string, unknown> = { type: 'flex', altText, contents }
  if (quickReply && quickReply.length > 0) {
    message.quickReply = buildQuickReply(quickReply)
  }
  const res = await fetch(`${LINE_API}/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      to,
      messages: [message],
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error('[LINE pushFlexMessage error]', res.status, err, { to })
  }
}

export async function replyMessage(replyToken: string, messages: object[]) {
  const res = await fetch(`${LINE_API}/reply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error('[LINE replyMessage error]', res.status, err)
  }
}

export function verifySignature(body: string, signature: string): boolean {
  const secret = process.env.LINE_MESSAGING_CHANNEL_SECRET!
  const hash = crypto
    .createHmac('SHA256', secret)
    .update(body)
    .digest('base64')
  return hash === signature
}

// 歡迎訊息 Flex Message（加好友時發送）
// ── 歡迎 Flex（carousel 4 卡：探索／我的預約／FAQ／客服） #15 ──────────────
function welcomeCard(params: {
  emoji: string
  eyebrow: string
  title: string
  desc: string
  ctaLabel: string
  ctaAction: { type: 'uri'; uri: string } | { type: 'message'; text: string }
  bgColor?: string
}): object {
  const { emoji, eyebrow, title, desc, ctaLabel, ctaAction, bgColor } = params
  return {
    type: 'bubble',
    size: 'kilo',
    body: {
      type: 'box', layout: 'vertical', paddingAll: '18px', spacing: 'none',
      backgroundColor: bgColor ?? '#fbf9f4',
      contents: [
        { type: 'text', text: emoji, size: '3xl', align: 'center' as const },
        { type: 'text', text: eyebrow, size: 'xs', color: '#A68966', weight: 'bold' as const, align: 'center' as const, margin: 'md' as const },
        { type: 'text', text: title, weight: 'bold' as const, size: 'lg', color: '#2C2825', align: 'center' as const, margin: 'sm' as const },
        { type: 'text', text: desc, size: 'xs', color: '#888888', wrap: true, align: 'center' as const, margin: 'sm' as const },
      ],
    },
    footer: {
      type: 'box', layout: 'vertical', paddingAll: '14px',
      contents: [
        {
          type: 'button',
          action: ctaAction.type === 'uri'
            ? { type: 'uri', label: ctaLabel, uri: ctaAction.uri }
            : { type: 'message', label: ctaLabel, text: ctaAction.text },
          style: 'primary',
          color: '#A68966',
          height: 'sm',
        },
      ],
    },
  }
}

export function buildWelcomeFlex(): object {
  return {
    type: 'carousel',
    contents: [
      welcomeCard({
        emoji: '✨',
        eyebrow: 'DISCOVER',
        title: '探索職人',
        desc: '髮型・美甲・寵物・汽車美容，4 大類別精選職人',
        ctaLabel: '開始探索',
        ctaAction: { type: 'uri', uri: `${BASE_URL}/discover` },
      }),
      welcomeCard({
        emoji: '📅',
        eyebrow: 'MY BOOKINGS',
        title: '我的預約',
        desc: '即時查詢、取消、改期紀錄',
        ctaLabel: '查看預約',
        ctaAction: { type: 'message', text: '我的預約' },
      }),
      welcomeCard({
        emoji: '💬',
        eyebrow: 'FAQ',
        title: '常見問題',
        desc: '預約 / 付款 / 改期，傳關鍵字即可',
        ctaLabel: '問問看',
        ctaAction: { type: 'message', text: '客服' },
      }),
      welcomeCard({
        emoji: '🌿',
        eyebrow: 'SUPPORT',
        title: '聯絡 MooLah',
        desc: '需要協助？直接傳訊息給我們',
        ctaLabel: '聯絡客服',
        ctaAction: { type: 'message', text: '聯絡客服' },
      }),
    ],
  }
}

function bulletText(text: string) {
  return {
    type: 'box',
    layout: 'horizontal',
    spacing: 'sm',
    contents: [
      { type: 'text', text: '•', size: 'sm', color: '#9b8ea0', flex: 0 },
      { type: 'text', text, size: 'sm', color: '#555555', wrap: true },
    ],
  }
}

function numberedStep(num: string, text: string) {
  return {
    type: 'box',
    layout: 'horizontal',
    spacing: 'sm',
    contents: [
      { type: 'text', text: `${num}.`, size: 'sm', color: '#999999', flex: 0 },
      { type: 'text', text, size: 'sm', color: '#555555', wrap: true },
    ],
  }
}

// ── 開始預約 Flex ──────────────────────────────────────────────────────────
export function buildStartBookingFlex(): object {
  return {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '20px',
      spacing: 'none',
      contents: [
        { type: 'text', text: '立即預約職人', weight: 'bold', size: 'xl', color: '#2C2825' },
        {
          type: 'text',
          text: '選擇喜愛的職人，輕鬆完成線上預約。',
          size: 'sm',
          color: '#888888',
          wrap: true,
          margin: 'sm',
        },
        { type: 'separator', margin: 'xl' },
        {
          type: 'box',
          layout: 'vertical',
          spacing: 'md',
          margin: 'xl',
          contents: [
            numberedStep('1', '瀏覽職人・選擇服務'),
            numberedStep('2', '挑選時段・填寫基本資料'),
            numberedStep('3', '確認預約・等候 LINE 通知'),
          ],
        },
        {
          type: 'text',
          text: '全程線上操作，不需電話聯絡',
          size: 'xs',
          color: '#bbbbbb',
          margin: 'xl',
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '16px',
      contents: [
        {
          type: 'button',
          action: { type: 'uri', label: '開始預約', uri: `${BASE_URL}/discover` },
          style: 'primary',
          color: '#06C755',
          height: 'sm',
        },
      ],
    },
  }
}

// ── 我的預約 Flex ──────────────────────────────────────────────────────────
export function buildMyBookingsFlex(
  bookings: Array<{
    bookingId: string
    date: string
    time: string
    providerName: string
    serviceName: string
  }>
): object {
  const hasBookings = bookings.length > 0

  const bookingItems = hasBookings
    ? bookings.slice(0, 3).flatMap((b, i) => [
        ...(i > 0 ? [{ type: 'separator' as const, margin: 'md' as const }] : []),
        {
          type: 'box' as const,
          layout: 'vertical' as const,
          spacing: 'xs' as const,
          margin: 'md' as const,
          contents: [
            {
              type: 'box' as const,
              layout: 'horizontal' as const,
              contents: [
                {
                  type: 'text' as const,
                  text: `${b.date}　${b.time}`,
                  size: 'sm' as const,
                  weight: 'bold' as const,
                  color: '#2C2825',
                  flex: 1,
                },
                {
                  type: 'text' as const,
                  text: '待服務',
                  size: 'xs' as const,
                  color: '#A68966',
                  align: 'end' as const,
                  flex: 0,
                },
              ],
            },
            {
              type: 'text' as const,
              text: `${b.providerName}・${b.serviceName}`,
              size: 'xs' as const,
              color: '#888888',
            },
          ],
        },
      ])
    : []

  return {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '20px',
      spacing: 'none',
      contents: [
        { type: 'text', text: '我的預約', weight: 'bold', size: 'xl', color: '#2C2825' },
        ...(hasBookings
          ? [
              {
                type: 'text',
                text: `即將到來：${bookings.length} 筆`,
                size: 'sm',
                color: '#888888',
                margin: 'sm',
              },
              { type: 'separator', margin: 'xl' },
              ...bookingItems,
            ]
          : [
              {
                type: 'text',
                text: '目前沒有待服務的預約。',
                size: 'sm',
                color: '#888888',
                margin: 'md',
                wrap: true,
              },
              {
                type: 'text',
                text: '點下方按鈕開始探索職人',
                size: 'xs',
                color: '#bbbbbb',
                margin: 'sm',
              },
            ]),
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '16px',
      spacing: 'sm',
      contents: hasBookings
        ? [
            {
              type: 'button',
              action: { type: 'uri', label: '查看與修改預約', uri: `${BASE_URL}/my-bookings` },
              style: 'primary',
              color: '#A68966',
              height: 'sm',
            },
            {
              type: 'button',
              action: { type: 'uri', label: '繼續預約', uri: `${BASE_URL}/discover` },
              style: 'link',
              color: '#888888',
              height: 'sm',
            },
          ]
        : [
            {
              type: 'button',
              action: { type: 'uri', label: '探索職人', uri: `${BASE_URL}/discover` },
              style: 'primary',
              color: '#06C755',
              height: 'sm',
            },
          ],
    },
  }
}

// ── 取消預約 Flex ──────────────────────────────────────────────────────────
export function buildCancelFlex(): object {
  return {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '20px',
      spacing: 'none',
      contents: [
        { type: 'text', text: '取消預約', weight: 'bold', size: 'xl', color: '#2C2825' },
        {
          type: 'text',
          text: '前往「我的預約」頁面，一鍵取消指定預約。',
          size: 'sm',
          color: '#888888',
          wrap: true,
          margin: 'sm',
        },
        { type: 'separator', margin: 'xl' },
        {
          type: 'box',
          layout: 'vertical',
          spacing: 'md',
          margin: 'xl',
          contents: [
            numberedStep('1', '點下方按鈕進入我的預約'),
            numberedStep('2', '找到欲取消的預約'),
            numberedStep('3', '點擊「取消此預約」完成'),
          ],
        },
        {
          type: 'text',
          text: '取消後設計師將自動收到通知，感謝配合',
          size: 'xs',
          color: '#bbbbbb',
          margin: 'xl',
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '16px',
      contents: [
        {
          type: 'button',
          action: { type: 'uri', label: '前往我的預約', uri: `${BASE_URL}/my-bookings` },
          style: 'primary',
          color: '#06C755',
          height: 'sm',
        },
      ],
    },
  }
}

// ── 設計師後台 Flex ────────────────────────────────────────────────────────
export function buildAdminFlex(): object {
  return {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '20px',
      spacing: 'none',
      contents: [
        { type: 'text', text: '設計師後台管理', weight: 'bold', size: 'xl', color: '#2C2825' },
        {
          type: 'text',
          text: '查看預約・管理服務・設定排班。',
          size: 'sm',
          color: '#888888',
          wrap: true,
          margin: 'sm',
        },
        { type: 'separator', margin: 'xl' },
        {
          type: 'box',
          layout: 'vertical',
          spacing: 'md',
          margin: 'xl',
          contents: [
            numberedStep('1', '時段視圖：掌握今日所有預約'),
            numberedStep('2', '顧客紀錄：查看到訪歷史'),
            numberedStep('3', '服務管理：新增與編輯服務項目'),
            numberedStep('4', '排班設定：設定營業時間與休假日'),
          ],
        },
        {
          type: 'text',
          text: '以您的 LINE 帳號登入，自動跳轉至您的後台',
          size: 'xs',
          color: '#bbbbbb',
          margin: 'xl',
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '16px',
      contents: [
        {
          type: 'button',
          action: { type: 'uri', label: '進入後台管理', uri: `${BASE_URL}/dashboard` },
          style: 'primary',
          color: '#A68966',
          height: 'sm',
        },
      ],
    },
  }
}

// ── 邀請評價 Flex ──────────────────────────────────────────────────────────
export function buildReviewFlex(params: {
  bookingId: string
  providerId: string
  providerName: string
  serviceName: string
  customerName: string
  customerUserId: string
  date: string
}): object {
  const { bookingId, providerId, providerName, serviceName, customerName, customerUserId, date } = params
  const reviewUrl = `${BASE_URL}/review?b=${bookingId}&p=${providerId}&n=${encodeURIComponent(customerName)}&u=${encodeURIComponent(customerUserId)}`

  return {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '20px',
      spacing: 'none',
      contents: [
        {
          type: 'text',
          text: '服務體驗如何？',
          weight: 'bold',
          size: 'xl',
          color: '#2C2825',
        },
        {
          type: 'text',
          text: `感謝您 ${date} 與 ${providerName} 的預約`,
          size: 'sm',
          color: '#888888',
          wrap: true,
          margin: 'sm',
        },
        { type: 'separator', margin: 'xl' },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'xl',
          spacing: 'xs',
          contents: [
            {
              type: 'text',
              text: serviceName,
              weight: 'bold',
              size: 'md',
              color: '#2C2825',
            },
            {
              type: 'text',
              text: '花 30 秒留下評分，幫助更多人找到優質職人 ✨',
              size: 'xs',
              color: '#888888',
              wrap: true,
              margin: 'sm',
            },
          ],
        },
        {
          type: 'text',
          text: '⭐⭐⭐⭐⭐',
          align: 'center',
          margin: 'xl',
          size: 'lg',
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '16px',
      contents: [
        {
          type: 'button',
          action: { type: 'uri', label: '立即評分', uri: reviewUrl },
          style: 'primary',
          color: '#A68966',
          height: 'sm',
        },
      ],
    },
  }
}

// ── 預設回覆 Flex ──────────────────────────────────────────────────────────
// ── 地圖/位置 Flex ─────────────────────────────────────────────────────────
export function buildMapFlex(params: {
  found: boolean
  storeName?: string
  providerName?: string
  address?: string
  date?: string
  time?: string
}): object {
  const { found, storeName, providerName, address, date, time } = params

  if (!found) {
    return {
      type: 'bubble',
      body: {
        type: 'box', layout: 'vertical', paddingAll: '20px',
        contents: [
          { type: 'text', text: '沒有即將到來的預約', weight: 'bold', size: 'lg', color: '#2C2825' },
          { type: 'text', text: '預約完成後系統可以告訴你怎麼去。', size: 'sm', color: '#888888', margin: 'md', wrap: true },
        ],
      },
      footer: {
        type: 'box', layout: 'vertical', paddingAll: '16px',
        contents: [
          { type: 'button', action: { type: 'uri', label: '探索職人', uri: `${BASE_URL}/discover` }, style: 'primary', color: '#A68966', height: 'sm' },
        ],
      },
    }
  }

  const display = storeName || providerName || '設計師'
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address ?? '')}`

  return {
    type: 'bubble',
    header: {
      type: 'box', layout: 'vertical', paddingAll: '16px', backgroundColor: '#2C2825',
      contents: [
        { type: 'text', text: 'NAVIGATION', size: 'xs', color: '#A68966', weight: 'bold' as const},
        { type: 'text', text: '前往店家', weight: 'bold' as const, size: 'xl', color: '#fbf9f4', margin: 'sm' },
      ],
    },
    body: {
      type: 'box', layout: 'vertical', paddingAll: '20px', spacing: 'md',
      contents: [
        { type: 'text', text: `${date}　${time}`, size: 'sm', color: '#A68966', weight: 'bold' as const },
        { type: 'text', text: display, weight: 'bold' as const, size: 'lg', color: '#2C2825' },
        { type: 'separator', margin: 'md' },
        {
          type: 'box', layout: 'horizontal', spacing: 'sm', margin: 'md',
          contents: [
            { type: 'text', text: '📍', size: 'sm', flex: 0 },
            { type: 'text', text: address ?? '', size: 'sm', color: '#555555', wrap: true, flex: 1 },
          ],
        },
      ],
    },
    footer: {
      type: 'box', layout: 'vertical', paddingAll: '16px', spacing: 'sm',
      contents: [
        { type: 'button', action: { type: 'uri', label: 'Google Maps 導航', uri: mapUrl }, style: 'primary', color: '#A68966', height: 'sm' },
      ],
    },
  }
}

// ── FAQ 答覆 Flex（通用版型）──────────────────────────────────────────────
type FaqAction = { label: string; uri?: string; text?: string }
export function buildFaqFlex(params: {
  title: string
  eyebrow?: string
  bodyLines: string[]
  primaryAction?: FaqAction
  secondaryAction?: FaqAction
}): object {
  const { title, eyebrow, bodyLines, primaryAction, secondaryAction } = params

  const actionToButton = (a: FaqAction, style: 'primary' | 'link', color: string) => ({
    type: 'button' as const,
    action: a.uri
      ? { type: 'uri' as const, label: a.label, uri: a.uri }
      : { type: 'message' as const, label: a.label, text: a.text ?? a.label },
    style, color, height: 'sm' as const,
  })

  return {
    type: 'bubble',
    body: {
      type: 'box', layout: 'vertical', paddingAll: '20px', spacing: 'sm',
      contents: [
        ...(eyebrow ? [{ type: 'text' as const, text: eyebrow, size: 'xs' as const, color: '#A68966', weight: 'bold' as const}] : []),
        { type: 'text', text: title, weight: 'bold' as const, size: 'lg' as const, color: '#2C2825', margin: 'sm' as const },
        { type: 'separator', margin: 'md' as const },
        ...bodyLines.map((line, i) => ({
          type: 'text' as const, text: line, size: 'sm' as const, color: '#555555',
          margin: i === 0 ? 'lg' as const : 'sm' as const, wrap: true,
        })),
      ],
    },
    footer: (primaryAction || secondaryAction) ? {
      type: 'box', layout: 'vertical', paddingAll: '16px', spacing: 'sm',
      contents: [
        ...(primaryAction ? [actionToButton(primaryAction, 'primary', '#A68966')] : []),
        ...(secondaryAction ? [actionToButton(secondaryAction, 'link', '#888888')] : []),
      ],
    } : undefined,
  }
}

// ── 顧客：快速再預約 Flex ──────────────────────────────────────────────────
export function buildRebookFlex(params: {
  hasLast: boolean
  providerId?: string
  providerName?: string
  storeName?: string
  serviceId?: string
  serviceName?: string
  servicePrice?: number
  lastDate?: string
}): object {
  const { hasLast, providerId, providerName, storeName, serviceId, serviceName, servicePrice, lastDate } = params

  if (!hasLast) {
    return {
      type: 'bubble',
      body: {
        type: 'box', layout: 'vertical', paddingAll: '20px',
        contents: [
          { type: 'text', text: '還沒有上次的紀錄', weight: 'bold', size: 'lg', color: '#2C2825' },
          { type: 'text', text: '你還沒在 MooLah 預約過 — 來探索一下吧！', size: 'sm', color: '#888888', margin: 'md', wrap: true },
        ],
      },
      footer: {
        type: 'box', layout: 'vertical', paddingAll: '16px',
        contents: [
          { type: 'button', action: { type: 'uri', label: '探索職人', uri: `${BASE_URL}/discover` }, style: 'primary', color: '#A68966', height: 'sm' },
        ],
      },
    }
  }

  const display = storeName || providerName
  const priceText = servicePrice ? `NT$ ${servicePrice.toLocaleString()}` : ''
  const rebookUrl = `${BASE_URL}/${providerId}/book${serviceId ? `?service=${serviceId}` : ''}`

  return {
    type: 'bubble',
    header: {
      type: 'box', layout: 'vertical', paddingAll: '16px', backgroundColor: '#2C2825',
      contents: [
        { type: 'text', text: 'WELCOME BACK', size: 'xs', color: '#A68966', weight: 'bold' as const},
        { type: 'text', text: '再次預約', weight: 'bold' as const, size: 'xl', color: '#fbf9f4', margin: 'sm' },
      ],
    },
    body: {
      type: 'box', layout: 'vertical', paddingAll: '20px', spacing: 'md',
      contents: [
        { type: 'text', text: '你上次預約的是', size: 'sm', color: '#888888' },
        {
          type: 'box', layout: 'vertical', spacing: 'xs',
          paddingAll: '14px',
          backgroundColor: '#faf7f2',
          cornerRadius: '8px',
          contents: [
            { type: 'text', text: display ?? '', weight: 'bold' as const, size: 'md', color: '#2C2825' },
            { type: 'text', text: serviceName ?? '', size: 'sm', color: '#A68966' },
            { type: 'text', text: `上次：${lastDate}${priceText ? `　·　${priceText}` : ''}`, size: 'xs', color: '#888888', margin: 'sm' },
          ],
        },
        { type: 'text', text: '一鍵帶入同款設計師、同款服務，只要選個新日期就好。', size: 'xs', color: '#bbbbbb', wrap: true, margin: 'md' },
      ],
    },
    footer: {
      type: 'box', layout: 'vertical', paddingAll: '16px', spacing: 'sm',
      contents: [
        { type: 'button', action: { type: 'uri', label: '重訂同款服務', uri: rebookUrl }, style: 'primary', color: '#A68966', height: 'sm' },
        { type: 'button', action: { type: 'uri', label: '看看其他職人', uri: `${BASE_URL}/discover` }, style: 'link', color: '#888888', height: 'sm' },
      ],
    },
  }
}

// ── 設計師：今日/明日/本週排程 Flex ─────────────────────────────────────────
export function buildProviderScheduleFlex(params: {
  providerName: string
  providerId: string
  rangeLabel: string  // 例「今日」「明日」「本週」
  dateRangeText: string  // 例「2026-06-03」「6/3 - 6/9」
  bookings: Array<{
    date: string
    time: string
    customerName: string
    serviceName: string
    customerPhone?: string
  }>
}): object {
  const { providerName, providerId, rangeLabel, dateRangeText, bookings } = params
  const hasBookings = bookings.length > 0

  const items = hasBookings
    ? bookings.slice(0, 8).flatMap((b, i) => [
        ...(i > 0 ? [{ type: 'separator' as const, margin: 'md' as const }] : []),
        {
          type: 'box' as const,
          layout: 'vertical' as const,
          spacing: 'xs' as const,
          margin: 'md' as const,
          contents: [
            {
              type: 'box' as const,
              layout: 'horizontal' as const,
              contents: [
                { type: 'text' as const, text: `${b.date.slice(5)} ${b.time}`, size: 'sm' as const, weight: 'bold' as const, color: '#A68966', flex: 0 },
                { type: 'text' as const, text: `  ${b.customerName}`, size: 'sm' as const, color: '#2C2825', flex: 1 },
              ],
            },
            { type: 'text' as const, text: b.serviceName + (b.customerPhone ? `　·　${b.customerPhone}` : ''), size: 'xs' as const, color: '#888888' },
          ],
        },
      ])
    : []

  return {
    type: 'bubble',
    body: {
      type: 'box', layout: 'vertical', paddingAll: '20px', spacing: 'none',
      contents: [
        { type: 'text', text: `${rangeLabel}預約`, weight: 'bold', size: 'xl', color: '#2C2825' },
        { type: 'text', text: `${providerName}　·　${dateRangeText}`, size: 'xs', color: '#888888', margin: 'sm' },
        ...(hasBookings
          ? [
              { type: 'text', text: `共 ${bookings.length} 筆`, size: 'sm', color: '#A68966', margin: 'sm', weight: 'bold' as const },
              { type: 'separator', margin: 'xl' },
              ...items,
              ...(bookings.length > 8 ? [{ type: 'text', text: `… 還有 ${bookings.length - 8} 筆，請進後台查看`, size: 'xs' as const, color: '#bbbbbb', margin: 'lg' as const }] : []),
            ]
          : [
              { type: 'separator', margin: 'xl' },
              { type: 'text', text: `${rangeLabel}沒有預約 ✓`, size: 'sm', color: '#888888', margin: 'md', wrap: true },
              { type: 'text', text: '可以休息或補上社群貼文～', size: 'xs', color: '#bbbbbb', margin: 'sm' },
            ]),
      ],
    },
    footer: {
      type: 'box', layout: 'vertical', paddingAll: '16px',
      contents: [
        { type: 'button', action: { type: 'uri', label: '進入後台管理', uri: `${BASE_URL}/${providerId}/admin` }, style: 'primary', color: '#A68966', height: 'sm' },
      ],
    },
  }
}

// ── 設計師：查詢客人歷史 Flex ──────────────────────────────────────────────
export function buildCustomerHistoryFlex(params: {
  customerName: string
  found: boolean
  totalVisits?: number
  lastVisitDate?: string
  recentBookings?: Array<{ date: string; time: string; serviceName: string; status: string }>
}): object {
  const { customerName, found, totalVisits, lastVisitDate, recentBookings } = params

  if (!found) {
    return {
      type: 'bubble',
      body: {
        type: 'box', layout: 'vertical', paddingAll: '20px',
        contents: [
          { type: 'text', text: `找不到「${customerName}」`, weight: 'bold', size: 'lg', color: '#2C2825' },
          { type: 'text', text: '可能此客人尚未預約過，或姓名拼字不同。', size: 'sm', color: '#888888', margin: 'md', wrap: true },
          { type: 'text', text: '可至後台「預約管理」搜尋更完整紀錄。', size: 'xs', color: '#bbbbbb', margin: 'lg' },
        ],
      },
    }
  }

  const items = (recentBookings ?? []).slice(0, 5).flatMap((b, i) => [
    ...(i > 0 ? [{ type: 'separator' as const, margin: 'sm' as const }] : []),
    {
      type: 'box' as const, layout: 'horizontal' as const, margin: 'sm' as const,
      contents: [
        { type: 'text' as const, text: b.date, size: 'xs' as const, color: '#A68966', flex: 0 },
        { type: 'text' as const, text: `  ${b.serviceName}`, size: 'xs' as const, color: '#2C2825', flex: 1 },
        { type: 'text' as const, text: b.status === 'cancelled' ? '取消' : b.status === 'no_show' ? 'no-show' : '完成', size: 'xs' as const, color: b.status === 'no_show' ? '#cc2255' : '#888888', align: 'end' as const, flex: 0 },
      ],
    },
  ])

  return {
    type: 'bubble',
    body: {
      type: 'box', layout: 'vertical', paddingAll: '20px', spacing: 'none',
      contents: [
        { type: 'text', text: customerName, weight: 'bold', size: 'xl', color: '#2C2825' },
        { type: 'text', text: `累計到訪 ${totalVisits} 次　·　最後 ${lastVisitDate}`, size: 'xs', color: '#888888', margin: 'sm' },
        { type: 'separator', margin: 'xl' },
        { type: 'text', text: '最近 5 筆紀錄', size: 'xs', color: '#A68966', margin: 'lg', weight: 'bold' as const },
        ...items,
      ],
    },
  }
}

export function buildDefaultFlex(): object {
  return {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '20px',
      spacing: 'none',
      contents: [
        { type: 'text', text: '有什麼可以幫您？', weight: 'bold', size: 'xl', color: '#2C2825' },
        {
          type: 'text',
          text: '請選擇以下服務，或直接輸入問題。',
          size: 'sm',
          color: '#888888',
          wrap: true,
          margin: 'sm',
        },
        { type: 'separator', margin: 'xl' },
        {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          margin: 'lg',
          contents: [
            bulletText('輸入「開始預約」進行預約'),
            bulletText('輸入「我的預約」查看紀錄'),
            bulletText('輸入「取消預約」申請取消'),
            bulletText('輸入「設計師後台」進入管理'),
          ],
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '16px',
      contents: [
        {
          type: 'button',
          action: { type: 'uri', label: '瀏覽所有職人', uri: `${BASE_URL}/discover` },
          style: 'primary',
          color: '#06C755',
          height: 'sm',
        },
      ],
    },
  }
}
