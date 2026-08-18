// 一次性 onboarding：tong / Tong 彤（桃園中壢・舒壓SPA／採耳／熱蠟／臉部）2026-08-18
// 資料來源：Gini Agent/moolah_clients/tong_桃園中壢/客戶資料_v1.md
// 可重跑（先刪同 id 的既有資料再寫入）
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = Object.fromEntries(fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  .split('\n').filter(l => l.includes('=') && !l.trim().startsWith('#'))
  .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const ID = 'tong'
const BASE = 'https://moolah.studio/clients/tong'

const provider = {
  id: ID,
  name: 'Tong 彤',                 // 原始為 Unicode 花體，Google 索引不到 → 系統用正常字
  category: '按摩舒壓師',
  description: '彤的工作室在桃園中壢，做的是舒壓、採耳、熱蠟與臉部保養。\n\n' +
    '從全身指油壓、深層筋膜刀調理，到耳燭淨化、熱蠟除毛與清粉刺，一個空間裡就能把身體從頭到腳照顧完。\n\n' +
    '營業到深夜、沒有公休 —— 不管你幾點下班，都留得住一段屬於自己的時間。',
  line_user_id: null,              // 待她走認領流程綁定
  avatar_url: `${BASE}/avatar.jpg`,
  store_name: null,
  address: '桃園市中壢區（預約後提供詳細地址）',   // 🔒 門牌不公開
  district: '桃園市',
  business_hours: '每日 12:00–00:00',
  phone: null,                     // Gini：不用補
  instagram: 'rose108710',
  short_code: 'tong',
  cover_url: `${BASE}/cover.jpg`,
  rating: null,                    // 新職人無評價，不造假
  review_count: null,
  years: null,
  tagline: '下班以後，才是照顧自己的時間',
  specialties: '舒壓SPA,採耳耳燭,熱蠟除毛,臉部保養,深夜營業',
  role: '舒壓・採耳・熱蠟 · 桃園中壢',
  agreed_at: null,                 // 認領時寫入
  plan: 'trial',                   // ⭐ Wen 集團的唯一試用帳號（其餘美容師走 ?direct=1）
  portfolio_mode: 'space',         // 按摩／採耳／熱蠟沒有「作品」可拍
  is_demo: false,
}

// 加購一律寫進主項說明，不建獨立品項（時長 0 的品項任何時段都約得到且不鎖時段）
const services = [
  // 美體暖心舒壓 SPA
  ['【舒壓SPA】全身指油壓', 2000, 90, '含頭部舒刮按摩，搭配舒展拉筋。新客首次優惠 $500。可加購（含在時間內）：深層筋膜刀調理 +$500（改善久坐／運動／乳酸堆積）、背部刮痧／拔罐 +$500（促進循環、溫和排濕）'],
  // 耳部 SPA
  ['【耳部SPA】舒眠採耳護理／耳穴按摩', 1000, 60, '清潔耳道髒污'],
  ['【耳部SPA】耳燭顱內淨化／頭部舒壓', 800, 60, '顱內淨化、排除濕氣'],
  ['【耳部SPA】採耳＋耳燭（優惠組合）', 1500, 60, '清潔耳道髒污＋顱內淨化排濕'],
  // 熱蠟除毛（共同說明）
  ['【熱蠟除毛】鼻毛', 600, 60, '實際依現場毛量情況評估，酌收材料費。可加購「嫩膚無痛除毛 +$500 起」'],
  ['【熱蠟除毛】腋下', 1000, 60, '實際依現場毛量情況評估，酌收材料費。可加購「嫩膚無痛除毛 +$500 起」'],
  ['【熱蠟除毛】八字鬍／下巴鬍／絡腮鬍（單區）', 800, 60, '實際依現場毛量情況評估，酌收材料費。可加購「嫩膚無痛除毛 +$500 起」'],
  ['【熱蠟除毛】鬍子三區全除', 2300, 60, '八字鬍＋下巴鬍＋絡腮鬍。實際依現場毛量情況評估，酌收材料費。可加購「嫩膚無痛除毛 +$500 起」'],
  ['【熱蠟除毛】上臂', 1000, 60, '實際依現場毛量情況評估，酌收材料費。可加購「嫩膚無痛除毛 +$500 起」'],
  ['【熱蠟除毛】下臂', 1200, 60, '實際依現場毛量情況評估，酌收材料費。可加購「嫩膚無痛除毛 +$500 起」'],
  ['【熱蠟除毛】胸部', 1500, 60, '實際依現場毛量情況評估，酌收材料費。可加購「嫩膚無痛除毛 +$500 起」'],
  ['【熱蠟除毛】腹部', 1200, 60, '實際依現場毛量情況評估，酌收材料費。可加購「嫩膚無痛除毛 +$500 起」'],
  ['【熱蠟除毛】全背部', 2000, 60, '實際依現場毛量情況評估，酌收材料費。可加購「嫩膚無痛除毛 +$500 起」'],
  ['【熱蠟除毛】全臀部', 1800, 60, '實際依現場毛量情況評估，酌收材料費。可加購「嫩膚無痛除毛 +$500 起」'],
  ['【熱蠟除毛】私密處', 4000, 60, '實際依現場毛量情況評估，酌收材料費。可加購「嫩膚無痛除毛 +$500 起」'],
  ['【熱蠟除毛】菊花', 1000, 60, '實際依現場毛量情況評估，酌收材料費。可加購「嫩膚無痛除毛 +$500 起」'],
  ['【熱蠟除毛】大腿', 1800, 60, '實際依現場毛量情況評估，酌收材料費。可加購「嫩膚無痛除毛 +$500 起」'],
  ['【熱蠟除毛】小腿', 1500, 60, '實際依現場毛量情況評估，酌收材料費。可加購「嫩膚無痛除毛 +$500 起」'],
  // 臉部 SPA
  ['【臉部SPA】基礎保養', 2480, 60, '深層清潔毛孔、改善膚質，含清粉刺'],
  ['【臉部SPA】深層煥膚', 2980, 90, '深層清潔毛孔、改善膚質，含清粉刺'],
  ['【臉部SPA】臉部撥筋', 1580, 40, '喚醒肌膚活力'],
]

// 全年無休、12:00–00:00（'00:00' 收工 = 當日午夜 24:00，見 lib/slots.ts）
const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const portfolio = [
  ['space-02.jpg', '熱蠟除毛・恆溫蠟爐與專用工具檯'],
  ['space-03.jpg', '臉部 SPA・深層清潔與清粉刺'],
  ['space-01.jpg', '深層筋膜刀調理・改善久坐與運動後的緊繃'],
  ['space-04.jpg', '背部拔罐・促進循環、溫和排濕'],
  ['space-05.jpg', '背部刮痧・可搭配全身指油壓加購'],
]

const now = new Date().toISOString()

await sb.from('providers').delete().eq('id', ID)

const { error: e1 } = await sb.from('providers').insert(provider)
if (e1) throw new Error('providers: ' + e1.message)

const { error: e2 } = await sb.from('services').insert(
  services.map(([name, price, duration, description], i) => ({
    provider_id: ID,
    service_id: `${ID}-svc${String(i + 1).padStart(2, '0')}`,
    name, price, duration, description, image_url: null,
  })))
if (e2) throw new Error('services: ' + e2.message)

const { error: e3 } = await sb.from('availability').insert(
  DOW.map(day => ({
    provider_id: ID, type: 'schedule', day_or_date: day,
    start_time: '12:00', end_time: '00:00', active: true,
    break_start: null, break_end: null, slot_starts: null,
  })))
if (e3) throw new Error('availability: ' + e3.message)

const { error: e4 } = await sb.from('portfolio').insert(
  portfolio.map(([file, caption], i) => ({
    provider_id: ID,
    portfolio_id: `${ID}-pf${String(i + 1).padStart(2, '0')}`,
    image_url: `${BASE}/${file}`,
    caption, sort_order: i + 1, created_at: now,
  })))
if (e4) throw new Error('portfolio: ' + e4.message)

const counts = await Promise.all(['services', 'portfolio', 'availability'].map(async t => {
  const { count } = await sb.from(t).select('*', { count: 'exact', head: true }).eq('provider_id', ID)
  return `${t}=${count}`
}))
console.log('✅ tong 上線完成：providers=1,', counts.join(', '))
