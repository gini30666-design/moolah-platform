import crypto from 'crypto'

const LINE_API = 'https://api.line.me/v2/bot/message'
const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://moolah-platform.vercel.app'

export async function pushMessage(to: string, text: string) {
  await fetch(`${LINE_API}/push`, {
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

export async function pushFlexMessage(to: string, altText: string, contents: object) {
  await fetch(`${LINE_API}/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      to,
      messages: [{ type: 'flex', altText, contents }],
    }),
  })
}

export async function replyMessage(replyToken: string, messages: object[]) {
  await fetch(`${LINE_API}/reply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  })
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
export function buildWelcomeFlex(): object {
  return {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '20px',
      spacing: 'none',
      contents: [
        { type: 'text', text: '歡迎使用 MooLah 🌿', weight: 'bold', size: 'xl', color: '#2C2825' },
        {
          type: 'text',
          text: '您的專屬美業預約助理，髮型・美甲・寵物・汽車美容，一站搞定。',
          size: 'sm',
          color: '#888',
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
            bulletText('輸入「我的預約」查看預約紀錄'),
            bulletText('輸入「取消預約」申請取消'),
            bulletText('輸入「設計師後台」進入後台管理'),
          ],
        },
        {
          type: 'text',
          text: '點下方按鈕開始探索職人並立即預約',
          size: 'xs',
          color: '#bbb',
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
          action: { type: 'uri', label: '立即預約', uri: `${BASE_URL}/discover` },
          style: 'primary',
          color: '#06C755',
          height: 'sm',
        },
      ],
    },
  }
}

function bulletText(text: string) {
  return {
    type: 'box',
    layout: 'horizontal',
    spacing: 'sm',
    contents: [
      { type: 'text', text: '•', size: 'sm', color: '#9b8ea0', flex: 0 },
      { type: 'text', text, size: 'sm', color: '#555', wrap: true },
    ],
  }
}

function numberedStep(num: string, text: string) {
  return {
    type: 'box',
    layout: 'horizontal',
    spacing: 'sm',
    contents: [
      { type: 'text', text: `${num}.`, size: 'sm', color: '#999', flex: 0 },
      { type: 'text', text, size: 'sm', color: '#555', wrap: true },
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
          color: '#888',
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
          color: '#bbb',
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
              color: '#888',
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
                color: '#888',
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
                color: '#888',
                margin: 'md',
                wrap: true,
              },
              {
                type: 'text',
                text: '點下方按鈕開始探索職人',
                size: 'xs',
                color: '#bbb',
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
              color: '#888',
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
          color: '#888',
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
          color: '#bbb',
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
          color: '#888',
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
          color: '#bbb',
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

// ── 預設回覆 Flex ──────────────────────────────────────────────────────────
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
          color: '#888',
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
