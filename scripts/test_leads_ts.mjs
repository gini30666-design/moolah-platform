// 驗證 leads.created_at timestamptz：localized 字串會炸、ISO 會成功
import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

await sb.from('leads').delete().like('id', 'TESTLEAD%')

const localized = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })
const r1 = await sb.from('leads').insert({ id: 'TESTLEAD1', name: 't', created_at: localized, status: 'new', plan: 'trial' })
console.log(`localized "${localized}" →`, r1.error ? '✗ 失敗(證實 bug)：' + r1.error.message.slice(0, 50) : '✓ 竟成功')

const iso = new Date().toISOString()
const r2 = await sb.from('leads').insert({ id: 'TESTLEAD2', name: 't', created_at: iso, status: 'new', plan: 'trial' })
console.log(`ISO "${iso}" →`, r2.error ? '✗ 失敗：' + r2.error.message.slice(0, 50) : '✓ 成功(修復有效)')

await sb.from('leads').delete().like('id', 'TESTLEAD%')
console.log('已清理')
