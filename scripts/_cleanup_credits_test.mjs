// 清除 2026-08-11 手機驗收留下的測試儲值卡（designer-003）
// ⚠️ credit_ledger 有 append-only trigger，一般刪不掉；只有直連 DB 並開啟
//    app.allow_ledger_purge 才刪得動（app 端永遠不設這個變數）。
import pg from 'pg'
import fs from 'fs'

const env = Object.fromEntries(fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  .split('\n').filter(l => l.includes('=') && !l.trim().startsWith('#'))
  .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))

const c = new pg.Client({ connectionString: env.SUPABASE_DB_URL })
await c.connect()

const before = await c.query(`
  select cc.id, cc.provider_id, cc.title, cc.kind,
         coalesce(sum(cl.delta),0) as balance, count(cl.id) as entries
  from customer_credits cc left join credit_ledger cl on cl.credit_id = cc.id
  group by cc.id order by cc.id`)
console.log('清除前：')
before.rows.forEach(r => console.log(`  #${r.id} [${r.provider_id}] ${r.title} (${r.kind}) 餘額 ${r.balance} / ${r.entries} 筆流水`))

await c.query('begin')
await c.query(`set local app.allow_ledger_purge = 'on'`)
const del = await c.query(`delete from customer_credits where provider_id = 'designer-003' returning id`)
await c.query('commit')
console.log(`\n已刪除 ${del.rowCount} 張卡（designer-003 是示範帳號）`)

const after = await c.query(`select (select count(*) from customer_credits) a, (select count(*) from credit_ledger) b`)
console.log('清除後：customer_credits', after.rows[0].a, '筆 / credit_ledger', after.rows[0].b, '筆')
await c.end()
