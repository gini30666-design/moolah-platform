import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n')
  .filter(l=>l.includes('=')&&!l.trim().startsWith('#'))
  .map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim()]}))
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const PID='designer-003'
const post = async () => {
  const r = await fetch('https://moolah-platform.vercel.app/api/booking', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ providerId:PID, serviceId:'designer-003-svc01', customerName:'TRIAL_GATE_TEST', date:'2026-07-15', time:'14:00', customerPhone:'900000000' })
  })
  return { status:r.status, body: await r.json().catch(()=>({})) }
}
// 1) 已過期試用 → 應 403
await sb.from('providers').update({ plan:'trial', trial_start_at:new Date(Date.now()-20*864e5).toISOString(), trial_ends_at:new Date(Date.now()-1*864e5).toISOString() }).eq('id',PID)
const expired = await post()
console.log('[過期試用] 預期 403 →', expired.status, JSON.stringify(expired.body))
// 2) 還原成空 plan（原狀，不限）
await sb.from('providers').update({ plan:'', trial_start_at:null, trial_ends_at:null }).eq('id',PID)
const { data:chk } = await sb.from('providers').select('plan,trial_ends_at').eq('id',PID).single()
console.log('[還原] designer-003 plan=', JSON.stringify(chk))
// 確認還原後可正常（不建立資料：用 availability 檢查即可，不再 POST 避免留資料）
