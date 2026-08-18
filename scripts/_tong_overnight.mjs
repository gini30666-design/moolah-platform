// 彤：跨夜營業 12:00 – 隔日 01:00 的排法（2026-08-18 Gini 指示）
//
// 系統不支援「收工早於開工」的跨夜區間，所以把凌晨那段掛在「隔天」的排班上：
//   營業時段  00:00 – 00:00  ＝ 全天 48 格（'00:00' 收工 = 當日午夜 24:00）
//   午休      01:00 – 12:00  ＝ 把白天挖掉，同時讓 fits 擋住「跨過 01:00 的長時服務」
//   固定梯次  00:00 ＋ 12:00~23:30  ＝ 只顯示這些起點，01:00–11:30 的空格不會出現
//
// 效果（每一個日曆日）：00:00 起可約（≤60 分，剛好 01:00 收工）＋ 12:00–23:30。
// ⚠️ 90 分服務從 00:00 起會做到 01:30 → 被午休擋下，正確。
// ⚠️ 她若在後台重存排班，這組設定會被 UI 的單一區間覆蓋掉。
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = Object.fromEntries(fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  .split('\n').filter(l => l.includes('=') && !l.trim().startsWith('#'))
  .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const ID = 'tong'
// 00:00（承接前一天的營業）＋ 12:00 起每半小時到 23:30
const starts = ['00:00', ...Array.from({ length: 24 }, (_, i) => {
  const m = 12 * 60 + i * 30
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${m % 60 ? '30' : '00'}`
})]

const { error } = await sb.from('availability').update({
  start_time: '00:00',
  end_time: '00:00',
  break_start: '01:00',
  break_end: '12:00',
  slot_starts: starts.join(','),
  active: true,
}).eq('provider_id', ID).eq('type', 'schedule')
if (error) throw new Error(error.message)

const { data } = await sb.from('availability').select('day_or_date,start_time,end_time,break_start,break_end,slot_starts')
  .eq('provider_id', ID).eq('type', 'schedule')
console.log(`✅ 已更新 ${data.length} 天，梯次 ${starts.length} 個`)
console.log(data[0])
