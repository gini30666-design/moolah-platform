// 一次性 DDL（2026-08-06）：portfolio_mode（作品集 vs 環境照）＋ availability 午休欄位
import pg from 'pg'
import fs from 'fs'

const env = Object.fromEntries(fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  .split('\n')
  .filter(l => l.includes('=') && !l.trim().startsWith('#'))
  .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))

const c = new pg.Client({ connectionString: env.SUPABASE_DB_URL })
await c.connect()

await c.query(`ALTER TABLE providers ADD COLUMN IF NOT EXISTS portfolio_mode TEXT NOT NULL DEFAULT 'works'`)
await c.query(`ALTER TABLE availability ADD COLUMN IF NOT EXISTS break_start TEXT`)
await c.query(`ALTER TABLE availability ADD COLUMN IF NOT EXISTS break_end TEXT`)

const r = await c.query(`
  SELECT table_name, column_name FROM information_schema.columns
  WHERE table_name IN ('providers','availability')
    AND column_name IN ('portfolio_mode','break_start','break_end') ORDER BY 1,2`)
console.log('欄位已就位:', r.rows.map(x => `${x.table_name}.${x.column_name}`).join(', '))
console.log('現有職人:', (await c.query('SELECT id, portfolio_mode FROM providers')).rows)
await c.end()
