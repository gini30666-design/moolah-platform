// 明確用 node: 前綴 —— lib/line.ts 用裸 'crypto' 會在 edge 打包時噴警告，別重蹈覆轍
import crypto from 'node:crypto'
import type { FunnelStage } from './funnel'
import { META_EVENT } from './funnel'

// Meta Conversions API（伺服器對伺服器送轉換事件）
//
// 為什麼要做（2026-08-13）：
//   zuzu 8/6 真的送出了招商表單、`leads` 表也有那筆資料，
//   但 Meta Pixel **完全沒有收到那個 Lead 事件** —— 廣告封鎖器／iOS 隱私防護／
//   in-app browser 都可能吃掉瀏覽器端的 fbq()。而我們的廣告流量 100% 來自 Reels，
//   也就是 100% 在 in-app browser 裡。
//   結論：只靠瀏覽器 Pixel，轉換資料一定是不完整的。
//
// 運作方式：同一個動作在瀏覽器與伺服器各送一次、帶**同一個 event_id**，
//   Meta 會自動去重合併。瀏覽器那邊被擋掉時，伺服器這邊仍然算得到。
//
// ⚠️ 鐵律：這支永遠不能 throw。追蹤失敗絕不允許影響下單／認領／表單送出。

const PIXEL_ID = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || ''
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN || ''
/** 在 Events Manager「測試事件」頁拿到的代碼；設了才會進測試視窗，正式上線要拿掉 */
const TEST_CODE = process.env.META_CAPI_TEST_CODE || ''
const GRAPH_VERSION = 'v21.0'

export function capiEnabled(): boolean {
  return Boolean(PIXEL_ID && ACCESS_TOKEN)
}

/** Meta 要求 PII 一律 SHA256（小寫去空白後再雜湊） */
function hash(v?: string | null): string | undefined {
  const s = (v ?? '').trim().toLowerCase()
  if (!s) return undefined
  return crypto.createHash('sha256').update(s).digest('hex')
}

/**
 * 電話正規化成 E.164（不含 +）。
 *
 * ⚠️ 這一步錯了不會報錯，只會讓 Meta 的比對率變 0 ——
 *    雜湊值對不上就是「查無此人」，事件照收但歸因不到任何廣告。
 *    台灣手機 09xxxxxxxx → 8869xxxxxxxx
 *    輸入可能夾雜「Line: zuzuyo 電話：0911405457」這種混合字串，所以先抽數字。
 */
export function normalizePhoneE164(raw?: string | null): string | undefined {
  if (!raw) return undefined
  const d = raw.replace(/\D/g, '')
  if (!d) return undefined
  if (d.startsWith('886')) return d
  if (d.startsWith('09') && d.length === 10) return '886' + d.slice(1)
  if (d.startsWith('9') && d.length === 9) return '886' + d
  // 市話 0x-xxxxxxx 同樣去掉開頭 0 加國碼
  if (d.startsWith('0') && d.length >= 9) return '886' + d.slice(1)
  return d.length >= 8 ? d : undefined
}

function hashPhone(raw?: string | null): string | undefined {
  return hash(normalizePhoneE164(raw))
}

export type CapiUser = {
  email?: string | null
  phone?: string | null
  /** 我們自己的穩定識別碼（providerId / lineUserId），會雜湊後送出 */
  externalId?: string | null
  clientIp?: string | null
  userAgent?: string | null
  /** 瀏覽器 cookie `_fbp` / `_fbc` —— 這兩個對比對率的幫助最大 */
  fbp?: string | null
  fbc?: string | null
}

export type CapiOptions = {
  eventId?: string
  eventSourceUrl?: string
  /** 沒有瀏覽器參與的伺服器事件（例如月費入帳）用 'system_generated' */
  actionSource?: 'website' | 'system_generated' | 'business_messaging'
  customData?: Record<string, unknown>
  /** 事件實際發生時間（秒）；預設現在。Meta 只接受 7 天內 */
  eventTime?: number
}

/**
 * 送一個漏斗事件到 Meta CAPI。
 * 回傳 true = Meta 收下了；false = 沒送或失敗（呼叫端不需要處理，純參考）。
 */
export async function sendCapiEvent(
  stage: FunnelStage,
  user: CapiUser = {},
  opts: CapiOptions = {},
): Promise<boolean> {
  if (!capiEnabled()) return false
  try {
    const userData: Record<string, unknown> = {}
    const em = hash(user.email); if (em) userData.em = [em]
    const ph = hashPhone(user.phone); if (ph) userData.ph = [ph]
    const ex = hash(user.externalId); if (ex) userData.external_id = [ex]
    if (user.clientIp) userData.client_ip_address = user.clientIp
    if (user.userAgent) userData.client_user_agent = user.userAgent
    if (user.fbp) userData.fbp = user.fbp
    if (user.fbc) userData.fbc = user.fbc

    // Meta 要求 user_data 至少有一個可比對欄位，否則整筆會被丟掉
    if (Object.keys(userData).length === 0) return false

    const event: Record<string, unknown> = {
      event_name: META_EVENT[stage],
      event_time: opts.eventTime ?? Math.floor(Date.now() / 1000),
      action_source: opts.actionSource ?? 'website',
      user_data: userData,
    }
    if (opts.eventId) event.event_id = opts.eventId
    if (opts.eventSourceUrl) event.event_source_url = opts.eventSourceUrl
    if (opts.customData) event.custom_data = opts.customData

    const body: Record<string, unknown> = { data: [event], access_token: ACCESS_TOKEN }
    if (TEST_CODE) body.test_event_code = TEST_CODE

    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      // 只記 log，不 throw —— 追蹤失敗不能影響業務流程
      console.error('[capi] http', res.status, (await res.text()).slice(0, 300))
      return false
    }
    return true
  } catch (e) {
    console.error('[capi]', e)
    return false
  }
}

/** 從 request 抽出 CAPI 需要的瀏覽器指紋（IP / UA / _fbp / _fbc） */
export function capiUserFromRequest(req: Request): CapiUser {
  const h = req.headers
  const cookie = h.get('cookie') ?? ''
  const pick = (name: string) => {
    const m = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))
    return m ? decodeURIComponent(m[1]) : undefined
  }
  // x-forwarded-for 可能是「client, proxy1, proxy2」→ 取第一個
  const xff = h.get('x-forwarded-for') ?? ''
  return {
    clientIp: xff.split(',')[0].trim() || h.get('x-real-ip') || undefined,
    userAgent: h.get('user-agent') || undefined,
    fbp: pick('_fbp'),
    fbc: pick('_fbc'),
  }
}
