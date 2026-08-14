// Onboard：Lia／aura studio（台中大雅・美睫/霧唇/熱蠟/美甲）
// 服務＝28項收斂版（實際細項 32 筆）；時長為行情預設值，交付後由她自己在後台調整
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = Object.fromEntries(
  fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')])
)
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const PID = 'lia'
const BASE = 'https://moolah.studio/clients/lia'
const DRY = process.argv.includes('--dry')

const provider = {
  id: PID,
  name: 'Lia',
  store_name: 'aura studio',
  category: '美睫師',
  role: '主理人・美睫暨霧唇師',
  tagline: '乾淨、自然、剛剛好的那一種美',
  description: `aura studio 位於台中大雅，是 Lia 的個人工作室。

主打韓系乾淨路線 —— 極致單根美睫、霧唇、熱蠟除毛與手足美甲，都在同一個空間完成。不追求誇張，講究的是睜開眼那一刻的自然，和素顏也好看的底氣。

每一位客人都是一對一服務，睫毛會先做眼型調整再開始接，霧唇含三個月內補色，讓妝感慢慢養成自己的樣子。`,
  avatar_url: `${BASE}/lash.jpg`,
  cover_url: `${BASE}/lips.jpg`,
  address: '台中市大雅區中清北街53號',
  district: '台中市大雅區',
  business_hours: '10:30–19:00（不定期公休）',
  phone: '0979159528',
  instagram: '_hsuuuuuuuu',
  short_code: 'lia',
  specialties: '極致單根美睫,霧唇,熱蠟除毛,手足美甲',
  portfolio_mode: 'works',
  plan: 'trial',
  is_demo: false,
}

// name, price, duration(分), description
const S = [
  // ── 美睫（11）
  ['極致單根 80根', 900, 60, '含眼型調整。3 週內補睫 7 折。'],
  ['極致單根 100根', 1100, 70, '含眼型調整。3 週內補睫 7 折。'],
  ['極致單根 120根', 1300, 80, '含眼型調整。3 週內補睫 7 折。'],
  ['極致單根 140根', 1500, 90, '含眼型調整。3 週內補睫 7 折。'],
  ['極致單根 160根', 1700, 100, '含眼型調整。3 週內補睫 7 折。'],
  ['極致單根 180根 up', 1900, 110, '含眼型調整。3 週內補睫 7 折。'],
  ['仙女款・自然', 1400, 90, '適合睫毛較稀少的人（180 根以下）。'],
  ['仙女款・濃密', 1600, 100, '適合睫毛較稀少的人（180 根以上）。'],
  ['睫毛膏款', 1500, 90, '特殊款式。'],
  ['泰式濃密款', 1800, 110, '特殊款式。'],
  ['單根漫畫款', 1800, 110, '特殊款式。'],
  // ── 霧唇（4）
  ['霧唇', 6500, 150, '含三個月內補色乙次。兩人同行 -1000/人、學生證/護理師證/生日月 -500（擇一使用）。'],
  ['霧唇・淡色', 2500, 120, '兩人同行 -1000/人、學生證/護理師證/生日月 -500（擇一使用）。'],
  ['霧唇・補色', 3000, 90, ''],
  ['霧唇・淡色 3 堂', 6000, 120, '原價 7500。此為第一堂，後續堂數現場預約。'],
  // ── 熱蠟除毛（9）
  ['熱蠟・眉毛', 700, 20, '6 週內回除 8 折｜新客享 200 元折扣。'],
  ['熱蠟・小鬍子', 600, 20, '6 週內回除 8 折｜新客享 200 元折扣。'],
  ['熱蠟・腋下', 600, 30, '6 週內回除 8 折｜新客享 200 元折扣。'],
  ['熱蠟・半手', 700, 40, '6 週內回除 8 折｜新客享 200 元折扣。'],
  ['熱蠟・全手', 1200, 60, '6 週內回除 8 折｜新客享 200 元折扣。'],
  ['熱蠟・大腿', 1200, 50, '6 週內回除 8 折｜新客享 200 元折扣。'],
  ['熱蠟・小腿', 1400, 50, '6 週內回除 8 折｜新客享 200 元折扣。'],
  ['熱蠟・全腿', 2200, 80, '6 週內回除 8 折｜新客享 200 元折扣。'],
  ['熱蠟・巴西式全除', 2000, 60, '6 週內回除 8 折｜新客享 200 元折扣。'],
  // 低頻部位（腹部/胸部/手指手背/腳趾腳背/比基尼線）不單獨上架，寫在說明
  // ── 美甲（6）
  ['美甲・單色', 900, 60, '可跳一色。含基礎保養、加厚、卸甲。足部 +200。單指裝飾 +$20~100/指（現場計算）。'],
  ['美甲・特殊色', 1000, 75, '貓眼／碎鑽／蛋殼／魔鏡粉／鏡面。含基礎保養、加厚、卸甲。足部 +200。'],
  ['美甲・簡易造型', 1200, 90, '單色跳色、漸層、四指造型。含基礎保養、加厚、卸甲。足部 +200。'],
  ['美甲・基本造型', 1500, 120, '10 指法式、五指造型、立體簡易造型、堆鑽。足部 +200。'],
  ['美甲・複雜造型', 1800, 150, '暈染、手繪、造型排鑽、手捏造型。足部 +200。'],
  ['卸甲（本店）', 200, 30, '本店純卸。足部 400。他店純卸 300（足部 500）。可加購基礎保養 250／深層保養 550。'],
  // ── 其他（2）
  ['野生眉雕塑', 1000, 40, ''],
  ['手部深層保養', 750, 60, '指甲修型、甘皮修剪、去角質、保濕敷膜、護手霜、指緣油。'],
]

const PHOTOS = [
  ['lips.jpg', '霧唇 — 自然紅潤，素顏也有氣色'],
  ['lash.jpg', '極致單根 — 含眼型調整，睜眼就有神'],
  ['nail-hand.jpg', '暈染貓眼 — 金色線條，日常也戴得住'],
  ['nail-foot.jpg', '足部設計 — 貝殼光澤，乾淨溫柔'],
]

// 營業 10:30–19:00，七天皆開（不定期公休 → 她自己在後台關特定日）
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

if (DRY) {
  console.log('provider:', provider.id, provider.name, provider.store_name)
  console.log('服務', S.length, '筆｜照片', PHOTOS.length, '張｜排班', DAYS.length, '天')
  S.forEach((s, i) => console.log(` ${String(i + 1).padStart(2)}. ${s[0]}  NT$${s[1]}  ${s[2]}分`))
  process.exit(0)
}

// 1) provider
let r = await sb.from('providers').upsert(provider)
if (r.error) throw r.error

// 2) services（先清乾淨再寫，可重跑）
await sb.from('services').delete().eq('provider_id', PID)
r = await sb.from('services').insert(S.map(([name, price, duration, description], i) => ({
  provider_id: PID,
  service_id: `${PID}-svc${String(i + 1).padStart(2, '0')}`,
  name, price: String(price), duration: String(duration), description,
})))
if (r.error) throw r.error

// 3) portfolio
await sb.from('portfolio').delete().eq('provider_id', PID)
r = await sb.from('portfolio').insert(PHOTOS.map(([file, caption], i) => ({
  provider_id: PID,
  portfolio_id: `${PID}-pf${String(i + 1).padStart(2, '0')}`,
  image_url: `${BASE}/${file}`,
  caption,
  sort_order: String(i + 1),
  created_at: new Date().toISOString(),
})))
if (r.error) throw r.error

// 4) availability
await sb.from('availability').delete().eq('provider_id', PID)
r = await sb.from('availability').insert(DAYS.map(d => ({
  provider_id: PID, type: 'schedule', day_or_date: d,
  start_time: '10:30', end_time: '19:00', active: true,
  break_start: null, break_end: null, slot_starts: null,
})))
if (r.error) throw r.error

const { data: chk } = await sb.from('providers').select('id,name,store_name,plan,line_user_id').eq('id', PID).single()
const { count: sc } = await sb.from('services').select('*', { count: 'exact', head: true }).eq('provider_id', PID)
const { count: pc } = await sb.from('portfolio').select('*', { count: 'exact', head: true }).eq('provider_id', PID)
const { count: ac } = await sb.from('availability').select('*', { count: 'exact', head: true }).eq('provider_id', PID)
console.log('✅', chk, `服務 ${sc}／照片 ${pc}／排班 ${ac}`)
console.log('公開頁 https://moolah.studio/lia')
console.log('認領連結 https://liff.line.me/2009980332-eM2b6gtT?to=/claim/lia')
