// MooLah 付款追蹤 — Phase 1 手動控制（Gini 用）；Phase 2 第三方支付 API 呼叫同樣 markPaid 邏輯。
// 用法（cd moolah-platform && env -u NODE_OPTIONS node scripts/payment.mjs <cmd>）：
//   generate <YYYY-MM>              為所有「正式」職人建當月應收(unpaid)紀錄（試用不收）
//   list [YYYY-MM]                  列出該月付款狀態（預設當月）
//   paid <providerId> <YYYY-MM> [金額] [方式]   標記已繳（預設 699 / transfer）
//   unpaid <providerId> <YYYY-MM>  標記未繳
//   waive <providerId> <YYYY-MM>   標記免收(waived)
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const MONTHLY_FEE = 699
const env = Object.fromEntries(
  fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').filter(l => l.includes('=')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')] })
)
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const nowYm = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit' }).format(new Date()).slice(0, 7)
const [cmd, a1, a2, a3, a4] = process.argv.slice(2)

async function generate(period) {
  const { data: providers = [] } = await sb.from('providers').select('id,name,plan')
  const active = providers.filter(p => { const pl = (p.plan || '').toLowerCase(); return pl !== 'trial' && pl !== 'expired' }) // ''或active=正式
  let created = 0, skipped = 0
  for (const p of active) {
    const { error } = await sb.from('payments').insert({ provider_id: p.id, period, amount_due: MONTHLY_FEE, status: 'unpaid' })
    if (error) { if (/duplicate|unique/i.test(error.message)) skipped++; else console.error(p.id, error.message) }
    else created++
  }
  console.log(`✅ ${period}：新建 ${created} 筆應收、已存在跳過 ${skipped}（正式職人 ${active.length} 位）`)
}

async function list(period) {
  const { data = [] } = await sb.from('payments').select('provider_id,period,amount_due,amount_paid,status,method,paid_at').eq('period', period).order('provider_id')
  const { data: provs = [] } = await sb.from('providers').select('id,name,store_name')
  const nameOf = (id) => provs.find(p => p.id === id)?.name || id
  if (!data.length) { console.log(`（${period} 無付款紀錄，先跑 generate ${period}）`); return }
  console.log(`📋 ${period} 付款狀態：`)
  let due = 0, paid = 0
  for (const r of data) {
    const mark = r.status === 'paid' ? '✅已繳' : r.status === 'waived' ? '⚪免收' : '🔴未繳'
    console.log(`  ${mark}  ${nameOf(r.provider_id)}(${r.provider_id})  應收${r.amount_due} 實收${r.amount_paid}${r.method ? ' via ' + r.method : ''}${r.paid_at ? ' @' + r.paid_at.slice(0, 10) : ''}`)
    if (r.status !== 'waived') due += r.amount_due
    paid += r.amount_paid
  }
  console.log(`  ── 應收合計 ${due}｜實收 ${paid}｜未收 ${due - paid}`)
}

async function setStatus(providerId, period, status, amount, method) {
  const row = { provider_id: providerId, period, amount_due: MONTHLY_FEE, status,
    amount_paid: status === 'paid' ? (amount ? Number(amount) : MONTHLY_FEE) : 0,
    method: status === 'paid' ? (method || 'transfer') : null,
    paid_at: status === 'paid' ? new Date().toISOString() : null }
  const { error } = await sb.from('payments').upsert(row, { onConflict: 'provider_id,period' })
  if (error) { console.error('ERR', error.message); process.exit(1) }
  console.log(`✅ ${providerId} ${period} → ${status}${status === 'paid' ? ` (${row.amount_paid} via ${row.method})` : ''}`)
}

const run = {
  generate: () => generate(a1 || nowYm),
  list: () => list(a1 || nowYm),
  paid: () => setStatus(a1, a2, 'paid', a3, a4),
  unpaid: () => setStatus(a1, a2, 'unpaid'),
  waive: () => setStatus(a1, a2, 'waived'),
}
if (!run[cmd]) { console.log('用法: generate <YYYY-MM> | list [YYYY-MM] | paid <id> <YYYY-MM> [金額] [方式] | unpaid <id> <YYYY-MM> | waive <id> <YYYY-MM>'); process.exit(0) }
await run[cmd]()
