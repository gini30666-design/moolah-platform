// 臨時示意頁：凱西／JAN DA 眼津時尚美學（高雄楠梓・美睫）
// ⚠️ 只用她第一次索取時給的資料，不編造價格與營業時間。
//    服務與排班「刻意不建」——她還沒給價目表，寧可頁面少一塊，也不要放假價格給她看。
//    未成交要清除：node scripts/_onboard_janda.mjs --purge
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = Object.fromEntries(
  fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')])
)
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const PID = 'janda'
const BASE = 'https://moolah.studio/clients/janda'

if (process.argv.includes('--purge')) {
  await sb.from('portfolio').delete().eq('provider_id', PID)
  await sb.from('services').delete().eq('provider_id', PID)
  await sb.from('availability').delete().eq('provider_id', PID)
  await sb.from('providers').delete().eq('id', PID)
  console.log('🧹 已清除 janda')
  process.exit(0)
}

const provider = {
  id: PID,
  name: '凱西',
  store_name: 'JAN DA 眼津時尚美學',
  category: '美睫師',
  role: '主理人・美睫設計師',
  tagline: '客製化眼型設計・高級感＋完美比例',   // 取自她自己作品圖上的品牌語言
  description: `JAN DA 眼津時尚美學位於高雄楠梓，是專注客製化眼型設計的美睫工作室。

不做同一套模板 —— 依每個人的眼型、眼距與想要的感覺量身設計，追求的是高級感與完美比例。

款式從自然到濃密都能客製：美人魚濃密款、霸王睫毛怪 3D 款、美人魚爆濃款，濃密纖長、捲翹持久、電眼放大。`,
  avatar_url: `${BASE}/avatar.jpg`,
  cover_url: `${BASE}/w1.jpg`,
  district: '高雄市楠梓區',
  instagram: 'Janda830527',
  short_code: 'janda',
  specialties: '客製化眼型設計,美人魚濃密款,3D 霸王睫毛怪,美人魚爆濃款',
  portfolio_mode: 'works',
  plan: 'trial',
  is_demo: false,
}

const PHOTOS = [
  ['w1.jpg', '美人魚濃密款 — 濃密纖長・層次分明'],
  ['w2.jpg', '霸王睫毛怪 3D 款 — 捲翹持久・電眼放大'],
  ['w3.jpg', '美人魚爆濃款 — 濃密扇開・魅惑有神'],
]

let r = await sb.from('providers').upsert(provider)
if (r.error) throw r.error

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

const { data } = await sb.from('providers').select('id,name,store_name,district').eq('id', PID).single()
const { count } = await sb.from('portfolio').select('*', { count: 'exact', head: true }).eq('provider_id', PID)
console.log('✅', data, `照片 ${count} 張`)
console.log('頁面 https://moolah.studio/janda')
