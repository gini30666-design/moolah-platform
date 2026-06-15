// 用直連 Postgres 跑 supabase/schema.sql 建表
// node --env-file=.env.local scripts/run_schema.mjs
import { readFileSync } from 'node:fs'
import pg from 'pg'

const sql = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8')
const client = new pg.Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  console.log('已連線 Supabase Postgres，執行 schema…')
  await client.query(sql)
  const { rows } = await client.query(
    "select table_name from information_schema.tables where table_schema='public' order by table_name"
  )
  console.log('✓ 建表完成，public schema 現有表：')
  console.log('  ' + rows.map(r => r.table_name).join(', '))
} catch (e) {
  console.error('✗ 失敗：', e.message)
  process.exit(1)
} finally {
  await client.end()
}
