import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n')
  .filter(l=>l.includes('=')&&!l.trim().startsWith('#'))
  .map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim()]}))
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const { data } = await sb.from('bookings').select('*').order('date')
for(const b of data){
  const lu = b.line_user_id ? String(b.line_user_id).slice(0,6)+'…' : 'NONE'
  console.log(`${b.date} ${b.time} | ${b.customer_name||''} | svc:${b.service_id||''} | status:${b.status||'(empty)'} | line:${lu} | phone:${b.customer_phone||''}`)
}
console.log('cols:', Object.keys(data[0]||{}).join(','))
