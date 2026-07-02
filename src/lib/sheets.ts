// ============================================================
//  資料存取層 — Supabase-backed（2026-06-15 cutover）
//  保留與舊 Google Sheets 相同的函式介面（getSheetData / appendRow…），
//  讓 ~30 個只讀的路由免改；底層改成 PostgreSQL（型別正確、over-booking 約束）。
//  getSheetData 回傳 string[][]（與 Sheets 相同語意：值一律字串、null→''）。
// ============================================================
import { sb } from './supabase'

// （2026-07 清理）googleapis client 已移除：資料層全走 Supabase；
// 舊 Google Sheets client 只剩已退役的 opsAgent/drive 孤兒引用，不再於 live bundle 內。

// 每張表的「欄位順序」＝ 舊試算表 A,B,C… 的對應，routes 用 r[0],r[12] 索引取值
const TABLE_COLS: Record<string, string[]> = {
  providers: ['id','name','category','description','line_user_id','avatar_url','store_name','address','district','business_hours','phone','instagram','short_code','cover_url','rating','review_count','years','tagline','specialties','role','agreed_at','plan','trial_start_at','trial_ends_at'],
  services: ['provider_id','service_id','name','price','duration','description','image_url'],
  portfolio: ['provider_id','portfolio_id','image_url','caption','sort_order','created_at'],
  bookings: ['booking_id','provider_id','service_id','customer_name','customer_line_user_id','date','time','note','created_at','gender','hair_length','customer_phone','status'],
  availability: ['provider_id','type','day_or_date','start_time','end_time','active'],
  waitlist: ['id','provider_id','service_id','date','time','customer_name','customer_line_user_id','customer_phone','created_at','status'],
  reviews: ['booking_id','provider_id','customer_name','rating','comment','status','created_at'],
  customer_notes: ['provider_id','customer_line_user_id','note','updated_at','tags'],
  blacklist: ['provider_id','customer_line_user_id','customer_name','reason','created_at','source'],
  leads: ['id','name','category','district','contact','current_method','created_at','status','plan'],
  feedback: ['ts','area','severity','message','reporter','ua'],
}

const COL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
function parseRange(range: string) {
  const [table, a1 = ''] = range.split('!')
  const m = a1.match(/^([A-Z]+)\d*(?::([A-Z]+)\d*)?$/)
  const startIdx = m ? COL.indexOf(m[1]) : 0
  const endIdx = m && m[2] ? COL.indexOf(m[2]) : (m ? COL.indexOf(m[1]) : 25)
  return { table, startIdx, endIdx }
}

// DB 值 → 字串（與 Sheets 一致）：null/undefined→''、boolean→'true'/'false'、物件→JSON、其餘 String()
function fmt(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

// filters（選填）：{ 欄位名: 值 } → 推去 Supabase 的 .eq()，避免「讀整表再 JS filter」的全表掃描。
// 只接受該表已知欄位（防注入/打錯欄名靜默無效）；值由 Supabase 參數化。
export async function getSheetData(
  range: string,
  filters?: Record<string, string>,
): Promise<string[][]> {
  const { table, startIdx, endIdx } = parseRange(range)
  const cols = TABLE_COLS[table]
  if (!cols) return []
  let query = sb.from(table).select(cols.join(',')).order(cols[0], { ascending: true })
  if (filters) {
    for (const [k, v] of Object.entries(filters)) {
      if (cols.includes(k)) query = query.eq(k, v)
    }
  }
  const { data, error } = await query
  if (error) { console.error('[getSheetData]', table, error.message); return [] }
  const rows = (data ?? []) as unknown as Record<string, unknown>[]
  return rows.map(row => {
    const full = cols.map(c => fmt(row[c]))
    return full.slice(startIdx, endIdx + 1)
  })
}

// 對應舊 appendRow：把 values（A 欄起的順序）映射成物件後 insert。valueInputOption 已無意義，保留簽名相容。
export async function appendRow(
  range: string,
  values: (string | number)[],
  _valueInputOption: 'USER_ENTERED' | 'RAW' = 'USER_ENTERED',
) {
  const { table } = parseRange(range)
  const cols = TABLE_COLS[table]
  if (!cols) throw new Error(`appendRow: unknown table ${table}`)
  const row: Record<string, unknown> = {}
  values.forEach((v, i) => { if (cols[i] !== undefined) row[cols[i]] = v === '' ? null : v })
  const { error } = await sb.from(table).insert(row)
  if (error) throw new Error(`appendRow ${table}: ${error.message}`)
}

// 舊：確保分頁存在。Supabase 表已建好 → no-op。
export async function ensureSheet(_title: string, _headers: string[]) { /* tables pre-created */ }

// 語意化：改預約狀態（by PK，乾淨）
export async function updateBookingStatus(bookingId: string, status: string): Promise<boolean> {
  const { error } = await sb.from('bookings').update({ status }).eq('booking_id', bookingId)
  return !error
}
