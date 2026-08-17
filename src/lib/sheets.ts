// ============================================================
//  資料存取層 — Supabase-backed（2026-06-15 cutover）
//  保留與舊 Google Sheets 相同的函式介面（getSheetData / appendRow…），
//  讓 ~30 個只讀的路由免改；底層改成 PostgreSQL（型別正確、over-booking 約束）。
//  getSheetData 回傳 string[][]（與 Sheets 相同語意：值一律字串、null→''）。
// ============================================================
import { sb } from './supabase'
import { colToIndex } from './colRef'
import { isMissingProviderThemeColumn } from './providerTheme'

// （2026-07 清理）googleapis client 已移除：資料層全走 Supabase；
// 舊 Google Sheets client 只剩已退役的 opsAgent/drive 孤兒引用，不再於 live bundle 內。

// 每張表的「欄位順序」＝ 舊試算表 A,B,C… 的對應，routes 用 r[0],r[12] 索引取值
export const TABLE_COLS: Record<string, string[]> = {
  // ⚠️ 加欄位＝必須同步把讀取端的 'providers!A2:X' 範圍往後延，否則新欄讀不到（2026-08-01 教訓）
  providers: ['id','name','category','description','line_user_id','avatar_url','store_name','address','district','business_hours','phone','instagram','short_code','cover_url','rating','review_count','years','tagline','specialties','role','agreed_at','plan','trial_start_at','trial_ends_at','is_demo','portfolio_mode','theme'],
  services: ['provider_id','service_id','name','price','duration','description','image_url'],
  portfolio: ['provider_id','portfolio_id','image_url','caption','sort_order','created_at'],
  bookings: ['booking_id','provider_id','service_id','customer_name','customer_line_user_id','date','time','note','created_at','gender','hair_length','customer_phone','status'],
  availability: ['provider_id','type','day_or_date','start_time','end_time','active','break_start','break_end','slot_starts'],
  waitlist: ['id','provider_id','service_id','date','time','customer_name','customer_line_user_id','customer_phone','created_at','status'],
  reviews: ['booking_id','provider_id','customer_name','rating','comment','status','created_at'],
  customer_notes: ['provider_id','customer_line_user_id','note','updated_at','tags'],
  blacklist: ['provider_id','customer_line_user_id','customer_name','reason','created_at','source','customer_phone'],
  // 2026-08-13 加來源歸因（A:R）＋ first-touch／點擊 ID／分數（→AA，共 27 欄）
  // 沒有這些就只知道「有人填表」，不知道是哪支廣告帶來的、也分不出好壞客戶
  leads: ['id','name','category','district','contact','current_method','created_at','status','plan','utm_source','utm_medium','utm_campaign','utm_content','referrer','landing_path','fbp','fbc','note','first_utm_source','first_utm_medium','first_utm_campaign','first_utm_content','first_seen_at','fbclid','gclid','lead_score','qualified'],
  feedback: ['ts','area','severity','message','reporter','ua'],
}

function parseRange(range: string) {
  const [table, a1 = ''] = range.split('!')
  const m = a1.match(/^([A-Z]+)\d*(?::([A-Z]+)\d*)?$/)
  const startIdx = m ? colToIndex(m[1]) : 0
  // 沒指定結束欄時，以該表實際欄數為準（舊版寫死 25，表一超過 26 欄就會截斷）
  const tableEnd = (TABLE_COLS[table]?.length ?? 26) - 1
  const endIdx = m ? (m[2] ? colToIndex(m[2]) : colToIndex(m[1])) : tableEnd
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
  // providers 的 AA/theme 允許程式先上、DDL 後上：只在呼叫端真的要求 AA 時查 theme。
  // DDL 尚未核准／執行時，42703 會退回舊 A:Z，AA 以空字串回傳並由主題層正規化為預設值。
  const requestedCols = table === 'providers' ? cols.slice(0, endIdx + 1) : cols
  const runSelect = async (selectedCols: string[]) => {
    let query = sb.from(table).select(selectedCols.join(',')).order(cols[0], { ascending: true })
    // ⚠️ 第一欄幾乎都是 provider_id —— 查單一職人時整批同值，
    //    Postgres 對同值列「不保證」回傳順序，結果會隨查詢計畫飄動。
    //    補第二排序鍵（services→service_id、portfolio→portfolio_id…）讓順序穩定。
    //    2026-08-14 發現：Lia 有 31 項服務，預約頁預設選中的竟是最後一項。
    //    服務少的職人只是剛好沒被看出來，不是沒中招。
    if (cols[1]) query = query.order(cols[1], { ascending: true })
    if (filters) {
      for (const [k, v] of Object.entries(filters)) {
        if (selectedCols.includes(k)) query = query.eq(k, v)
      }
    }
    return query
  }

  let { data, error } = await runSelect(requestedCols)
  if (table === 'providers' && requestedCols.includes('theme') && isMissingProviderThemeColumn(error)) {
    const fallback = await runSelect(requestedCols.filter(column => column !== 'theme'))
    data = fallback.data
    error = fallback.error
  }
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
