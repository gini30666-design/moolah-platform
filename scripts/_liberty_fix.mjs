// 自由島：① 四梯次 ② 移除策展評分/好評數（改用真實可講的賣點）
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = Object.fromEntries(
  fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')])
)
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const PID = 'liberty-island'
const DRY = process.argv.includes('--dry')

// 先看現況
const { data: before } = await sb.from('providers').select('rating,review_count,specialties').eq('id', PID).single()
console.log('改前 providers:', before)
const { data: av } = await sb.from('availability').select('day_or_date,start_time,end_time,active,slot_starts').eq('provider_id', PID).eq('type', 'schedule').order('day_or_date')
console.log('改前 availability:', av)

if (DRY) { console.log('\n--dry，未寫入'); process.exit(0) }

// ① 四梯：08:00 / 10:00 / 13:00 / 15:00（每梯 2 小時，最後一梯 15:00+2h=17:00 收工）
const { error: e1 } = await sb.from('availability')
  .update({ slot_starts: '08:00,10:00,13:00,15:00' })
  .eq('provider_id', PID).eq('type', 'schedule')
if (e1) throw e1

// ② 評分與好評數清空（沒有真實來源就不顯示；跑馬燈會自動改用不需資料的賣點）
const { error: e2 } = await sb.from('providers')
  .update({ rating: null, review_count: null })
  .eq('id', PID)
if (e2) throw e2

const { data: after } = await sb.from('providers').select('rating,review_count').eq('id', PID).single()
const { data: av2 } = await sb.from('availability').select('day_or_date,slot_starts').eq('provider_id', PID).eq('type', 'schedule')
console.log('\n改後 providers:', after)
console.log('改後 availability:', av2)
