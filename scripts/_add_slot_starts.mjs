// 一次性 migration：availability 加 slot_starts（固定梯次制，留空＝現況每 30 分一格）
import pg from 'pg'
import fs from 'fs'

const env = Object.fromEntries(
  fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')])
)

const c = new pg.Client({ connectionString: env.SUPABASE_DB_URL })
await c.connect()
await c.query(`ALTER TABLE availability ADD COLUMN IF NOT EXISTS slot_starts TEXT`)
await c.query(`COMMENT ON COLUMN availability.slot_starts IS '固定梯次起始時間，逗號分隔如 08:00,10:00,13:00,15:00。留空＝營業時段內每 30 分一格（預設行為）'`)
const { rows } = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name='availability' ORDER BY ordinal_position`)
console.log('availability 欄位:', rows.map(r => r.column_name).join(', '))
await c.end()
