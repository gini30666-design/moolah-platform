// 唯讀稽核（2026-08-11）：資料到底存在哪、zuzu 有沒有東西、系統有沒有在跑
import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  .split('\n').filter(l => l.includes('=') && !l.trim().startsWith('#'))
  .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const line = (s) => console.log('\n' + '─'.repeat(60) + '\n' + s)

line('① 資料庫連的是哪一個')
console.log('SUPABASE_URL =', env.SUPABASE_URL)

line('② providers 全部職人')
const { data: provs, error: pe } = await sb.from('providers').select('*').order('id')
if (pe) console.log('❌', pe.message)
for (const p of provs ?? []) {
  console.log(`\n  [${p.id}] ${p.name ?? '(無名)'}`)
  console.log(`    店名          : ${p.store_name ?? '—'}`)
  console.log(`    類別          : ${p.category ?? '—'}`)
  console.log(`    已認領(LINE)  : ${p.line_user_id ? '✅ ' + String(p.line_user_id).slice(0, 10) + '…' : '❌ 未認領'}`)
  console.log(`    同意條款      : ${p.agreed_at ?? '—'}`)
  console.log(`    方案/試用     : plan=${p.plan || '(空)'} start=${p.trial_start_at ?? '—'} end=${p.trial_ends_at ?? '—'}`)
  console.log(`    短網址代碼    : ${p.short_code ?? '—'}`)
  console.log(`    示範帳號      : ${p.is_demo ? '是' : '否'}`)
  console.log(`    作品集模式    : ${p.portfolio_mode ?? '—'}`)
}

line('③ 各職人的資料量（服務 / 排班 / 照片 / 預約）')
for (const p of provs ?? []) {
  const counts = {}
  for (const [label, table] of [['服務', 'services'], ['排班', 'availability'], ['照片', 'portfolio'], ['預約', 'bookings'], ['候補', 'waitlist'], ['儲值卡', 'customer_credits']]) {
    const { count } = await sb.from(table).select('*', { count: 'exact', head: true }).eq('provider_id', p.id)
    counts[label] = count ?? 0
  }
  console.log(`  ${p.id.padEnd(14)}`, Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(' / '))
}

line('④ zuzu 的服務項目（前 25 筆）')
const { data: zsv } = await sb.from('services').select('id,name,price,duration,active').eq('provider_id', 'zuzu').order('id')
if (!zsv?.length) console.log('  （沒有任何服務項目）')
zsv?.slice(0, 25).forEach(s => console.log(`  ${String(s.price).padStart(5)} 元 / ${String(s.duration).padStart(3)} 分  ${s.name}`))
console.log(`  合計 ${zsv?.length ?? 0} 項`)

line('⑤ zuzu 的營業時間')
const { data: zav } = await sb.from('availability').select('*').eq('provider_id', 'zuzu')
if (!zav?.length) console.log('  （沒有排班資料 → 客人會看到全部時段不可約）')
zav?.forEach(a => console.log(`  ${String(a.day_of_week).padEnd(10)} ${a.active} ${a.start_time}-${a.end_time} 休 ${a.break_start ?? '—'}~${a.break_end ?? '—'}`))

line('⑥ 全系統 bookings（不分職人，最近 20 筆）')
const { data: bks, count: bkCount } = await sb.from('bookings').select('*', { count: 'exact' }).order('created_at', { ascending: false }).limit(20)
console.log(`  資料庫裡總共 ${bkCount} 筆預約`)
bks?.forEach(b => console.log(`  ${b.date} ${b.time}  ${String(b.provider_id).padEnd(13)} ${String(b.customer_name ?? '').padEnd(8)} ${b.service_name ?? ''} [${b.status || 'confirmed'}] 建立於 ${String(b.created_at).slice(0, 16)}`))

line('⑦ zuzu 的預約')
const { data: zbk, count: zc } = await sb.from('bookings').select('*', { count: 'exact' }).eq('provider_id', 'zuzu')
console.log(`  zuzu 共 ${zc ?? 0} 筆預約`)
zbk?.forEach(b => console.log(`  ${b.date} ${b.time} ${b.customer_name} ${b.service_name} [${b.status}]`))

line('⑧ 其他資料表現況（全系統）')
for (const t of ['leads', 'feedback', 'reviews', 'customer_notes', 'customer_history', 'blacklist', 'payments', 'customer_credits', 'credit_ledger', 'b2b_followers']) {
  const { count, error } = await sb.from(t).select('*', { count: 'exact', head: true })
  console.log(`  ${t.padEnd(20)} ${error ? '❌ ' + error.message : count + ' 筆'}`)
}

line('⑨ leads（招商表單進線）')
const { data: lds } = await sb.from('leads').select('*').order('created_at', { ascending: false }).limit(10)
lds?.forEach(l => console.log(`  ${String(l.created_at).slice(0, 16)}  ${l.name} / ${l.category ?? '—'} / ${l.district ?? '—'} / ${l.contact} / plan=${l.plan ?? '—'} / ${l.status ?? ''}`))
