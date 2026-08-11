// 資料稽核（唯讀）— 回答「資料到底在哪、某個職人有沒有東西、有沒有訂單」
//   用法：node scripts/audit_data.mjs [providerId]
//
// ⚠️ 欄位名以資料庫實際為準，不要憑印象寫：
//    services 的主鍵是 service_id（不是 id）、availability 的星期欄是 day_or_date（不是 day_of_week）。
//    2026-08-11 第一版就是猜錯欄位又吞掉 error，差點誤報「zuzu 沒有服務項目」（實際有 17 項）。
import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  .split('\n').filter(l => l.includes('=') && !l.trim().startsWith('#'))
  .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const only = process.argv[2]
const hr = (s) => console.log('\n' + '─'.repeat(58) + '\n' + s)

// 查詢一律印出 error，不要靜默回 null
async function q(table, build) {
  const { data, error, count } = await build(sb.from(table))
  if (error) { console.log(`  ❌ ${table}: ${error.message}`); return { rows: [], count: 0 } }
  return { rows: data ?? [], count: count ?? (data?.length ?? 0) }
}

hr('資料庫')
console.log('  ', env.SUPABASE_URL, '（Google Sheets 自 2026-06-15 起已不再寫入，只是歷史備份）')

const { rows: provs } = await q('providers', t => t.select('*').order('id'))
hr(`職人 ${provs.length} 位`)
for (const p of provs) {
  if (only && p.id !== only) continue
  const c = {}
  for (const [k, tb] of [['服務', 'services'], ['排班', 'availability'], ['照片', 'portfolio'], ['預約', 'bookings'], ['候補', 'waitlist'], ['儲值卡', 'customer_credits']]) {
    const r = await q(tb, t => t.select('*', { count: 'exact', head: true }).eq('provider_id', p.id))
    c[k] = r.count
  }
  console.log(`\n  [${p.id}] ${p.name}（${p.store_name ?? '—'}・${p.category ?? '—'}）`)
  console.log(`    認領 ${p.line_user_id ? '✅' : '❌'} ／ 方案 ${p.plan || '(空=不限)'} ${p.trial_ends_at ? '試用到 ' + String(p.trial_ends_at).slice(0, 10) : ''} ／ ${p.is_demo ? '示範帳號' : '正式帳號'}`)
  console.log(`    ` + Object.entries(c).map(([k, v]) => `${k} ${v}`).join(' ／ '))
  console.log(`    公開頁 https://moolah.studio/${p.id}${p.short_code ? '  短網址 /go/' + p.short_code : ''}`)
}

hr('預約（全系統，最近 20 筆）')
const { rows: bks, count: bkCount } = await q('bookings', t => t.select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(20))
console.log(`  總計 ${bkCount} 筆`)
bks.forEach(b => console.log(`  ${b.date} ${b.time}  ${String(b.provider_id).padEnd(13)} ${String(b.customer_name ?? '').padEnd(9)} ${b.service_name ?? ''} [${b.status || 'confirmed'}]`))

hr('各表筆數')
for (const t of ['leads', 'feedback', 'reviews', 'customer_notes', 'customer_history', 'blacklist', 'payments', 'customer_credits', 'credit_ledger', 'b2b_followers']) {
  const r = await q(t, x => x.select('*', { count: 'exact', head: true }))
  console.log(`  ${t.padEnd(20)} ${r.count}`)
}

hr('招商進線 leads')
const { rows: lds } = await q('leads', t => t.select('*').order('created_at', { ascending: false }).limit(10))
lds.forEach(l => console.log(`  ${String(l.created_at).slice(0, 16)}  ${l.name} ／ ${l.category ?? '—'} ／ ${l.contact} ／ ${l.status ?? ''}`))
