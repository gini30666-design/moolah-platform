import Anthropic from '@anthropic-ai/sdk'
import { getSheetData } from './sheets'
import { type ProviderData, buildDataBundleText } from './aiBundle'

// 延遲初始化：避免 module 載入時就要 ANTHROPIC_API_KEY
let _client: Anthropic | null = null
function anthropic(): Anthropic {
  return (_client ??= new Anthropic()) // 讀 ANTHROPIC_API_KEY
}

function todayTW(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}
function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00+08:00')
  d.setDate(d.getDate() + n)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

export async function gatherProviderData(providerId: string): Promise<ProviderData> {
  const [bookingRows, serviceRows] = await Promise.all([
    getSheetData('bookings!A2:M'),
    getSheetData('services!A2:F'),
  ])
  const mine = bookingRows.filter(r => r[1] === providerId)
  const services = serviceRows
    .filter(r => r[0] === providerId)
    .map(r => ({ name: (r[2] as string) ?? '', price: Number(r[3]) || 0, duration: Number(r[4]) || 0 }))
  const svcName = (sid: string) => (serviceRows.find(s => s[0] === providerId && s[1] === sid)?.[2] as string) || '服務'
  const svcPrice = (sid: string) => Number(serviceRows.find(s => s[0] === providerId && s[1] === sid)?.[3]) || 0

  const today = todayTW()
  const weekStart = addDays(today, -6)
  const monthYm = today.slice(0, 7)

  const upcoming = mine
    .filter(r => (r[5] as string) >= today && (r[12] ?? '') !== 'cancelled')
    .sort((a, b) => (a[5] + a[6]).localeCompare(b[5] + b[6]))
    .slice(0, 10)
    .map(r => ({ date: r[5] as string, time: r[6] as string, customerName: (r[3] as string) ?? '', customerPhone: (r[11] as string) ?? '', serviceName: svcName(r[2] as string) }))

  const statOf = (rows: typeof mine) => {
    const cnt = (st: string) => rows.filter(r => (r[12] ?? '') === st).length
    const revenue = rows.filter(r => (r[12] ?? '') !== 'cancelled' && (r[12] ?? '') !== 'no_show')
      .reduce((s, r) => s + svcPrice(r[2] as string), 0)
    return { confirmed: cnt('confirmed'), completed: cnt('completed'), cancelled: cnt('cancelled'), noShow: cnt('no_show'), revenue }
  }
  const weekRows = mine.filter(r => (r[5] as string) >= weekStart && (r[5] as string) <= today)
  const monthRows = mine.filter(r => (r[5] as string).slice(0, 7) === monthYm)

  const seen = new Map<string, number>()
  for (const r of mine) {
    if ((r[12] ?? '') === 'cancelled') continue
    const n = (r[3] as string) ?? ''
    if (n) seen.set(n, (seen.get(n) ?? 0) + 1)
  }
  const recentCustomers = [...seen.entries()].slice(0, 10).map(([name, visits]) => ({ name, visits }))

  return {
    today,
    upcoming,
    weekStats: { range: `${weekStart.slice(5)} – ${today.slice(5)}`, ...statOf(weekRows) },
    monthStats: { ym: monthYm, ...statOf(monthRows) },
    services,
    recentCustomers,
  }
}

const SYSTEM_PROMPT =
  `你是 MooLah 給設計師的「資料查詢助手」。只根據下方提供的資料，回答關於預約、行程、客人、服務、營收數字的事實問題。` +
  `不要提供經營建議、行銷點子、或與這些資料無關的內容——遇到這類問題，禮貌說明「這不在 MooLah 的服務範圍，我可以幫你查預約／行程／客人／服務／營收」。` +
  `找不到資料就直接說找不到。一律繁體中文、簡短、直接給答案，不要輸出推理過程。`

export async function answerProviderQuery(providerId: string, providerName: string, question: string): Promise<string> {
  const data = await gatherProviderData(providerId)
  const bundle = buildDataBundleText(data)
  const res = await anthropic().messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `【設計師：${providerName}】\n以下是你的 MooLah 資料：\n\n${bundle}\n\n———\n問題：${question}` }],
  })
  const text = res.content.filter(b => b.type === 'text').map(b => (b as { text: string }).text).join('\n').trim()
  return text || '抱歉，我沒能整理出答案，請換個方式問，或用關鍵字（今日／本週／我的預約）查詢。'
}
