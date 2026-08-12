/**
 * 自由島海洋俱樂部（小琉球潛水）示範頁 seed
 *
 * ⚠️ 資料來源：她自己的官網 johnsam.tw/libertyislandocean 與 rezio 商店（公開頁）。
 *    只寫入「她公開寫出來的」東西 —— 沒有公開價格的活動（SUP／浮潛／獨木舟／夜遊／
 *    潮間帶導覽／住宿套裝）一律不編，等她自己給。編假價格是這種 demo 最快穿幫的方式。
 *
 * 用法：node scripts/_seed_liberty_island.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const P = 'liberty-island'
const IMG = '/clients/liberty-island'

const provider = {
  id: P,
  name: '自由島海洋俱樂部',
  category: '潛水教練',
  store_name: '小琉球潛水中心',
  role: '主理人・潛水教練',
  tagline: '乾淨是我們的堅持，安全是我們的承諾',
  description:
    '自由島海洋俱樂部位於屏東小琉球，提供潛水體驗、PADI／SDI 潛水考照、住宿套裝，' +
    '以及 SUP、獨木舟、浮潛、夜遊與潮間帶導覽。\n\n' +
    '體驗潛水採一對一教學與陪同，OW 考照最多 1:3 小班制，一人即可成團開課。' +
    '全套裝備免費使用，裝備區提供熱水，上岸就能溫暖洗淨。\n\n' +
    '無論是第一次接觸潛水、想考取國際證照，或想安排完整的小琉球假期，' +
    '住宿、船票、機車都能一起規劃。',
  address: '屏東縣琉球鄉上福村中華路25之15號',
  district: '屏東縣琉球鄉',
  phone: '0972982966',
  business_hours: '08:00–18:00（實際依當日海況調整）',
  avatar_url: `${IMG}/logo.jpg`,
  cover_url: `${IMG}/home-hero.jpg`,
  // 她官網公開標示 Google 5.0 星、250+ 則評論（來源：Google 商家）
  rating: 5.0,
  review_count: 250,
  specialties: '體驗潛水,PADI／SDI 考照,海龜共游,住宿套裝,小琉球導覽',
  short_code: 'liberty',
  // 潛水沒有「作品」可挑 → space 模式：區塊標題改「環境・設備」，
  // 且預約頁不會出現「靈感參考 — 從作品集挑選」那一段（那是美髮用的）
  portfolio_mode: 'space',
  plan: 'trial',        // 試用；trial_start/ends 留空 → 她認領當下才起算 14 天
  is_demo: false,
  line_user_id: null,
}

// 只放官網／rezio 上有公開標價的三項
const services = [
  { service_id: `${P}-svc01`, name: '體驗潛水｜教練 1v1', price: 2500, duration: 180,
    description: '免證照。含全套裝備、保險與水下攝影，教練一對一陪同下水。',
    image_url: `${IMG}/experience.jpg` },
  { service_id: `${P}-svc02`, name: '水肺潛水初階課程 OW｜3天2夜', price: 15000, duration: 480,
    description: 'PADI／SDI 國際證照課程，最多 1:3 小班制，一人成團開課。（此為第一天，後兩天教練會另行安排）',
    image_url: `${IMG}/course-beginner.jpg` },
  { service_id: `${P}-svc03`, name: '水肺潛水進階課程 AOW｜2天1夜', price: 14500, duration: 480,
    description: 'PADI 進階開放水域課程，深潛與導航等專長潛水。（此為第一天，隔日教練會另行安排）',
    image_url: `${IMG}/course-advanced.jpg` },
]

const portfolio = [
  ['pf01', 'gallery-turtle.jpg',     '海龜共游 — 小琉球經典海域'],
  ['pf02', 'gallery-diver.jpg',      '體驗潛水 — 教練一對一帶領'],
  ['pf03', 'gallery-coral.jpg',      'PADI／SDI 潛水課程'],
  ['pf04', 'gallery-clean-safe.jpg', '乾淨與安全 — 裝備與環境把關'],
  ['pf05', 'experience.jpg',         '第一次下水也能安心'],
  ['pf06', 'course-beginner.jpg',    'OW 考照小班制'],
  ['pf07', 'course-advanced.jpg',    '進階課程'],
].map(([id, file, caption], i) => ({
  provider_id: P, portfolio_id: `${P}-${id}`,
  image_url: `${IMG}/${file}`, caption, sort_order: i + 1,
  created_at: new Date().toISOString(),
}))

// 每天 08:00–18:00、不設午休（潛水沒有固定午休，行程照海況走）
// ⭐ 08:00 是 2026-08-12 全天時段表上線後才做得到的（原本寫死 09:00 起）
const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const availability = DOW.map(d => ({
  provider_id: P, type: 'schedule', day_or_date: d,
  start_time: '08:00', end_time: '18:00', active: true,
  break_start: null, break_end: null,
}))

async function main() {
  const up = async (table, rows, onConflict) => {
    const { error } = await sb.from(table).upsert(rows, { onConflict })
    if (error) throw new Error(`${table}: ${error.message}`)
    console.log(`✅ ${table.padEnd(14)} ${Array.isArray(rows) ? rows.length : 1} 筆`)
  }

  await up('providers', provider, 'id')
  await up('services', services.map(s => ({ provider_id: P, ...s })), 'service_id')
  await up('portfolio', portfolio, 'portfolio_id')

  // availability 沒有單一 PK，先清該職人的 schedule 再寫
  const { error: delErr } = await sb.from('availability').delete().eq('provider_id', P).eq('type', 'schedule')
  if (delErr) throw new Error(`availability delete: ${delErr.message}`)
  const { error: insErr } = await sb.from('availability').insert(availability)
  if (insErr) throw new Error(`availability insert: ${insErr.message}`)
  console.log(`✅ availability   ${availability.length} 筆（每日 08:00–18:00）`)

  console.log('\n🔗 職人頁     https://moolah.studio/liberty-island')
  console.log('🔗 預約頁     https://moolah.studio/liberty-island/book')
  console.log('🔗 短網址     https://moolah.studio/go/liberty')
  console.log('🔗 認領連結   https://liff.line.me/2009980332-eM2b6gtT?to=/claim/liberty-island')
}

main().catch(e => { console.error('❌', e.message); process.exit(1) })
