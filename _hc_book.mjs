import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n')
  .filter(l=>l.includes('=')&&!l.trim().startsWith('#'))
  .map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim()]}))
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const PID='designer-003', BASE='https://moolah-platform.vercel.app'
const { data:p } = await sb.from('providers').select('line_user_id').eq('id',PID).single()
const gini = p.line_user_id
console.log('Gini LINE (provider+customer):', gini.slice(0,8)+'…')
// 找下一個可預約時段
const na = await (await fetch(`${BASE}/api/next-available?providerId=${PID}`)).json()
console.log('next-available:', JSON.stringify(na))
const date = na.date || na.nextDate, time = (na.slots&&na.slots[0])||na.time || na.nextTime
console.log('用時段:', date, time)
const book = async (name) => {
  const r = await fetch(`${BASE}/api/booking`,{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ providerId:PID, serviceId:'designer-003-svc01', customerName:name, customerLineUserId:gini, customerPhone:'0968081521', date, time })})
  return { status:r.status, body: await r.json().catch(()=>({})) }
}
const r1 = await book('封測-小明')
console.log('[預約1] →', r1.status, JSON.stringify(r1.body))
const r2 = await book('封測-小華')
console.log('[預約2 同時段 over-booking] 預期被擋 →', r2.status, JSON.stringify(r2.body))
console.log('BOOKING_ID=', r1.body.bookingId || '(none)')
