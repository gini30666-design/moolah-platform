// MooLah 內部 ops agent — Claude Opus 4.8 + 工具，把自然語言指令轉成 Google Sheets 操作
import Anthropic from '@anthropic-ai/sdk'
import { getSheetData, sheets, SHEET_ID } from './sheets'

const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://moolah-platform.vercel.app'
const CATEGORIES = ['髮型設計師', '寵物美容師', '汽車美容師', '美甲師']

const client = new Anthropic() // 讀 ANTHROPIC_API_KEY

const SYSTEM = `你是 MooLah 的內部營運助理，服務創辦人 Gini。透過工具協助她管理合作職人資料（寫入 Google Sheets）。
規則：
- providerId 一律用英文小寫 slug（例：emily、linda）。若 Gini 只給中文名沒給 slug，請自行取一個合理的英文 slug 並使用，並在回覆中說明你用了哪個 slug。
- 服務類別只能是：髮型設計師 / 寵物美容師 / 汽車美容師 / 美甲師。
- 新增職人成功後，務必回覆「認領連結」(傳給設計師認領後台) 與「短連結」。
- 一律用繁體中文、簡潔回覆，直接給最終結果，不要輸出推理過程。
- 若資訊不足或有疑義，先簡短反問再動作。`

const tools: Anthropic.Tool[] = [
  {
    name: 'add_provider',
    description: '新增一位合作職人到 providers 分頁，並回傳認領連結',
    input_schema: {
      type: 'object',
      properties: {
        providerId: { type: 'string', description: '英文小寫 slug，如 emily' },
        name: { type: 'string', description: '中文姓名或暱稱' },
        category: { type: 'string', enum: CATEGORIES },
        storeName: { type: 'string' },
        district: { type: 'string', description: '如 高雄市' },
        phone: { type: 'string' },
        instagram: { type: 'string' },
        tagline: { type: 'string', description: '一句話標語' },
        description: { type: 'string', description: '個人簡介' },
      },
      required: ['providerId', 'name', 'category'],
    },
  },
  {
    name: 'add_service',
    description: '為某位職人新增一個服務項目到 services 分頁',
    input_schema: {
      type: 'object',
      properties: {
        providerId: { type: 'string' },
        name: { type: 'string', description: '服務名稱' },
        price: { type: 'number' },
        duration: { type: 'number', description: '分鐘' },
        description: { type: 'string' },
      },
      required: ['providerId', 'name', 'price', 'duration'],
    },
  },
  {
    name: 'list_providers',
    description: '列出目前所有職人（id / 名稱 / 類別）',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_links',
    description: '取得某位職人的認領連結與短連結',
    input_schema: {
      type: 'object',
      properties: { providerId: { type: 'string' } },
      required: ['providerId'],
    },
  },
]

async function providerExists(providerId: string): Promise<boolean> {
  const rows = await getSheetData('providers!A2:A')
  return rows.some(r => r[0] === providerId)
}

async function execTool(name: string, input: Record<string, unknown>): Promise<string> {
  try {
    if (name === 'add_provider') {
      const p = input as { providerId: string; name: string; category: string; storeName?: string; district?: string; phone?: string; instagram?: string; tagline?: string; description?: string }
      if (!CATEGORIES.includes(p.category)) return JSON.stringify({ error: 'invalid_category', allowed: CATEGORIES })
      if (await providerExists(p.providerId)) return JSON.stringify({ error: 'already_exists', providerId: p.providerId })
      const nextRow = (await getSheetData('providers!A:A')).length + 1
      // A:id B:name C:category D:desc E:lineUserId F:avatar G:storeName H:address I:district
      // J:hours K:phone L:instagram M:shortCode N:cover O:rating P:reviewCount Q:years R:tagline S:specialties T:role
      const row = [
        p.providerId, p.name, p.category, p.description ?? '', '', '', p.storeName ?? '', '', p.district ?? '',
        '', p.phone ?? '', p.instagram ?? '', p.providerId, '', '', '', '', p.tagline ?? '', '', '',
      ]
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `providers!A${nextRow}:T${nextRow}`,
        valueInputOption: 'RAW',
        requestBody: { values: [row] },
      })
      return JSON.stringify({ ok: true, providerId: p.providerId, claimLink: `${BASE}/claim/${p.providerId}`, shortLink: `${BASE}/go/${p.providerId}` })
    }

    if (name === 'add_service') {
      const s = input as { providerId: string; name: string; price: number; duration: number; description?: string }
      if (!(await providerExists(s.providerId))) return JSON.stringify({ error: 'provider_not_found', providerId: s.providerId })
      const svcRows = await getSheetData('services!A2:F')
      const count = svcRows.filter(r => r[0] === s.providerId && r[1]).length
      const serviceId = `${s.providerId}-svc${String(count + 1).padStart(2, '0')}`
      const nextRow = (await getSheetData('services!A:A')).length + 1
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `services!A${nextRow}:F${nextRow}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[s.providerId, serviceId, s.name, String(s.price), String(s.duration), s.description ?? '']] },
      })
      return JSON.stringify({ ok: true, serviceId, name: s.name, price: s.price })
    }

    if (name === 'list_providers') {
      const rows = await getSheetData('providers!A2:C')
      const list = rows.filter(r => r[0]).map(r => ({ id: r[0], name: r[1], category: r[2] }))
      return JSON.stringify({ count: list.length, providers: list })
    }

    if (name === 'get_links') {
      const { providerId } = input as { providerId: string }
      if (!(await providerExists(providerId))) return JSON.stringify({ error: 'provider_not_found', providerId })
      return JSON.stringify({ providerId, claimLink: `${BASE}/claim/${providerId}`, shortLink: `${BASE}/go/${providerId}` })
    }

    return JSON.stringify({ error: 'unknown_tool', name })
  } catch (e) {
    return JSON.stringify({ error: 'exception', message: (e as Error).message })
  }
}

export async function runOps(userText: string): Promise<string> {
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: userText }]
  for (let i = 0; i < 6; i++) {
    const res = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2048,
      thinking: { type: 'disabled' },
      system: SYSTEM,
      tools,
      messages,
    })
    if (res.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content: res.content })
      const results: Anthropic.ToolResultBlockParam[] = []
      for (const block of res.content) {
        if (block.type === 'tool_use') {
          const out = await execTool(block.name, block.input as Record<string, unknown>)
          results.push({ type: 'tool_result', tool_use_id: block.id, content: out })
        }
      }
      messages.push({ role: 'user', content: results })
      continue
    }
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('\n')
      .trim()
    return text || '（完成）'
  }
  return '處理步驟過多，請簡化指令再試一次。'
}
