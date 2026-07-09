import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n')
  .filter(l=>l.includes('=')&&!l.trim().startsWith('#'))
  .map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim()]}))
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const { data: before } = await sb.from('bookings').select('booking_id,date,time,customer_name,status')
console.log('刪除前', before.length, '筆：')
before.forEach(b=>console.log(`  ${b.date} ${b.time} ${b.customer_name} [${b.status}]`))
const ids = before.map(b=>b.booking_id)
const { error } = await sb.from('bookings').delete().in('booking_id', ids)
console.log(error? 'DELETE ERROR '+error.message : `已刪除 ${ids.length} 筆`)
const { count } = await sb.from('bookings').select('*',{count:'exact',head:true})
console.log('刪除後 bookings count:', count)
