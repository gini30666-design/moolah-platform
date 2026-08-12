// OB 上線前體檢用：暫時開關某職人的 is_demo。
// 預約頁在非 LINE 環境會被 LineRequiredScreen 擋住，開 demo 才測得到完整流程。
// 用法：node scripts/ob_demo_toggle.mjs on|off
// ⚠️ 測完務必 off，並確認 bookings 筆數前後一致（腳本每次都會印出來）。
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.trim().startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim()]}))
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const P='liberty-island', want = process.argv[2]==='on'
const { count } = await sb.from('bookings').select('*',{count:'exact',head:true}).eq('provider_id',P)
const { error } = await sb.from('providers').update({ is_demo: want }).eq('id',P)
const { data } = await sb.from('providers').select('is_demo,plan,portfolio_mode,line_user_id,short_code').eq('id',P).single()
console.log(error ? '❌ '+error.message : `✅ is_demo=${data.is_demo}  bookings=${count}  plan=${data.plan}  mode=${data.portfolio_mode}  short=${data.short_code}  claimed=${data.line_user_id?'YES':'no'}`)
