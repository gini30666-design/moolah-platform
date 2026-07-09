// MooLah 營運指標引擎 — 帳務/客戶成功/分析師 角色共用的唯讀資料快照。
// 用法：cd moolah-platform && env -u NODE_OPTIONS node scripts/moolah_metrics.mjs
// 讀 .env.local 憑證，查 Supabase，輸出 JSON 快照（唯讀，不寫入）。
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const MONTHLY_FEE = 699

const env = Object.fromEntries(
  fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').filter(l => l.includes('=')).map(l => {
      const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]
    })
)
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const fmtTW = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
const today = fmtTW(new Date())
const monthYm = today.slice(0, 7)
const addDaysISO = (base, n) => { const d = new Date(base + 'T12:00:00+08:00'); d.setDate(d.getDate() + n); return fmtTW(d) }
const days30ago = addDaysISO(today, -30)

const [{ data: providers = [] }, { data: services = [] }, { data: bookings = [] }, leadsRes, payRes] = await Promise.all([
  sb.from('providers').select('id,name,store_name,category,district,short_code,plan,trial_start_at,trial_ends_at'),
  sb.from('services').select('provider_id,service_id,price'),
  sb.from('bookings').select('provider_id,service_id,date,status,customer_line_user_id,customer_name'),
  sb.from('leads').select('id,status').then(r => r).catch(() => ({ data: [] })),
  sb.from('payments').select('provider_id,period,amount_due,amount_paid,status,method,paid_at').eq('period', monthYm).then(r => r).catch(() => ({ data: [] })),
])
const leads = leadsRes?.data || []
const payments = payRes?.data || []

const priceOf = (pid, sid) => Number(services.find(s => s.provider_id === pid && s.service_id === sid)?.price || 0)
const alive = (b) => b.status !== 'cancelled' && b.status !== 'no_show'

const rows = providers.map(p => {
  const bk = bookings.filter(b => b.provider_id === p.id)
  const svcCount = services.filter(s => s.provider_id === p.id).length
  const upcoming = bk.filter(b => (b.date || '') >= today && b.status !== 'cancelled').length
  const last30 = bk.filter(b => (b.date || '') >= days30ago && (b.date || '') <= today && b.status !== 'cancelled').length
  const revenueAll = bk.filter(alive).reduce((s, b) => s + priceOf(p.id, b.service_id), 0)
  const revenueMonth = bk.filter(b => (b.date || '').slice(0, 7) === monthYm && alive(b)).reduce((s, b) => s + priceOf(p.id, b.service_id), 0)
  const noShow = bk.filter(b => b.status === 'no_show').length
  const cancelled = bk.filter(b => b.status === 'cancelled').length
  const plan = (p.plan || '').toLowerCase()
  const trialEnds = p.trial_ends_at ? p.trial_ends_at.slice(0, 10) : null
  const daysToTrialEnd = trialEnds ? Math.round((new Date(trialEnds + 'T12:00:00+08:00') - new Date(today + 'T12:00:00+08:00')) / 86400000) : null

  // 狀態研判
  let status = 'active'
  if (plan === 'trial') status = (daysToTrialEnd != null && daysToTrialEnd < 0) ? 'trial_expired' : (daysToTrialEnd != null && daysToTrialEnd <= 3 ? 'trial_expiring' : 'trial')
  else if (plan === 'expired') status = 'expired'
  else status = 'active' // '' 或 active 視為正式
  // 覆蓋：未完成 onboarding / 沉睡
  const flags = []
  if (svcCount === 0) flags.push('未設服務(onboarding未完成)')
  if (status === 'active' && last30 === 0) flags.push('近30天0預約(沉睡)')
  if (status === 'trial_expiring') flags.push(`試用剩${daysToTrialEnd}天`)
  if (status === 'trial_expired') flags.push('試用已過期未轉正')
  if (noShow >= 3) flags.push(`no-show ${noShow}次`)

  // 本月付款狀態（正式職人才有意義）
  const pay = payments.find(x => x.provider_id === p.id)
  const payStatus = status === 'active' ? (pay ? pay.status : 'no_record') : 'n/a(試用/其他)'
  if (status === 'active' && (!pay || pay.status === 'unpaid')) flags.push('本月月費未繳/未建')

  return { id: p.id, name: p.name, store: p.store_name, category: p.category, district: p.district, short: p.short_code,
    plan: plan || '(空/正式)', status, trialEnds, daysToTrialEnd,
    svcCount, totalBookings: bk.length, upcoming, last30, revenueAll, revenueMonth, noShow, cancelled,
    payStatus, feePaid: pay?.amount_paid || 0, flags }
})

const activeRows = rows.filter(r => r.status === 'active')
const snapshot = {
  today, monthYm,
  totals: {
    providers: providers.length,
    active: activeRows.length,
    trial: rows.filter(r => r.status.startsWith('trial')).length,
    expired: rows.filter(r => r.status === 'expired' || r.status === 'trial_expired').length,
    bookings_total: bookings.length,
    bookings_month: bookings.filter(b => (b.date || '').slice(0, 7) === monthYm && b.status !== 'cancelled').length,
    revenue_month_all: rows.reduce((s, r) => s + r.revenueMonth, 0),
    monthly_fee_due: activeRows.length * MONTHLY_FEE, // 正式方案應收月費
    fee_collected: payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount_paid || 0), 0), // 本月實收月費
    fee_outstanding: activeRows.length * MONTHLY_FEE - payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount_paid || 0), 0), // 本月未收
    leads: leads.length,
  },
  atRisk: rows.filter(r => r.flags.length > 0).map(r => ({ id: r.id, name: r.name, flags: r.flags, last30: r.last30, upcoming: r.upcoming })),
  providers: rows,
  notes: [
    '付款追蹤：payments 表已建。Phase1 手動用 scripts/payment.mjs（generate/paid/unpaid/waive）；月初跑 `payment.mjs generate <YYYY-MM>` 建當月應收，收到轉帳用 `payment.mjs paid <id> <月>`。Phase2 綁第三方支付 API 自動寫。',
    '發票開立需加值中心(光貿)接好+工商憑證 → 目前 pending。',
    `月費 = NT$${MONTHLY_FEE}/正式帳號。`,
  ],
}
console.log(JSON.stringify(snapshot, null, 2))
