import crypto from 'crypto'

const LINE_API = 'https://api.line.me/v2/bot/message'
const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!

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
    size: 'mega',
    hero: {
      type: 'box',
      layout: 'vertical',
      contents: [],
      backgroundColor: '#9b8ea0',
      height: '80px',
      justifyContent: 'center',
      alignItems: 'center',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'md',
      paddingAll: '20px',
      contents: [
        {
          type: 'text',
          text: '歡迎使用 MooLah 🌿',
          weight: 'bold',
          size: 'xl',
          color: '#2C2825',
        },
        {
          type: 'text',
          text: '您的專屬美業預約助理，隨時為您服務。',
          size: 'sm',
          color: '#7a7a7a',
          wrap: true,
        },
        { type: 'separator', margin: 'md' },
        {
          type: 'text',
          text: '您可以：',
          size: 'sm',
          weight: 'bold',
          color: '#2C2825',
          margin: 'md',
        },
        {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          margin: 'sm',
          contents: [
            bulletText('點擊下方「立即預約」開始預約'),
            bulletText('輸入「我的預約」查看預約紀錄'),
            bulletText('輸入「取消預約」協助取消'),
          ],
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'button',
          action: {
            type: 'uri',
            label: '立即預約 →',
            uri: process.env.NEXT_PUBLIC_BASE_URL
              ? `${process.env.NEXT_PUBLIC_BASE_URL}/designer-001`
              : 'https://moolah-platform.vercel.app/designer-001',
          },
          style: 'primary',
          color: '#9b8ea0',
          height: 'sm',
        },
      ],
      paddingAll: '16px',
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
