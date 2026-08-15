// 凱西／眼津時尚美學：服務、公休、地址電話（2026-08-15 她本人提供）
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = Object.fromEntries(
  fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')])
)
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const PID = 'janda'

// 加購與卸睫規則寫進說明 —— 系統沒有加購功能，且卸睫「續接免費」本來就是附屬項。
// ⚠️ 卸睫刻意不獨立上架：單列 NT$200 會讓職人頁顯示「NT$200 起」，
//    但她主力是 1,000–1,300，客人一眼會誤判定價帶。
const ADDON = '可加購下睫毛 +NT$200。卸睫：本店續接免費／本店不續接 200；他店續接 200／他店不續接 300。'

// name, price, duration, description
// ⚠️ 時長全部 90 分 —— 她只給了「1 個半小時」這一個數字。
//    補睫實務上通常較短，交付時要問她要不要縮短（設太長會讓她一天少接客人）。
const S = [
  ['美人魚・自然', 1000, 90, `美人魚系列・自然濃度。${ADDON}`],
  ['美人魚・微濃', 1100, 90, `美人魚系列・微濃。${ADDON}`],
  ['美人魚・濃密', 1200, 90, `美人魚系列・濃密。${ADDON}`],
  ['美人魚・爆濃', 1300, 90, `美人魚系列・爆濃。${ADDON}`],
  ['霸王睫毛膏 3D 款', 1200, 90, `3D Volume Lash。濃密纖長・捲翹持久・電眼放大。${ADDON}`],
  ['補睫（10 天內）', 400, 90, '距離上次接睫 10 天內回補。'],
  ['補睫（20 天內）', 600, 90, '距離上次接睫 20 天內回補。'],
  ['補睫（30 天內）', 800, 90, '距離上次接睫 30 天內回補。'],
]

await sb.from('services').delete().eq('provider_id', PID)
let r = await sb.from('services').insert(S.map(([name, price, duration, description], i) => ({
  provider_id: PID,
  service_id: `${PID}-svc${String(i + 1).padStart(2, '0')}`,
  name, price: String(price), duration: String(duration), description,
})))
if (r.error) throw r.error

// 公休：星期六
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
await sb.from('availability').delete().eq('provider_id', PID)
r = await sb.from('availability').insert(DAYS.map(d => ({
  provider_id: PID, type: 'schedule', day_or_date: d,
  start_time: '10:00', end_time: '21:00',
  active: d !== 'Saturday',            // 星期六公休
  break_start: null, break_end: null, slot_starts: null,
})))
if (r.error) throw r.error

r = await sb.from('providers').update({
  address: '高雄市楠梓區岳陽街48號',
  phone: '0900789827',
  business_hours: '10:00–21:00（週六公休）',
}).eq('id', PID)
if (r.error) throw r.error

const { data: svc } = await sb.from('services').select('name,price,duration').eq('provider_id', PID).order('service_id')
const { data: av } = await sb.from('availability').select('day_or_date,active').eq('provider_id', PID)
const { data: p } = await sb.from('providers').select('address,phone,business_hours').eq('id', PID).single()
console.log('=== 服務', svc.length, '項 ===')
svc.forEach(x => console.log(` ${x.name.padEnd(18)} NT$${String(x.price).padEnd(6)} ${x.duration}分`))
console.log('\n最低價 NT$' + Math.min(...svc.map(x => +x.price)))
console.log('營業日:', av.filter(x => x.active).map(x => x.day_or_date).join(', '))
console.log('公休:', av.filter(x => !x.active).map(x => x.day_or_date).join(', ') || '無')
console.log(p)
