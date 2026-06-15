// ============================================================
//  Sheets → Supabase 一次性遷移腳本
//  讀 Google Sheets（用 .env.local 既有服務帳號）→ 清洗 → 寫入 Supabase。
//  冪等：用 upsert，可重跑。
//
//  執行前：
//    1) 先在 Supabase SQL Editor 跑 supabase/schema.sql 建表
//    2) .env.local 補上： SUPABASE_URL=...  SUPABASE_SERVICE_ROLE_KEY=...
//    3) npm i @supabase/supabase-js
//  執行： node --env-file=.env.local scripts/migrate_sheets_to_supabase.mjs
//  乾跑（不寫入，只報告）： 加 --dry
// ============================================================
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

const DRY = process.argv.includes('--dry')

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
})
const sheets = google.sheets({ version: 'v4', auth })
const SHEET_ID = process.env.GOOGLE_SHEETS_ID

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

// ---------- 工具 ----------
const get = async range => (await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range })).data.values ?? []
const s = v => (v === undefined || v === null || String(v).trim() === '') ? null : String(v).trim()
const num = v => { const n = Number(s(v)); return Number.isFinite(n) ? n : null }
const ts = v => { const x = s(v); if (!x) return null; const d = new Date(x); return isNaN(d) ? null : d.toISOString() }
const date = v => { const x = s(v); return x ? x.slice(0, 10) : null } // 'YYYY-MM-DD'
const padTime = v => { const x = s(v); if (!x) return null; const m = x.match(/^(\d{1,2}):(\d{2})$/); return m ? `${m[1].padStart(2,'0')}:${m[2]}` : x } // '9:00'→'09:00'
const jtags = v => { try { const a = JSON.parse(s(v) || '[]'); return Array.isArray(a) ? a : [] } catch { return [] } }
const boolActive = v => String(s(v) ?? '').toLowerCase() !== 'false'

async function upsert(table, rows, conflict) {
  if (!rows.length) { console.log(`  ${table}: 0 筆`); return }
  if (DRY) { console.log(`  [dry] ${table}: 會寫入 ${rows.length} 筆`); return }
  const opts = conflict ? { onConflict: conflict } : undefined
  const { error } = await supabase.from(table).upsert(rows, opts)
  if (error) { console.error(`  ✗ ${table}:`, error.message); throw error }
  console.log(`  ✓ ${table}: ${rows.length} 筆`)
}

// ---------- 遷移 ----------
async function run() {
  console.log(`\n=== Sheets → Supabase 遷移${DRY ? '（乾跑）' : ''} ===\n`)

  // providers A..X
  const P = await get('providers!A2:X')
  await upsert('providers', P.filter(r => s(r[0])).map(r => ({
    id: s(r[0]), name: s(r[1]) ?? '(未命名)', category: s(r[2]), description: s(r[3]),
    line_user_id: s(r[4]), avatar_url: s(r[5]), store_name: s(r[6]), address: s(r[7]),
    district: s(r[8]), business_hours: s(r[9]), phone: s(r[10]), instagram: s(r[11]),
    short_code: s(r[12]), cover_url: s(r[13]), rating: num(r[14]), review_count: num(r[15]) ?? 0,
    years: num(r[16]), tagline: s(r[17]), specialties: s(r[18]), role: s(r[19]),
    agreed_at: ts(r[20]), plan: s(r[21]) ?? '', trial_start_at: ts(r[22]), trial_ends_at: ts(r[23]),
  })), 'id')

  // services A..G（service_id 唯一）
  const SV = await get('services!A2:G')
  await upsert('services', dedupe(SV.filter(r => s(r[1])).map(r => ({
    service_id: s(r[1]), provider_id: s(r[0]), name: s(r[2]) ?? '(未命名)', price: num(r[3]),
    duration: num(r[4]), description: s(r[5]), image_url: s(r[6]),
  })), 'service_id'), 'service_id')

  // portfolio A..F
  const PF = await get('portfolio!A2:F')
  await upsert('portfolio', dedupe(PF.filter(r => s(r[1])).map(r => ({
    portfolio_id: s(r[1]), provider_id: s(r[0]), image_url: s(r[2]), caption: s(r[3]),
    sort_order: num(r[4]) ?? 0, created_at: ts(r[5]),
  })), 'portfolio_id'), 'portfolio_id')

  // bookings A..M — 含「歷史重複預約自動修復」
  const BK = await get('bookings!A2:M')
  let books = BK.filter(r => s(r[0])).map(r => ({
    booking_id: s(r[0]), provider_id: s(r[1]), service_id: s(r[2]), customer_name: s(r[3]) ?? '(未填)',
    customer_line_user_id: s(r[4]), date: date(r[5]), time: padTime(r[6]), note: s(r[7]),
    created_at: ts(r[8]) ?? new Date().toISOString(), gender: s(r[9]), hair_length: s(r[10]),
    customer_phone: s(r[11]), status: s(r[12]) ?? 'confirmed',
  }))
  books = healDuplicateBookings(books)  // 把同時段重複的未取消預約，留最早一筆、其餘標 cancelled
  await upsert('bookings', dedupe(books, 'booking_id'), 'booking_id')

  // availability A..F
  const AV = await get('availability!A2:F')
  await upsert('availability', AV.filter(r => s(r[0]) && s(r[1])).map(r => ({
    provider_id: s(r[0]), type: s(r[1]), day_or_date: s(r[2]),
    start_time: padTime(r[3]), end_time: padTime(r[4]), active: boolActive(r[5]),
  })))  // 無自然鍵，直接 insert（重跑前先 truncate availability）

  // waitlist A..J
  const WL = await get('waitlist!A2:J')
  await upsert('waitlist', dedupe(WL.filter(r => s(r[0])).map(r => ({
    id: s(r[0]), provider_id: s(r[1]), service_id: s(r[2]), date: date(r[3]), time: padTime(r[4]),
    customer_name: s(r[5]), customer_line_user_id: s(r[6]), customer_phone: s(r[7]),
    created_at: ts(r[8]), status: s(r[9]) ?? 'pending',
  })), 'id'), 'id')

  // reviews A..G（booking_id 唯一，留最後一筆）
  const RV = await get('reviews!A2:G')
  await upsert('reviews', dedupe(RV.filter(r => s(r[0])).map(r => ({
    booking_id: s(r[0]), provider_id: s(r[1]), customer_name: s(r[2]),
    rating: num(r[3]), comment: s(r[4]), status: s(r[5]) ?? 'published', created_at: ts(r[6]),
  })), 'booking_id', true), 'booking_id')

  // customer_notes A..E（(provider,customer) 唯一，留最後一筆）
  const CN = await get('customer_notes!A2:E')
  await upsert('customer_notes', dedupe(CN.filter(r => s(r[0]) && s(r[1])).map(r => ({
    provider_id: s(r[0]), customer_line_user_id: s(r[1]), note: s(r[2]),
    updated_at: ts(r[3]), tags: jtags(r[4]),
  })), r => `${r.provider_id}|${r.customer_line_user_id}`, true), 'provider_id,customer_line_user_id')

  // blacklist A..F（無自然鍵）
  const BL = await get('blacklist!A2:F')
  await upsert('blacklist', BL.filter(r => s(r[0])).map(r => ({
    provider_id: s(r[0]), customer_line_user_id: s(r[1]), customer_name: s(r[2]),
    reason: s(r[3]), created_at: ts(r[4]), source: s(r[5]) ?? 'manual',
  })))

  // leads A..I
  const LD = await get('leads!A2:I')
  await upsert('leads', dedupe(LD.filter(r => s(r[0])).map(r => ({
    id: s(r[0]), name: s(r[1]), category: s(r[2]), district: s(r[3]), contact: s(r[4]),
    current_method: s(r[5]), created_at: ts(r[6]), status: s(r[7]) ?? 'new', plan: s(r[8]) ?? 'trial',
  })), 'id'), 'id')

  // feedback A..F（無自然鍵）
  const FB = await get('feedback!A2:F')
  await upsert('feedback', FB.filter(r => r.some(c => s(c))).map(r => ({
    ts: s(r[0]), area: s(r[1]), severity: s(r[2]), message: s(r[3]), reporter: s(r[4]), ua: s(r[5]),
  })))

  console.log(`\n=== 完成${DRY ? '（乾跑，未寫入）' : ''} ===\n`)
}

// 去重：keyFn 取鍵；keepLast=true 留最後一筆，否則留第一筆
function dedupe(rows, key, keepLast = false) {
  const kf = typeof key === 'function' ? key : r => r[key]
  const m = new Map()
  for (const r of rows) { const k = kf(r); if (keepLast || !m.has(k)) m.set(k, r) }
  return [...m.values()]
}

// 修復歷史 over-booking：同 provider+date+time 多筆未取消 → 留最早 created_at，其餘標 cancelled
function healDuplicateBookings(books) {
  const groups = new Map()
  for (const b of books) {
    if (b.status === 'cancelled' || !b.date || !b.time) continue
    const k = `${b.provider_id}|${b.date}|${b.time}`
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k).push(b)
  }
  let healed = 0
  for (const [, arr] of groups) {
    if (arr.length <= 1) continue
    arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    for (let i = 1; i < arr.length; i++) { arr[i].status = 'cancelled'; healed++ }
  }
  if (healed) console.log(`  ⚠ 修復歷史重複預約：${healed} 筆改為 cancelled（留最早一筆）`)
  return books
}

run().catch(e => { console.error('遷移失敗：', e); process.exit(1) })
