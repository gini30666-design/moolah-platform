import { createClient } from '@supabase/supabase-js'
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
for (const t of ['providers','services','portfolio','bookings','availability','feedback']) {
  const { count, error } = await sb.from(t).select('*', { count: 'exact', head: true })
  console.log(`  ${t}: ${error ? 'ERR ' + error.message : count + ' 筆'}`)
}
const { data } = await sb.from('providers').select('id,name,plan,short_code').eq('id', 'designer-003').single()
console.log('  抽查 designer-003 ->', JSON.stringify(data))
