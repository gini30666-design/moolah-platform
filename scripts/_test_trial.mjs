// 驗證新的試用設定：上限 30、認領時從當下起算、預警門檻 24
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = Object.fromEntries(fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  .split('\n').filter(l => l.includes('=') && !l.trim().startsWith('#'))
  .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const TID = '_trialtest'
let pass = 0, fail = 0
const check = (n, ok, d) => { console.log(`${ok ? '✅' : '❌'} ${n}${d ? '  → ' + d : ''}`); ok ? pass++ : fail++ }

// 建一個 trial 職人 + 一個服務 + 排班
await sb.from('providers').delete().eq('id', TID)
await sb.from('providers').insert({
  id: TID, name: '額度測試', category: '測試', plan: 'trial',
  trial_start_at: new Date().toISOString(),
  trial_ends_at: new Date(Date.now() + 14 * 864e5).toISOString(),
  line_user_id: 'Utrialtest0000000000000000000000',
})
await sb.from('services').insert({ provider_id: TID, service_id: `${TID}-svc01`, name: '測試', price: 100, duration: 30 })
const DOW = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
await sb.from('availability').insert(DOW.map(d => ({
  provider_id: TID, type: 'schedule', day_or_date: d, start_time: '09:00', end_time: '18:00', active: true,
})))

// 灌 29 筆假預約（未達上限 30）
const day = (i) => { const d = new Date(Date.now() + (i + 2) * 864e5); return d.toISOString().slice(0, 10) }
const SLOTS = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00']
const rows = []
for (let i = 0; i < 29; i++) {
  rows.push({
    booking_id: `${TID}-b${i}`, provider_id: TID, service_id: `${TID}-svc01`,
    customer_name: 'T', customer_line_user_id: 'Ucustomer0000000000000000000000x',
    date: day(Math.floor(i / SLOTS.length)), time: SLOTS[i % SLOTS.length],
    created_at: new Date().toISOString(), status: 'confirmed',
  })
}
await sb.from('bookings').insert(rows)
const c1 = await sb.from('bookings').select('*', { count: 'exact', head: true }).eq('provider_id', TID)
check('灌入 29 筆試用預約', c1.count === 29, `count=${c1.count}`)

const book = (date, time) => fetch('https://moolah.studio/api/booking', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    providerId: TID, serviceId: `${TID}-svc01`, customerName: '額度測試客',
    customerLineUserId: 'Ucustomer0000000000000000000000y',
    customerPhone: '0900000000', date, time,
  }),
}).then(async r => ({ status: r.status, body: await r.json() }))

// 第 30 筆：應該成功（上限是 30，不是 20）
let r = await book(day(3), '09:00')
check('第 30 筆可預約（證明上限已從 20 提高）', r.status === 200 && r.body.success === true, `${r.status} ${JSON.stringify(r.body).slice(0,80)}`)

// 第 31 筆：應該被擋
r = await book(day(3), '10:00')
check('第 31 筆被擋（上限 30 生效）', r.status === 403 && r.body.error === 'unavailable', `${r.status} ${JSON.stringify(r.body).slice(0,80)}`)

const c2 = await sb.from('bookings').select('*', { count: 'exact', head: true }).eq('provider_id', TID)
check('實際只寫入 30 筆', c2.count === 30, `count=${c2.count}`)

// 清理
await sb.from('bookings').delete().eq('provider_id', TID)
await sb.from('providers').delete().eq('id', TID)
const gone = (await sb.from('providers').select('id').eq('id', TID)).data
const gb = (await sb.from('bookings').select('booking_id').eq('provider_id', TID)).data
check('測試資料已清除', gone.length === 0 && gb.length === 0)

console.log(`\n${fail === 0 ? '🎉 全部通過' : '⚠️ 有失敗'}：${pass} pass / ${fail} fail`)
process.exit(fail === 0 ? 0 : 1)
