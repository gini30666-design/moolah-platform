// 一次性 onboarding：zuzu / yu._.ni_studio（新竹熱蠟除毛）2026-08-06
// 可重跑（先刪同 id 的既有資料再寫入）
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = Object.fromEntries(fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  .split('\n').filter(l => l.includes('=') && !l.trim().startsWith('#'))
  .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const ID = 'zuzu'
const BASE = 'https://moolah.studio/clients/zuzu'

const provider = {
  id: ID,
  name: 'Zuzu',
  category: '熱蠟除毛師',
  description: '每一次的相遇，都不是理所當然。因為有妳的信任、選擇與支持，才有今天的 yu._.ni_studio。\n\n我們相信，美麗不需要迎合任何人，而是讓自己感到舒適、自信、自在。在這裡，每一次服務都希望帶給妳的不只是改變，更是一份放鬆、安心與被細心呵護的感受。\n\n願妳在這裡，放下疲憊、感受呵護，重新擁抱最自在的自己。',
  line_user_id: null,          // 待她走認領流程綁定
  avatar_url: null,            // ⏳ 待跟她要一張大頭照
  store_name: 'yu._.ni_studio',
  // 依她本人指示：不公開門牌，只到區域（私密處服務＋大樓工作室）
  address: '新竹市東區（近巨城，預約後提供詳細地址）',
  district: '新竹市',
  business_hours: '每日 09:00–16:00',
  phone: '0911405457',
  instagram: 'yu._.ni_studio',
  short_code: 'zuzu',
  cover_url: `${BASE}/cover.jpg`,
  rating: null,                // 新職人無評價，不造假（Day 47 策展政策：分數由公司決定，不是沒有就填）
  review_count: null,
  years: null,
  tagline: '每一位走進工作室的妳，都值得被溫柔對待',
  specialties: '熱蠟除毛,私密處除毛,頭療,泌乳',
  role: '熱蠟師 · yu._.ni_studio',
  agreed_at: null,             // 認領時寫入
  plan: 'active',              // ⚠️ 不用 trial：trial 上限 20 筆會直接擋真客人下單（見 CLAUDE.md onboarding 地雷）
  portfolio_mode: 'space',     // 除毛無「作品」可拍 → 環境・設備模式
  is_demo: false,
}

// 依她提供的價目表；分類用【】前綴（系統無分類功能），部位補「除毛」讓客人一眼看懂
const services = [
  ['【組合】腋下＋私密處除毛', 2000, 60, '人氣組合，一次完成兩個部位'],
  ['【組合】全手＋全腿除毛', 3000, 60, '手部與腿部全區，最超值的組合'],
  ['小鬍鬚除毛', 400, 15, '唇上細毛，妝感更服貼'],
  ['眉毛整理', 800, 15, '依臉型修出適合的眉形'],
  ['手指除毛', 300, 15, ''],
  ['手背除毛', 300, 15, ''],
  ['腋下除毛', 600, 20, '最多人第一次體驗的部位'],
  ['上手臂除毛', 800, 30, ''],
  ['下手臂除毛', 800, 30, ''],
  ['全手除毛', 1500, 45, '加贈手指除毛'],
  ['小腿除毛', 800, 30, ''],
  ['大腿除毛', 1200, 30, ''],
  ['全腿除毛', 2000, 45, '加贈腳趾除毛'],
  ['比基尼線除毛', 1200, 45, '部分 V.I.O'],
  ['法式除毛', 1600, 60, '保留 V、全除 I.O'],
  ['私密處全除', 1800, 60, '全除 V.I.O'],
  ['煥白明亮護理軟糖膜', 400, 15, '術後舒緩與亮白護理'],
]

// 她沒有固定公休、時間允許都接客 → 七天全開，不設午休（中午 12–13 可服務）
const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const portfolio = [
  ['01_room.jpg', '一次只服務一位・獨立隔間的安心空間'],
  ['02_lounge.jpg', '到店先坐下來，慢慢聊聊妳的狀況'],
  ['03_products.jpg', '義大利 RICA 蠟與術後保養，全系列常備'],
  ['04_sterilizer.jpg', '高溫滅菌鍋・器具每次使用前完整消毒'],
]

const now = new Date().toISOString()

// 重跑安全：先清掉舊資料（cascade 會帶走 services/portfolio/availability）
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
    start_time: '09:00', end_time: '16:00', active: true,
    break_start: null, break_end: null,
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
console.log('✅ zuzu 上線完成：providers=1,', counts.join(', '))
