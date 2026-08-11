// 唯讀稽核 part 2：用 select('*') 拿真實欄位，並印出錯誤（part 1 猜錯欄位名又吞掉 error，差點誤報）
import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  .split('\n').filter(l => l.includes('=') && !l.trim().startsWith('#'))
  .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const line = (s) => console.log('\n' + '─'.repeat(58) + '\n' + s)

line('zuzu services（原始欄位）')
const { data: sv, error: se } = await sb.from('services').select('*').eq('provider_id', 'zuzu')
if (se) console.log('❌ error:', se.message)
console.log('筆數:', sv?.length)
if (sv?.length) {
  console.log('欄位:', Object.keys(sv[0]).join(', '))
  sv.forEach(s => console.log('  ', JSON.stringify(s)))
}

line('zuzu availability（原始欄位）')
const { data: av, error: ae } = await sb.from('availability').select('*').eq('provider_id', 'zuzu')
if (ae) console.log('❌ error:', ae.message)
console.log('筆數:', av?.length)
if (av?.length) { console.log('欄位:', Object.keys(av[0]).join(', ')); av.forEach(a => console.log('  ', JSON.stringify(a))) }

line('zuzu portfolio')
const { data: pf, error: pe } = await sb.from('portfolio').select('*').eq('provider_id', 'zuzu')
if (pe) console.log('❌ error:', pe.message)
console.log('筆數:', pf?.length)
pf?.forEach(p => console.log('  ', p.image_url?.slice(0, 70), '|', p.caption ?? ''))

line('zuzu providers 完整列（看有沒有缺欄位）')
const { data: pv } = await sb.from('providers').select('*').eq('id', 'zuzu').single()
Object.entries(pv ?? {}).forEach(([k, v]) => console.log('  ', k.padEnd(18), String(v ?? '(空)').slice(0, 80)))
