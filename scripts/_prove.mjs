import pg from 'pg'
import fs from 'fs'

const env = Object.fromEntries(
  fs.readFileSync('/Users/gini/Desktop/MooLah/moolah-platform/.env.local', 'utf8')
    .split('\n').filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')])
)
const c = new pg.Client({ connectionString: env.SUPABASE_DB_URL })
await c.connect()

console.log('═══ SQL 三值邏輯 ═══')
const { rows: t } = await c.query(`SELECT (NULL <> 'cancelled') AS a, ('confirmed' <> 'cancelled') AS b`)
console.log('  NULL <> cancelled      =', t[0].a, '← null 即 UNKNOWN，partial index 不收這列')
console.log('  confirmed <> cancelled =', t[0].b)

const ins = (id, date, status) =>
  c.query(
    `INSERT INTO bookings (booking_id,provider_id,service_id,customer_name,customer_line_user_id,date,time,status,created_at)
     VALUES ($1,'zuzu','zuzu-svc01','測試','MANUAL',$2,'10:00',$3,now())`,
    [id, date, status]
  )

await c.query('BEGIN')

console.log('\n═══ 實測 A：status = NULL（手動建單目前的寫法）═══')
try {
  await ins('TEST_A', '2099-01-01', null)
  await ins('TEST_B', '2099-01-01', null)
  console.log('  🔴 兩筆同時段都寫進去了 —— 唯一約束對 NULL status 無效')
} catch (e) {
  console.log('  ✅ 第二筆被擋：', e.message.slice(0, 60))
}

console.log('\n═══ 實測 B：status = confirmed（線上預約的寫法）═══')
try {
  await ins('TEST_C', '2099-01-02', 'confirmed')
  await ins('TEST_D', '2099-01-02', 'confirmed')
  console.log('  🔴 兩筆都寫進去了')
} catch (e) {
  console.log('  ✅ 第二筆被擋：', e.message.split('\n')[0].slice(0, 60))
}

await c.query('ROLLBACK')
console.log('\n（已 ROLLBACK，未留下任何測試資料）')

const { rows: n } = await c.query(
  `SELECT count(*) FILTER (WHERE status IS NULL OR status = '') AS blank, count(*) AS total FROM bookings`
)
console.log('\n現有 bookings：總計', n[0].total, '｜status 空白或 NULL：', n[0].blank)
await c.end()
